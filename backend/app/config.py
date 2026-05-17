import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SESSION_SECRET', 'dev-secret-key-change-in-production')
    SESSION_COOKIE_DOMAIN = os.environ.get('SESSION_COOKIE_DOMAIN', '.hasanmahmood.org')
    SESSION_COOKIE_SAMESITE = 'None'
    SESSION_COOKIE_SECURE = True
    PERMANENT_SESSION_LIFETIME = 2592000

    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")

    DISCORD_CLIENT_ID = os.environ.get("DISCORD_CLIENT_ID")
    DISCORD_CLIENT_SECRET = os.environ.get("DISCORD_CLIENT_SECRET")
    DISCORD_REDIRECT_URI = os.environ.get("DISCORD_REDIRECT_URI", "http://localhost:5000/auth/discord/callback")
    DISCORD_API_BASE_URL = 'https://discord.com/api'
    DISCORD_AUTH_BASE_URL = f'{DISCORD_API_BASE_URL}/oauth2/authorize'
    DISCORD_TOKEN_URL = f'{DISCORD_API_BASE_URL}/oauth2/token'

    # Comma-separated Discord user IDs that should be treated as admins in the app
    ADMIN_DISCORD_IDS = os.environ.get('ADMIN_DISCORD_IDS', '')

    FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://24ifr.hasanmahmood.org")

    RELAY_URL = os.environ.get('RELAY_URL', 'https://ws.awdevsoftware.org')
