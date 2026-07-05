import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
load_dotenv(Path(__file__).resolve().parents[1] / ".env.local", override=True)


class Config:
    SECRET_KEY = os.environ.get("SESSION_SECRET")
    if not SECRET_KEY:
        raise RuntimeError("Missing required environment variable: SESSION_SECRET")
    SESSION_COOKIE_NAME = "session_id"
    SESSION_COOKIE_HTTPONLY = True
    
    # For cross-origin cookies with credentials, we need Secure=True and SameSite=None
    # This is required when using CORS with supports_credentials=True
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_SAMESITE = "None"
    
    # Set cookie domain to allow sharing across subdomains if needed
    # If not set, defaults to current domain
    SESSION_COOKIE_DOMAIN = os.environ.get("SESSION_COOKIE_DOMAIN")
    
    PERMANENT_SESSION_LIFETIME = 2592000

    SUPABASE_URL = os.environ["SUPABASE_URL"]
    SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]

    DISCORD_CLIENT_ID = os.environ["DISCORD_CLIENT_ID"]
    DISCORD_CLIENT_SECRET = os.environ["DISCORD_CLIENT_SECRET"]
    DISCORD_REDIRECT_URI = os.environ.get("DISCORD_REDIRECT_URI", "http://localhost:5000/auth/discord/callback")
    DISCORD_API_BASE_URL = "https://discord.com/api"
    DISCORD_AUTH_BASE_URL = "https://discord.com/api/oauth2/authorize"
    DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token"

    ADMIN_DISCORD_IDS = [s.strip() for s in os.environ.get("ADMIN_DISCORD_IDS", "").split(",") if s.strip()]

    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
    ADMIN_URL = os.environ.get("ADMIN_URL", "")
    DEV_CORS_ORIGINS = os.environ.get("DEV_CORS_ORIGINS", "")

    RELAY_URL = os.environ.get("RELAY_URL", "https://ws.awdevsoftware.org")
