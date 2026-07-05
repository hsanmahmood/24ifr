from functools import wraps
from flask import session, redirect, request, jsonify
from requests_oauthlib import OAuth2Session
from postgrest import APIError

from .config import Config
from .database import supabase

_LOCAL_REDIRECT_URIS = {
    "http://localhost:5173": "http://localhost:5173/auth/discord/callback",
    "http://localhost:5174": "http://localhost:5174/auth/discord/callback",
}


def _resolve_redirect_uri(origin: str) -> str:
    if origin in _LOCAL_REDIRECT_URIS:
        return _LOCAL_REDIRECT_URIS[origin]
    return Config.DISCORD_REDIRECT_URI


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user" not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated


def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user" not in session:
            return jsonify({"error": "Authentication required"}), 401
        if not session["user"].get("is_admin"):
            return jsonify({"error": "Admin privileges required"}), 403
        return f(*args, **kwargs)
    return decorated


def discord_login():
    if not Config.DISCORD_CLIENT_ID or not Config.DISCORD_CLIENT_SECRET:
        return jsonify({"error": "Discord OAuth not configured"}), 500
    origin = request.args.get("origin", Config.FRONTEND_URL.split(",")[0] if Config.FRONTEND_URL else "http://localhost:5173")
    redirect_uri = _resolve_redirect_uri(origin)
    oauth = OAuth2Session(Config.DISCORD_CLIENT_ID, redirect_uri=redirect_uri, scope=["identify"])
    authorization_url, state = oauth.authorization_url(Config.DISCORD_AUTH_BASE_URL)
    session["oauth2_state"] = state
    session["oauth2_redirect_uri"] = redirect_uri
    session["auth_origin"] = origin
    return redirect(authorization_url)


def discord_callback():
    redirect_uri = session.pop("oauth2_redirect_uri", Config.DISCORD_REDIRECT_URI)
    default_origin = Config.FRONTEND_URL.split(",")[0] if Config.FRONTEND_URL else "http://localhost:5173"
    auth_origin = session.pop("auth_origin", default_origin)
    if request.values.get("error"):
        return redirect(f"{auth_origin}/?error={request.values['error']}")
    authorization_response = (
        f"{redirect_uri}?{request.query_string.decode()}" if request.query_string else redirect_uri
    )
    oauth = OAuth2Session(
        Config.DISCORD_CLIENT_ID,
        state=session.get("oauth2_state"),
        redirect_uri=redirect_uri,
    )
    try:
        oauth.fetch_token(
            Config.DISCORD_TOKEN_URL,
            client_secret=Config.DISCORD_CLIENT_SECRET,
            authorization_response=authorization_response,
        )
        discord_user = oauth.get(Config.DISCORD_API_BASE_URL + "/users/@me").json()
    except Exception:
        return redirect(f"{auth_origin}/?error=discord_auth_failed")
    avatar_url = (
        f"https://cdn.discordapp.com/avatars/{discord_user['id']}/{discord_user['avatar']}.png"
        if discord_user.get("avatar")
        else None
    )
    try:
        response = supabase.rpc(
            "update_user_from_discord_login",
            {
                "in_discord_id": discord_user["id"],
                "in_username": discord_user["username"],
                "in_email": discord_user.get("email"),
                "in_avatar": avatar_url,
                "in_vatsim_cid": None,
            },
        ).execute()
        db_user = response.data[0]
        if not db_user:
            raise ValueError("No user returned from upsert RPC")
    except APIError:
        return redirect(f"{auth_origin}/?error=db_error")
    except (ValueError, IndexError):
        return redirect(f"{auth_origin}/?error=db_error")
    session["user"] = {
        "id": db_user["id"],
        "discord_id": db_user["out_discord_id"],
        "username": db_user["username"],
        "avatar": db_user["avatar"],
        "is_admin": str(discord_user.get("id")) in Config.ADMIN_DISCORD_IDS,
    }
    session.permanent = True
    return redirect(f"{auth_origin}/?auth=success")


def get_current_user():
    return jsonify({"authenticated": "user" in session, "user": session.get("user")})


def logout():
    session.clear()
    return jsonify({"success": True})


def register(app):
    app.add_url_rule("/auth/discord", "discord_login", discord_login)
    app.add_url_rule("/auth/discord/callback", "discord_callback", discord_callback)
    app.add_url_rule("/api/auth/user", "get_current_user", get_current_user)
    app.add_url_rule("/api/auth/logout", "logout", logout, methods=["POST"])
