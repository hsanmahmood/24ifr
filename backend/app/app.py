from flask import Flask, jsonify, session
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
from waitress import serve

from .config import Config
from . import auth, api
from .external_api import start_cache_daemon

app = Flask(__name__)
app.config.from_object(Config)
app.config['SESSION_COOKIE_NAME'] = 'session_id'

app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
CORS(app, supports_credentials=True)

auth.register(app)

@app.route('/')
def status():
    return 'OK'

app.add_url_rule('/api/health', 'health_check', api.health_check)
app.add_url_rule('/api/controllers', 'fetch_controllers', api.fetch_controllers)
app.add_url_rule('/api/atis', 'fetch_atis', api.fetch_atis)
app.add_url_rule('/api/flight-plans', 'fetch_flight_plans', api.fetch_flight_plans)
app.add_url_rule('/api/flight-plans/search', 'search_flight_plan_route', api.search_flight_plan_route)
app.add_url_rule('/api/leaderboard/details', 'get_leaderboard_details', api.get_leaderboard_details)
app.add_url_rule('/api/user/clearances', 'get_user_clearances', api.get_user_clearances)
app.add_url_rule('/api/clearance/generate', 'generate_clearance', api.generate_clearance, methods=['POST'])
app.add_url_rule('/api/clearance/generate', 'clearance_generation_guide', api.clearance_generation_guide, methods=['GET'])

# Admin endpoints used by the admin frontend (require admin)
app.add_url_rule('/api/admin/documents', 'load_admin_documents', auth.require_admin(api.load_admin_documents))
app.add_url_rule('/api/admin/documents/<doc_key>', 'save_admin_document', auth.require_admin(api.save_admin_document), methods=['PUT'])
app.add_url_rule('/api/admin/clearances/daily', 'load_admin_clearances_daily', auth.require_admin(api.load_admin_clearances_daily))
app.add_url_rule('/api/admin/user-growth', 'load_admin_user_growth', auth.require_admin(api.load_admin_user_growth))

@app.errorhandler(404)
def not_found(e):
    return jsonify(error='Not found'), 404

@app.errorhandler(500)
def internal_error(e):
    app.logger.error(f"Internal Server Error: {e}", exc_info=True)
    return jsonify(error="Internal server error"), 500

start_cache_daemon()

if __name__ == '__main__':
    serve(app, host='0.0.0.0', port=5000)
