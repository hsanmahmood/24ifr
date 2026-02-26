try:
    from flask import Blueprint, jsonify, request, session, current_app
except Exception:
    # fallback types to keep Pylance happy when dependencies aren't installed
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
from ..services.external_api import external_api_service
from ..utils.auth_utils import require_auth

api_bp = Blueprint('api_bp', __name__)

@api_bp.route('/api/health')
def health_check():
    # return status from relay as well as basic app health
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
    # support optional `event` query param to fetch event server when needed
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
