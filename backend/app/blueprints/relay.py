from flask import Blueprint, jsonify, request, current_app
from ..relay_client import get_controllers, get_atis, get_flight_plans, get_health
from ..clearance_service import search_flight_plan
from ..config import Config
from ..cache import ttl_cache

relay_bp = Blueprint('relay', __name__)

@relay_bp.route('/api/health')
def health_check():
    try:
        relay = get_health()
    except Exception as e:
        current_app.logger.warning(f"relay health check failed: {e}")
        relay = None
    return jsonify({"status": "ok", "relay": relay, "relay_url": Config.RELAY_URL})

@relay_bp.route('/api/controllers')
def fetch_controllers():
    try:
        result = ttl_cache('controllers', 10, get_controllers)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@relay_bp.route('/api/atis')
def fetch_atis():
    try:
        result = ttl_cache('atis', 10, get_atis)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@relay_bp.route('/api/flight-plans')
def fetch_flight_plans():
    event = request.args.get('event', 'false').lower() in ('1', 'true', 'yes')
    current_app.logger.info(f"fetch_flight_plans called with event={event}, RELAY_URL={Config.RELAY_URL}")
    try:
        plans = get_flight_plans(event=event)
        current_app.logger.info(f"Successfully fetched {len(plans) if isinstance(plans, list) else 'N/A'} flight plans")
        return jsonify(plans)
    except Exception as e:
        current_app.logger.error(f"Failed to fetch flight plans from relay: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch flight plans from relay", "details": str(e)}), 500

@relay_bp.route('/api/flight-plans/search')
def search_flight_plan_route():
    callsign = request.args.get('callsign', '')
    if not callsign.strip():
        return jsonify({"error": "callsign is required"}), 400
    flight_plan = search_flight_plan(callsign, event=False)
    if not flight_plan:
        return jsonify({"error": "Flight plan not found"}), 404
    return jsonify(flight_plan)