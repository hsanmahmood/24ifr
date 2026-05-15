from supabase import create_client
from .core.config import Config

if not Config.SUPABASE_URL:
    raise ValueError("SUPABASE_URL is not set.")
if not Config.SUPABASE_ANON_KEY:
    raise ValueError("SUPABASE_ANON_KEY is not set.")

supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY)
