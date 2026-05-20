from functools import wraps
from flask import session, redirect, request, jsonify, current_app
from requests_oauthlib import OAuth2Session
from postgrest import APIError

from .config import Config
from .database import supabase

LOCAL_REDIRECT_URIS = {
    'http://localhost:5173': 'http://localhost:5173/auth/discord/callback',
    'http://localhost:5174': 'http://localhost:5174/auth/discord/callback',
}


def _resolve_redirect_uri(origin):
    return LOCAL_REDIRECT_URIS.get(origin, Config.DISCORD_REDIRECT_URI)

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function

def require_admin(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return jsonify({"error": "Authentication required"}), 401
        if not session.get('user', {}).get('is_admin'):
            return jsonify({"error": "Admin privileges required"}), 403
        return f(*args, **kwargs)
    return decorated_function

def discord_login():
    if not all([Config.DISCORD_CLIENT_ID, Config.DISCORD_CLIENT_SECRET]):
        return jsonify({"error": "Discord OAuth not configured"}), 500

    scope = ['identify']
    auth_origin = request.args.get('origin', Config.FRONTEND_URL)
    redirect_uri = _resolve_redirect_uri(auth_origin)
    discord_session = OAuth2Session(Config.DISCORD_CLIENT_ID, redirect_uri=redirect_uri, scope=scope)
    authorization_url, state = discord_session.authorization_url(Config.DISCORD_AUTH_BASE_URL)
    session['oauth2_state'] = state
    session['oauth2_redirect_uri'] = redirect_uri
    session['auth_origin'] = auth_origin
    return redirect(authorization_url)

def discord_callback():
    redirect_uri = session.pop('oauth2_redirect_uri', Config.DISCORD_REDIRECT_URI)
    auth_origin = session.pop('auth_origin', Config.FRONTEND_URL)

    if request.values.get('error'):
        return redirect(f"{auth_origin}/?error={request.values['error']}")

    authorization_response = f"{redirect_uri}?{request.query_string.decode()}" if request.query_string else redirect_uri
    discord_session = OAuth2Session(Config.DISCORD_CLIENT_ID, state=session.get('oauth2_state'), redirect_uri=redirect_uri)

    try:
        token = discord_session.fetch_token(Config.DISCORD_TOKEN_URL, client_secret=Config.DISCORD_CLIENT_SECRET, authorization_response=authorization_response)
        user_json = discord_session.get(Config.DISCORD_API_BASE_URL + '/users/@me').json()
    except Exception as e:
        current_app.logger.error(f"Discord OAuth token fetch/user fetch error: {e}", exc_info=True)
        return redirect(f"{auth_origin}/?error=discord_auth_failed")

    try:
        avatar_url = f"https://cdn.discordapp.com/avatars/{user_json['id']}/{user_json['avatar']}.png" if user_json.get('avatar') else None

        response = supabase.rpc('update_user_from_discord_login', {
            'in_discord_id': user_json['id'],
            'in_username': user_json['username'],
            'in_email': user_json.get('email'),
            'in_avatar': avatar_url,
            'in_vatsim_cid': None
        }).execute()

        db_user = response.data[0]
        if not db_user:
            raise Exception("Failed to retrieve user from DB after upsert via RPC.")

        # Determine admin status from configured ADMIN_DISCORD_IDS (comma-separated)
        admin_ids_raw = getattr(Config, 'ADMIN_DISCORD_IDS', '') or ''
        admin_ids = [s.strip() for s in admin_ids_raw.split(',') if s.strip()]

        session['user'] = {
            'id': db_user['id'],
            'discord_id': db_user['out_discord_id'],
            'username': db_user['username'],
            'avatar': db_user['avatar'],
            'is_admin': str(user_json.get('id')) in admin_ids
        }
        session.permanent = True
    except APIError as e:
        current_app.logger.error(f"Supabase API Error: {e.message}", exc_info=True)
        return redirect(f"{auth_origin}/?error=db_error")
    except Exception as e:
        current_app.logger.error(f"Supabase user upsert error: {e}", exc_info=True)
        return redirect(f"{auth_origin}/?error=db_error")

    return redirect(f"{auth_origin}/?auth=success")

def get_current_user():
    return jsonify({"authenticated": 'user' in session, "user": session.get('user')})

def logout():
    session.pop('user', None)
    session.clear()
    return jsonify({"success": True, "message": "Logged out"})

def register(app):
    app.add_url_rule('/auth/discord', 'discord_login', discord_login)
    app.add_url_rule('/auth/discord/callback', 'discord_callback', discord_callback)
    app.add_url_rule('/api/auth/user', 'get_current_user', get_current_user)
    app.add_url_rule('/api/auth/logout', 'logout', logout, methods=['POST'])
