from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path
import os

load_dotenv(Path(__file__).resolve().parents[0] / ".env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

if not url or not key:
    print("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

client = create_client(url, key)

try:
    result = client.table('advertisements').insert({
        'server_name': 'Test Discord Server',
        'invite_url': 'https://discord.gg/test123',
        'icon_url': 'https://example.com/icon.png',
        'description': 'Test description for advertisement system',
        'message': 'Test custom message',
        'is_active': True
    }).execute()
    print("Test advertisement created successfully")
    print(f"Result: {result.data}")
except Exception as e:
    print(f"Error creating test advertisement: {e}")
