from functools import wraps
from flask import session, redirect, request, jsonify, current_app
from requests_oauthlib import OAuth2Session
from postgrest import APIError

from .config import Config
from .database import supabase

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function

def discord_login():
    if not all([Config.DISCORD_CLIENT_ID, Config.DISCORD_CLIENT_SECRET]):
        return jsonify({"error": "Discord OAuth not configured"}), 500

    scope = ['identify']
    discord_session = OAuth2Session(Config.DISCORD_CLIENT_ID, redirect_uri=Config.DISCORD_REDIRECT_URI, scope=scope)
    authorization_url, state = discord_session.authorization_url(Config.DISCORD_AUTH_BASE_URL)
    session['oauth2_state'] = state
    session['auth_origin'] = request.args.get('origin', Config.FRONTEND_URL)
    return redirect(authorization_url)

def discord_callback():
    auth_origin = session.pop('auth_origin', Config.FRONTEND_URL)

    if request.values.get('error'):
        return redirect(f"{auth_origin}/?error={request.values['error']}")

    # Debugging: log the incoming request URL and forwarded proto header
    current_app.logger.info(f"Discord callback hit: request.url={request.url} X-Forwarded-Proto={request.headers.get('X-Forwarded-Proto')}")

    discord_session = OAuth2Session(Config.DISCORD_CLIENT_ID, state=session.get('oauth2_state'), redirect_uri=Config.DISCORD_REDIRECT_URI)

    try:
        token = discord_session.fetch_token(Config.DISCORD_TOKEN_URL, client_secret=Config.DISCORD_CLIENT_SECRET, authorization_response=request.url)
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

        session['user'] = {
            'id': db_user['id'],
            'discord_id': db_user['out_discord_id'],
            'username': db_user['username'],
            'avatar': db_user['avatar']
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
