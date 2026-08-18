from supabase import create_client
from .config import Config
import os
import logging

logger = logging.getLogger(__name__)

if not Config.SUPABASE_URL:
    raise ValueError("SUPABASE_URL is not set.")

key = Config.SUPABASE_SERVICE_ROLE_KEY
if not key:
    if os.environ.get("FLASK_ENV") == "development" or os.environ.get("FLASK_DEBUG") == "1":
        logger.warning("SUPABASE_SERVICE_ROLE_KEY not set, falling back to SUPABASE_ANON_KEY. This is only safe in development.")
        key = Config.SUPABASE_ANON_KEY
    else:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY must be set in production")

if not key:
    raise ValueError("Either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY must be set.")

supabase = create_client(Config.SUPABASE_URL, key)
