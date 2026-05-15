from functools import wraps
from flask import Blueprint, session, redirect, request, current_app
from requests_oauthlib import OAuth2Session
from ..core.config import Config
from ..database import supabase
from ..utils.responses import success_response, error_response

auth_bp = Blueprint('auth', __name__)

def require_auth(role=None):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user' not in session:
                return error_response("Authentication required", status_code=401)
            
            if role == 'admin':
                discord_id = session['user'].get('discord_id')
                if discord_id not in Config.ADMIN_DISCORD_IDS:
                    return error_response("Admin privileges required", status_code=403)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@auth_bp.route('/auth/discord')
def login():
    if not all([Config.DISCORD_CLIENT_ID, Config.DISCORD_CLIENT_SECRET]):
        return error_response("Discord OAuth not configured", status_code=500)

    scope = ['identify']
    discord = OAuth2Session(Config.DISCORD_CLIENT_ID, redirect_uri=Config.DISCORD_REDIRECT_URI, scope=scope)
    authorization_url, state = discord.authorization_url(Config.DISCORD_AUTH_BASE_URL)
    session['oauth2_state'] = state
    session['auth_origin'] = request.args.get('origin', Config.FRONTEND_URL)
    return redirect(authorization_url)

@auth_bp.route('/auth/discord/callback')
def callback():
    origin = session.pop('auth_origin', Config.FRONTEND_URL)
    if request.values.get('error'):
        return redirect(f"{origin}/?error={request.values['error']}")

    discord = OAuth2Session(Config.DISCORD_CLIENT_ID, state=session.get('oauth2_state'), redirect_uri=Config.DISCORD_REDIRECT_URI)
    try:
        discord.fetch_token(Config.DISCORD_TOKEN_URL, client_secret=Config.DISCORD_CLIENT_SECRET, authorization_response=request.url)
        user_data = discord.get(Config.DISCORD_API_BASE_URL + '/users/@me').json()
        
        avatar = f"https://cdn.discordapp.com/avatars/{user_data['id']}/{user_data['avatar']}.png" if user_data.get('avatar') else None
        
        db_resp = supabase.rpc('update_user_from_discord_login', {
            'in_discord_id': user_data['id'],
            'in_username': user_data['username'],
            'in_email': user_data.get('email'),
            'in_avatar': avatar,
            'in_vatsim_cid': None
        }).execute()

        user = db_resp.data[0]
        session['user'] = {
            'id': user['id'],
            'discord_id': user['out_discord_id'],
            'username': user['username'],
            'avatar': user['avatar']
        }
        session.permanent = True
        return redirect(f"{origin}/?auth=success")
    except Exception as e:
        current_app.logger.error(f"Auth callback failed: {e}")
        return redirect(f"{origin}/?error=auth_failed")

@auth_bp.route('/api/auth/user')
def get_user():
    return success_response(data={"authenticated": 'user' in session, "user": session.get('user')})

@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return success_response(message="Logged out")
