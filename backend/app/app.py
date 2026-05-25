from flask import Flask, jsonify
from flask_cors import CORS
from flask_compress import Compress
from werkzeug.middleware.proxy_fix import ProxyFix

from .config import Config
from . import auth, api
from .external_api import start_cache_daemon

app = Flask(__name__)
app.config.from_object(Config)

Compress(app)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

_allowed_origins = [o for o in [Config.FRONTEND_URL, Config.ADMIN_URL] if o]
CORS(app, supports_credentials=True, origins=_allowed_origins)


@app.after_request
def set_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response


auth.register(app)

app.add_url_rule("/", "status", lambda: ("OK", 200))
app.add_url_rule("/api/health", "health_check", api.health_check)
app.add_url_rule("/api/controllers", "fetch_controllers", api.fetch_controllers)
app.add_url_rule("/api/atis", "fetch_atis", api.fetch_atis)
app.add_url_rule("/api/flight-plans", "fetch_flight_plans", api.fetch_flight_plans)
app.add_url_rule("/api/flight-plans/search", "search_flight_plan_route", api.search_flight_plan_route)
app.add_url_rule("/api/leaderboard/details", "get_leaderboard_details", api.get_leaderboard_details)
app.add_url_rule("/api/user/clearances", "get_user_clearances", api.get_user_clearances)
app.add_url_rule("/api/public/documents", "load_public_documents", api.load_public_documents)
app.add_url_rule("/api/clearance/generate", "generate_clearance", api.generate_clearance, methods=["POST"])
app.add_url_rule("/api/clearance-generated", "track_clearance_generation", auth.require_auth(api.track_clearance_generation), methods=["POST"])

app.add_url_rule("/api/admin/documents", "load_admin_documents", auth.require_admin(api.load_admin_documents))
app.add_url_rule("/api/admin/documents/<doc_key>", "save_admin_document", auth.require_admin(api.save_admin_document), methods=["PUT"])
app.add_url_rule("/api/admin/analytics/overview", "load_admin_analytics_overview", auth.require_admin(api.load_admin_analytics_overview))
app.add_url_rule("/api/admin/user-growth", "load_admin_user_growth", auth.require_admin(api.load_admin_user_growth))


@app.errorhandler(404)
def not_found(e):
    return jsonify(error="Not found"), 404


@app.errorhandler(500)
def internal_error(e):
    return jsonify(error="Internal server error"), 500


start_cache_daemon()

if __name__ == "__main__":
    from waitress import serve
    serve(app, host="0.0.0.0", port=5000)
