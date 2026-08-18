from functools import wraps
from flask import session, request, jsonify
import secrets
from .extensions import limiter

def generate_csrf_token():
    if 'csrf_token' not in session:
        session['csrf_token'] = secrets.token_hex(32)
    return session['csrf_token']

def validate_csrf_token():
    token = request.headers.get('X-CSRF-Token')
    if not token:
        return False
    return secrets.compare_digest(token, session.get('csrf_token', ''))

def require_csrf(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not validate_csrf_token():
            return jsonify({"error": "CSRF token missing or invalid"}), 403
        return f(*args, **kwargs)
    return decorated

def is_allowed_origin(origin: str, config):
    if not origin:
        return False
    
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "https://24ifr.hasanmahmood.org",
    ]
    
    def parse_origins(value):
        if not value or not isinstance(value, str):
            return []
        origins = []
        for origin in value.split(","):
            origin = origin.strip()
            if origin:
                origins.append(origin)
        return origins
    
    frontend_origins = parse_origins(getattr(config, "FRONTEND_URL", None))
    allowed_origins.extend(frontend_origins)
    
    admin_origin = getattr(config, "ADMIN_URL", None)
    if admin_origin:
        admin_origins = parse_origins(admin_origin)
        allowed_origins.extend(admin_origins)
    
    dev_origins = parse_origins(getattr(config, "DEV_CORS_ORIGINS", None))
    allowed_origins.extend(dev_origins)
    
    return origin in allowed_origins

RATE_LIMITS = {
    'discord_login': '100 per hour',
    'clearance_generate': '100 per minute',
    'clearance_track': '100 per minute',
    'feedback_submit': '100 per minute',
}