# Backend — Full Source (redacted secrets)

This document lists every file under `backend/` with full source. Secrets in code are redacted (replaced with `<REDACTED>`).

---

File: backend/wsgi.py

```python
from app import create_app

app = create_app()
```

---

File: backend/requirements.txt

```text
Flask
Flask-Cors
python-dotenv
supabase
gotrue
gunicorn
requests
websockets
requests-oauthlib
whitenoise
```

---

File: backend/gunicorn.conf.py

```python
import os

bind = "0.0.0.0:5000"
workers = int(os.environ.get('GUNICORN_WORKERS', 1))
loglevel = os.environ.get('GUNICORN_LOGLEVEL', 'info')
accesslog = "-"
errorlog = "-"
```

---

File: backend/Dockerfile

```dockerfile
FROM python:3.9-slim

ENV PYTHONPATH=/app

WORKDIR /app/backend

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5000

CMD ["gunicorn", "--config", "gunicorn.conf.py", "wsgi:app"]
```

---

File: backend/app/__init__.py

```python
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask, jsonify, session
from flask_cors import CORS
from whitenoise import WhiteNoise
from werkzeug.middleware.proxy_fix import ProxyFix
import uuid
import os
from .core.config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    app.config['SESSION_COOKIE_NAME'] = 'session_id'

    log_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    log_handler = RotatingFileHandler('app_errors.log', maxBytes=1024 * 1024, backupCount=5)
    log_handler.setFormatter(log_formatter)
    log_handler.setLevel(logging.ERROR)
    app.logger.addHandler(log_handler)
    app.logger.setLevel(logging.ERROR)

    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
    CORS(app, supports_credentials=True)
    app.wsgi_app = WhiteNoise(app.wsgi_app)

    @app.before_request
    def ensure_session_id():
        if 'session_id' not in session:
            session['session_id'] = str(uuid.uuid4())

    from .routes.auth import auth_bp
    from .routes.api import api_bp
    from .routes.status import status_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(api_bp)
    app.register_blueprint(status_bp)

    @app.errorhandler(404)
    def not_found(e):
        return jsonify(error='Not found'), 404

    @app.errorhandler(500)
    def internal_error(e):
        app.logger.error(f"Internal Server Error: {e}", exc_info=True)
        return jsonify(error="Internal server error"), 500

    return app
```

---

File: backend/app/routes/__init__.py

```text
# (empty)
```

---

File: backend/app/routes/status.py

```python
from flask import Blueprint, Response

status_bp = Blueprint('status_bp', __name__)

@status_bp.route('/')
def status_page():
    return Response("OK", mimetype='text/plain')
```

---

File: backend/app/routes/auth.py

```python
import time
from datetime import datetime, timezone
from flask import Blueprint, session, redirect, request, jsonify, current_app
from requests_oauthlib import OAuth2Session
from postgrest import APIError

from ..core.config import Config
from ..core.database import get_supabase_client

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/auth/discord')
def discord_login():
    if not all([Config.DISCORD_CLIENT_ID, Config.DISCORD_CLIENT_SECRET]):
        return jsonify({"error": "Discord OAuth not configured"}), 500

    scope = ['identify']
    discord_session = OAuth2Session(Config.DISCORD_CLIENT_ID, redirect_uri=Config.DISCORD_REDIRECT_URI, scope=scope)
    authorization_url, state = discord_session.authorization_url(Config.DISCORD_AUTH_BASE_URL)
    session['oauth2_state'] = state
    session['auth_origin'] = request.args.get('origin', Config.FRONTEND_URL)
    return redirect(authorization_url)

@auth_bp.route('/auth/discord/callback')
def discord_callback():
    auth_origin = session.pop('auth_origin', Config.FRONTEND_URL)

    if request.values.get('error'):
        return redirect(f"{auth_origin}/?error={request.values['error']}")

    discord_session = OAuth2Session(Config.DISCORD_CLIENT_ID, state=session.get('oauth2_state'), redirect_uri=Config.DISCORD_REDIRECT_URI)

    try:
        token = discord_session.fetch_token(Config.DISCORD_TOKEN_URL, client_secret=Config.DISCORD_CLIENT_SECRET, authorization_response=request.url)
        user_json = discord_session.get(Config.DISCORD_API_BASE_URL + '/users/@me').json()
    except Exception as e:
        current_app.logger.error(f"Discord OAuth token fetch/user fetch error: {e}", exc_info=True)
        return redirect(f"{auth_origin}/?error=discord_auth_failed")

    try:
        supabase = get_supabase_client()
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

@auth_bp.route('/api/auth/user')
def get_current_user():
    return jsonify({"authenticated": 'user' in session, "user": session.get('user')})

@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    session.clear()
    return jsonify({"success": True, "message": "Logged out"})
```

---

File: backend/app/routes/api.py

```python
try:
    from flask import Blueprint, jsonify, request, session, current_app
except Exception:
    Blueprint = type('Blueprint', (), {})
    def jsonify(x=None, **k):
        return x
    class _Req:
        json = {}
    request = _Req()
    session = {}
    class _DummyApp:
        def __init__(self):
            class _Log:
                def error(self, *a, **k):
                    pass
            self.logger = _Log()
    current_app = _DummyApp()
from ..core.database import get_supabase_client
from ..services.external_api import external_api_service
from ..utils.auth_utils import require_auth

api_bp = Blueprint('api_bp', __name__)

@api_bp.route('/api/health')
def health_check():
    try:
        relay = external_api_service.get_health()
    except Exception as e:
        current_app.logger.warning(f"relay health check failed: {e}")
        relay = None
    return jsonify({
        "status": "ok",
        "relay": relay,
    })

@api_bp.route('/api/controllers')
def get_controllers():
    try:
        return jsonify(external_api_service.get_controllers())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/api/atis')
def get_atis():
    try:
        return jsonify(external_api_service.get_atis())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/api/acft-data')
def get_acft_data():
    event = request.args.get('event', 'false').lower() in ('1','true','yes')
    try:
        return jsonify(external_api_service.get_acft_data(event=event))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/api/relay-health')
def relay_health():
    try:
        return jsonify(external_api_service.get_health())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/api/flight-plans')
def get_flight_plans():
    event = request.args.get('event', 'false').lower() in ('1','true','yes')
    try:
        plans = external_api_service.get_flight_plans(event=event)
        return jsonify(plans)
    except Exception as e:
        current_app.logger.error(f"Failed to fetch flight plans from relay: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch flight plans from relay", "details": str(e)}), 500

@api_bp.route('/api/leaderboard/details')
def get_leaderboard_details():
    try:
        supabase = get_supabase_client()
        response = supabase.rpc('get_leaderboard_details', {'p_limit': 10}).execute()
        return jsonify(response.data)
    except Exception as e:
        current_app.logger.error(f"Failed to fetch leaderboard details from Supabase: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch leaderboard details", "details": str(e)}), 500

@api_bp.route('/api/user/clearances')
def get_user_clearances():
    try:
        if 'user' not in session:
            return jsonify([])

        supabase = get_supabase_client()
        user_id = session['user']['id']
        response = supabase.rpc('get_user_clearances', {'p_user_id': user_id}).execute()
        return jsonify(response.data or [])
    except Exception as e:
        current_app.logger.error(f"Failed to fetch user clearances from Supabase: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch user clearances", "details": str(e)}), 500

@api_bp.route('/api/clearance-generated', methods=['POST'])
def track_clearance_generation():
    try:
        supabase = get_supabase_client()
        data = request.json

        clearance_data = {
            "user_id": session.get('user', {}).get('id'),
            "discord_username": session.get('user', {}).get('username'),
            "clearance_text": data.get('clearance_text'),
            "callsign": data.get('callsign'),
            "destination": data.get('destination')
        }

        supabase.from_('clearance_generations').insert(clearance_data).execute()

        return jsonify({"success": True})
    except Exception as e:
        current_app.logger.error(f"Failed to track clearance generation in Supabase: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500
```

---

File: backend/app/utils/auth_utils.py

```python
from functools import wraps
from flask import session, jsonify

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function
```

---

File: backend/app/utils/__init__.py

```text
# (empty)
```

---

File: backend/app/core/__init__.py

```text
# (empty)
```

---

File: backend/app/core/database.py

```python
from supabase import create_client, Client
from .config import Config

def get_supabase_client():
    if not Config.SUPABASE_URL:
        raise ValueError("SUPABASE_URL is not set.")
    if not Config.SUPABASE_ANON_KEY:
        raise ValueError("SUPABASE_ANON_KEY is not set.")
    
    return create_client(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY)
```

---

File: backend/app/core/config.py

```python
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SESSION_SECRET', '<REDACTED>')
    SESSION_COOKIE_DOMAIN = os.environ.get('SESSION_COOKIE_DOMAIN', '.hasanmahmood.org')
    SESSION_COOKIE_SAMESITE = 'None'
    SESSION_COOKIE_SECURE = True
    PERMANENT_SESSION_LIFETIME = 2592000

    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
    SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

    DISCORD_CLIENT_ID = os.environ.get("DISCORD_CLIENT_ID")
    DISCORD_CLIENT_SECRET = os.environ.get("DISCORD_CLIENT_SECRET")
    DISCORD_REDIRECT_URI = os.environ.get("DISCORD_REDIRECT_URI", "http://localhost:5000/auth/discord/callback")
    DISCORD_API_BASE_URL = 'https://discord.com/api'
    DISCORD_AUTH_BASE_URL = f'{DISCORD_API_BASE_URL}/oauth2/authorize'
    DISCORD_TOKEN_URL = f'{DISCORD_API_BASE_URL}/oauth2/token'

    FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://24ifr.hasanmahmood.org")

    DATA_API_BASE_URL = 'https://24data.ptfs.app'
    DATA_API_CONTROLLERS_URL = f'{DATA_API_BASE_URL}/controllers'
    DATA_API_ATIS_URL = f'{DATA_API_BASE_URL}/atis'
    DATA_API_WSS_URL = f'wss://{DATA_API_BASE_URL.replace("https://", "")}/wss'

    RELAY_URL = os.environ.get('RELAY_URL', 'https://ws.awdevsoftware.org')
```

---

File: backend/app/services/__init__.py

```text
# (empty)
```

---

File: backend/app/services/external_api.py

```python
import json
import threading
import time
from collections import defaultdict
import requests
from flask import current_app
from ..core.config import Config

_cache = {}
_cache_lock = threading.Lock()
_CACHE_TTL = 5  # seconds

class ExternalApiService:
    def __init__(self):
        self.session = requests.Session()

    def _get(self, path: str):
        url = Config.RELAY_URL.rstrip('/') + path
        now = time.time()
        with _cache_lock:
            entry = _cache.get(path)
            if entry and now - entry[0] < _CACHE_TTL:
                return entry[1]
        try:
            resp = self.session.get(url, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            with _cache_lock:
                _cache[path] = (now, data)
            return data
        except requests.exceptions.RequestException as e:
            current_app.logger.error(f"Failed to fetch {url}: {e}", exc_info=True)
            raise

    def get_controllers(self):
        return {"data": self._get("/controllers"), "lastUpdated": time.time(), "source": "relay"}

    def get_atis(self):
        return {"data": self._get("/atis"), "lastUpdated": time.time(), "source": "relay"}

    def get_flight_plans(self, event: bool = False):
        path = "/fpls/event" if event else "/fpls"
        return self._get(path)

    def get_acft_data(self, event: bool = False):
        path = "/acft-data/event" if event else "/acft-data"
        return self._get(path)

    def get_health(self):
        return self._get("/health")

external_api_service = ExternalApiService()
```

---

(End of document)
