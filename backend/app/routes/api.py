from flask import Blueprint, jsonify, request, session, current_app
from .auth import require_auth
from ..database import supabase
from ..services import relay_service, clearance_service
from ..utils.formatters import format_flight_level, normalize_route
from ..utils.responses import success_response, error_response

api_bp = Blueprint('api', __name__)

@api_bp.route('/api/health')
def health():
    return success_response(data={"status": "ok"})

@api_bp.route('/api/controllers')
def controllers():
    return success_response(data=relay_service.get_controllers())

@api_bp.route('/api/atis')
def atis():
    return success_response(data=relay_service.get_atis())

@api_bp.route('/api/flight-plans')
def flight_plans():
    event = request.args.get('event', 'false').lower() in ('true', '1')
    return success_response(data=relay_service.get_flight_plans(event=event))

@api_bp.route('/api/leaderboard/details')
def leaderboard():
    resp = supabase.rpc('get_leaderboard_details', {'p_limit': 10}).execute()
    return success_response(data=resp.data or [])

@api_bp.route('/api/user/clearances')
@require_auth()
def user_clearances():
    user_id = session['user']['id']
    resp = supabase.rpc('get_user_clearances', {'p_user_id': user_id}).execute()
    return success_response(data=resp.data or [])

@api_bp.route('/api/clearance/generate', methods=['POST'])
def generate():
    payload = request.get_json(silent=True) or {}
    callsign = payload.get('callsign')
    if not callsign:
        return error_response("Callsign required")

    plan = relay_service.search_flight_plan(callsign, event=payload.get('event', False))
    if not plan:
        return error_response("Flight plan not found", status_code=404)

    plan['normalized_route'] = normalize_route(plan.get('route'))
    plan['formatted_flight_level'] = format_flight_level(plan.get('flightlevel'))

    dep = plan.get('departing', '').upper()
    station_info = relay_service.resolve_controller_for_airport(dep)
    atis_info = relay_service.resolve_atis_for_airport(dep)

    result = clearance_service.generate_clearance_data(
        plan, payload.get('template'), station_info, atis_info
    )

    try:
        supabase.from_('clearance_generations').insert({
            'user_id': session.get('user', {}).get('id'),
            'discord_username': session.get('user', {}).get('username'),
            'clearance_text': result['text'],
            'callsign': callsign,
            'destination': plan.get('arriving'),
        }).execute()
    except Exception as e:
        current_app.logger.error(f"Track clearance failed: {e}")

    return success_response(data={
        'clearance': result['text'],
        'squawk': result['replacements']['SQUAWK'],
        'callsign': result['replacements']['CALLSIGN'],
        'destination': result['replacements']['DESTINATION'],
        'departure': dep,
        'aircraft': plan.get('aircraft'),
        'flight_level': result['replacements']['FLIGHT_LEVEL'],
        'atis': result['replacements']['ATIS'],
        'atc_station': result['replacements']['ATC_STATION'],
    })
