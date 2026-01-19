from flask import Blueprint, jsonify, request, session, current_app
from ..core.database import get_supabase_client, supabase_admin
from ..services.external_api import external_api_service, flight_plans_cache, flight_plan_lock
from ..utils.auth_utils import require_auth

api_bp = Blueprint('api_bp', __name__)

@api_bp.route('/api/health')
def health_check():
    return jsonify({
        "status": "ok",
        "supabase_status": "connected",
        "flight_plan_cache_size": len(flight_plans_cache)
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

@api_bp.route('/api/flight-plans')
def get_flight_plans():
    with flight_plan_lock:
        if flight_plans_cache:
            return jsonify(list(flight_plans_cache))
            
    try:
        supabase = get_supabase_client()
        response = supabase.from_('flight_plans_received').select("*").order('created_at', desc=True).limit(3).execute()
        plans = response.data or []
        for plan in plans:
            plan["departing"] = plan.get("departure") or plan.get("departing")
            plan["arriving"] = plan.get("arrival") or plan.get("arriving")
            plan["flightlevel"] = plan.get("altitude") or plan.get("flightlevel")
            plan["flightrules"] = plan.get("flight_rules") or plan.get("flightrules")
            plan["aircraft"] = plan.get("aircraft_type") or plan.get("aircraft")
        return jsonify(plans)
    except Exception as e:
        current_app.logger.error(f"Failed to fetch flight plans from Supabase: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch flight plans from database", "details": str(e)}), 500

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
