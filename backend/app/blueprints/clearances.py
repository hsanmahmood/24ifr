from flask import Blueprint, jsonify, request, session, current_app
from ..clearance_service import generate_clearance_data, resolve_current_discord_user_id, DEFAULT_CLEARANCE_TEMPLATE
from ..database import supabase
from ..security import require_csrf

clearances_bp = Blueprint('clearances', __name__)

@clearances_bp.route('/api/clearance/generate', methods=['POST'])
@require_csrf
def generate_clearance():
    payload = request.get_json(silent=True) or {}
    callsign = str(payload.get('callsign') or '').strip()
    template = str(payload.get('template') or DEFAULT_CLEARANCE_TEMPLATE)
    event = bool(payload.get('event', False))

    if not callsign:
        return jsonify({"error": "callsign is required"}), 400

    try:
        result = generate_clearance_data(callsign, template, event)
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        current_app.logger.error(f"Failed to generate clearance: {e}", exc_info=True)
        return jsonify({"error": "Failed to generate clearance", "details": str(e)}), 500

    try:
        user_id = resolve_current_discord_user_id()
        supabase.from_('clearance_generations').insert({
            'user_id': user_id,
            'discord_username': session.get('user', {}).get('username'),
            'clearance_text': result['clearance'],
            'callsign': callsign,
            'destination': result['destination'],
        }).execute()
    except Exception as e:
        current_app.logger.error(f'Failed to track generated clearance: {e}', exc_info=True)

    return jsonify(result)

@clearances_bp.route('/api/clearance/generate', methods=['GET'])
def clearance_generation_guide():
    return jsonify({
        'endpoint': '/api/clearance/generate',
        'method': 'POST',
        'required_body': {
            'callsign': 'String. Required. Flight plan callsign to search for, case-insensitive.',
        },
        'optional_body': {
            'template': f'String. Optional. If omitted, this default is used: {DEFAULT_CLEARANCE_TEMPLATE}',
            'event': 'Boolean. Optional. Defaults to false. If true, the event relay flight-plan cache is searched.',
        },
        'example_request': {
            'callsign': 'Singadoor-3770',
            'template': DEFAULT_CLEARANCE_TEMPLATE,
            'event': False,
        },
        'example_response_fields': [
            'clearance', 'squawk', 'callsign', 'destination', 'departure',
            'aircraft', 'flight_rules', 'flight_level', 'atis', 'atc_station',
        ],
    })

@clearances_bp.route('/api/clearance-generated', methods=['POST'])
@require_csrf
def track_clearance_generation():
    try:
        payload = request.get_json(silent=True) or {}
        
        clearance_text = str(payload.get('clearance_text') or payload.get('clearance') or '')[:5000]
        callsign = str(payload.get('callsign') or '')[:20]
        destination = str(payload.get('destination') or '')[:10]
        
        if not clearance_text.strip():
            return jsonify({'success': False, 'error': 'clearance_text is required'}), 400
        
        user_id = resolve_current_discord_user_id()
        record = {
            'user_id': user_id,
            'discord_username': session.get('user', {}).get('username'),
            'clearance_text': clearance_text,
            'callsign': callsign if callsign.strip() else None,
            'destination': destination if destination.strip() else None,
        }
        supabase.from_('clearance_generations').insert(record).execute()
        return jsonify({'success': True})
    except Exception as e:
        current_app.logger.error(f"Failed to track clearance generation: {e}", exc_info=True)
        return jsonify({'success': False, 'error': str(e)}), 500