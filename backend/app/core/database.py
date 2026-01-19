from supabase import create_client, Client
from .config import Config

supabase_admin: Client = None

def get_supabase_client():
    if not Config.SUPABASE_URL:
        raise ValueError("SUPABASE_URL is not set.")
    if not Config.SUPABASE_ANON_KEY:
        raise ValueError("SUPABASE_ANON_KEY is not set.")
    
    return create_client(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY)

def init_db():
    global supabase_admin
    
    if not Config.SUPABASE_URL:
        print("WARNING: SUPABASE_URL is not set. Database features will not work.")
        return
    
    if not Config.SUPABASE_SERVICE_KEY:
        print("WARNING: SUPABASE_SERVICE_KEY is not set. Admin operations will not work.")
        return
    
    try:
        supabase_admin = create_client(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_KEY)
        print("Supabase admin client initialized.")
    except Exception as e:
        print(f"ERROR: Supabase client failed to initialize: {e}")
        print("Database features will not work.")
