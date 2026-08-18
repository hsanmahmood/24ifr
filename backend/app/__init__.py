from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
from .config import Config
from .extensions import limiter
from .security import RATE_LIMITS
from .blueprints import auth, relay, clearances, content, admin

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config['SESSION_COOKIE_NAME'] = 'session_id'

    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

    def parse_origins(value):
        if not value or not isinstance(value, str):
            return []
        origins = []
        for origin in value.split(","):
            origin = origin.strip()
            if origin:
                origins.append(origin)
        return origins

    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "https://24ifr.hasanmahmood.org",
    ]

    frontend_origins = parse_origins(getattr(Config, "FRONTEND_URL", None))
    allowed_origins.extend(frontend_origins)

    admin_origin = getattr(Config, "ADMIN_URL", None)
    if admin_origin:
        admin_origins = parse_origins(admin_origin)
        allowed_origins.extend(admin_origins)

    dev_origins = parse_origins(getattr(Config, "DEV_CORS_ORIGINS", None))
    allowed_origins.extend(dev_origins)

    allowed_origins = list(dict.fromkeys(allowed_origins))

    assert "*" not in allowed_origins, "Wildcard origin '*' is not allowed with supports_credentials=True"
    assert all(origin for origin in allowed_origins), "Empty string origins are not allowed with supports_credentials=True"

    CORS(app, supports_credentials=True, origins=allowed_origins)

    @app.after_request
    def add_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response

    @app.route('/')
    def status():
        return 'OK'

    @app.errorhandler(404)
    def not_found(e):
        return jsonify(error='Not found'), 404

    @app.errorhandler(500)
    def internal_error(e):
        app.logger.error(f"Internal Server Error: {e}", exc_info=True)
        return jsonify(error="Internal server error"), 500

    app.register_blueprint(auth.auth_bp)
    app.register_blueprint(relay.relay_bp)
    app.register_blueprint(clearances.clearances_bp)
    app.register_blueprint(content.content_bp)
    app.register_blueprint(admin.admin_bp)

    for rule in app.url_map.iter_rules():
        if rule.endpoint == 'auth.discord_login':
            app.view_functions[rule.endpoint] = limiter.limit(RATE_LIMITS['discord_login'])(app.view_functions[rule.endpoint])
        elif rule.endpoint == 'clearances.generate_clearance':
            app.view_functions[rule.endpoint] = limiter.limit(RATE_LIMITS['clearance_generate'])(app.view_functions[rule.endpoint])
        elif rule.endpoint == 'clearances.track_clearance_generation':
            app.view_functions[rule.endpoint] = limiter.limit(RATE_LIMITS['clearance_track'])(app.view_functions[rule.endpoint])
        elif rule.endpoint == 'content.submit_feedback':
            app.view_functions[rule.endpoint] = limiter.limit(RATE_LIMITS['feedback_submit'])(app.view_functions[rule.endpoint])

    return app