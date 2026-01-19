from supabase import create_client, Client
from .config import Config

def get_supabase_client():
    if not Config.SUPABASE_URL:
        raise ValueError("SUPABASE_URL is not set.")
    if not Config.SUPABASE_ANON_KEY:
        raise ValueError("SUPABASE_ANON_KEY is not set.")
    
    return create_client(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY)
