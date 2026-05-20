import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[1]

load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR / ".env.local", override=True)


def _env(name, default=None):
    value = os.environ.get(name)
    if value is None:
        return default
    value = value.strip()
    return value if value else default


def _bool_env(name, default):
    value = os.environ.get(name)
    if value is None or not value.strip():
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _default_session_cookie_secure():
    env_value = os.environ.get('SESSION_COOKIE_SECURE')
    if env_value is not None and env_value.strip():
        return env_value.strip().lower() in {"1", "true", "yes", "on"}

    frontend_url = _env('FRONTEND_URL', 'http://localhost:5173')
    return str(frontend_url).lower().startswith('https://')


def _default_session_cookie_samesite():
    return 'None' if _default_session_cookie_secure() else 'Lax'

class Config:
    SECRET_KEY = _env('SESSION_SECRET', 'dev-secret-key-change-in-production')
    SESSION_COOKIE_DOMAIN = _env('SESSION_COOKIE_DOMAIN')
    SESSION_COOKIE_SECURE = _bool_env('SESSION_COOKIE_SECURE', _default_session_cookie_secure())
    SESSION_COOKIE_SAMESITE = _env('SESSION_COOKIE_SAMESITE', _default_session_cookie_samesite())
    PERMANENT_SESSION_LIFETIME = 2592000

    SUPABASE_URL = _env("SUPABASE_URL")
    SUPABASE_ANON_KEY = _env("SUPABASE_ANON_KEY")

    DISCORD_CLIENT_ID = _env("DISCORD_CLIENT_ID")
    DISCORD_CLIENT_SECRET = _env("DISCORD_CLIENT_SECRET")
    DISCORD_REDIRECT_URI = _env("DISCORD_REDIRECT_URI", "http://localhost:5000/auth/discord/callback")
    DISCORD_API_BASE_URL = 'https://discord.com/api'
    DISCORD_AUTH_BASE_URL = f'{DISCORD_API_BASE_URL}/oauth2/authorize'
    DISCORD_TOKEN_URL = f'{DISCORD_API_BASE_URL}/oauth2/token'

    # Comma-separated Discord user IDs that should be treated as admins in the app
    ADMIN_DISCORD_IDS = _env('ADMIN_DISCORD_IDS', '')

    FRONTEND_URL = _env("FRONTEND_URL", "http://localhost:5173")

    RELAY_URL = _env('RELAY_URL', 'https://ws.awdevsoftware.org')
