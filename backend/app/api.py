from flask import jsonify, request, session, current_app
from .database import supabase
from .external_api import (
    get_controllers,
    get_atis,
    get_flight_plans,
    get_health,
    search_flight_plan,
    resolve_controller_for_airport,
    resolve_atis_for_airport,
    parse_arrival_runway,
    generate_squawk,
)

DEFAULT_CLEARANCE_TEMPLATE = '{CALLSIGN}, {ATC_STATION}, good day. Startup approved. Information {ATIS} correct. Cleared {DESTINATION} via {ROUTE}, runway {RUNWAY}. Initial climb FT{INITIAL_ALT}. Squawk {SQUAWK}.'

def health_check():
    try:
        relay = get_health()
    except Exception as e:
        current_app.logger.warning(f"relay health check failed: {e}")
        relay = None
    return jsonify({
        "status": "ok",
        "relay": relay,
    })

def fetch_controllers():
    try:
        return jsonify(get_controllers())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def fetch_atis():
    try:
        return jsonify(get_atis())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def fetch_flight_plans():
    event = request.args.get('event', 'false').lower() in ('1','true','yes')
    try:
        plans = get_flight_plans(event=event)
        return jsonify(plans)
    except Exception as e:
        current_app.logger.error(f"Failed to fetch flight plans from relay: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch flight plans from relay", "details": str(e)}), 500

def get_leaderboard_details():
    try:
        response = supabase.rpc('get_leaderboard_details', {'p_limit': 10}).execute()
        return jsonify(response.data)
    except Exception as e:
        current_app.logger.error(f"Failed to fetch leaderboard details from Supabase: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch leaderboard details", "details": str(e)}), 500

def get_user_clearances():
    try:
        if 'user' not in session:
            return jsonify([])

        user_id = session['user']['id']
        response = supabase.rpc('get_user_clearances', {'p_user_id': user_id}).execute()
        return jsonify(response.data or [])
    except Exception as e:
        current_app.logger.error(f"Failed to fetch user clearances from Supabase: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch user clearances", "details": str(e)}), 500

def _normalize_route(route):
    normalized = str(route or '').strip()
    if not normalized or normalized.upper() in {'N/A', 'NA', 'NONE'}:
        return 'as filed'
    return normalized

def _format_flight_level(flight_level):
    normalized = str(flight_level or '').strip()
    if not normalized:
        return 'XXX'
    if normalized.isdigit() and len(normalized) == 3:
        return normalized
    if normalized.isdigit() and int(normalized) > 999:
        return str(int(normalized) // 100).zfill(3)
    return normalized

def _build_clearance_text(template, replacements):
    output = template
    for token, value in replacements.items():
        output = output.replace(f'{{{token}}}', value or '')
    return output.strip()

def generate_clearance():
    payload = request.get_json(silent=True) or {}
    callsign = str(payload.get('callsign') or '').strip()
    template = str(payload.get('template') or DEFAULT_CLEARANCE_TEMPLATE)
    event = bool(payload.get('event', False))

    if not callsign:
        return jsonify({"error": "callsign is required"}), 400

    flight_plan = search_flight_plan(callsign, event=event)
    if not flight_plan:
        return jsonify({"error": "Flight plan not found"}), 404

    departure = str(flight_plan.get('departing', '')).strip().upper()
    destination = str(flight_plan.get('arriving', '')).strip().upper()
    plan_callsign = str(flight_plan.get('realcallsign') or flight_plan.get('callsign') or '').strip().upper()
    route = _normalize_route(flight_plan.get('route'))
    flight_level = _format_flight_level(flight_plan.get('flightlevel'))
    aircraft = str(flight_plan.get('aircraft', '')).strip()
    flight_rules = str(flight_plan.get('flightrules', '')).strip().upper()

    controller_info = resolve_controller_for_airport(departure)
    atc_station = controller_info['atc_station'] if controller_info else f'{departure}_TWR'

    atis_info = resolve_atis_for_airport(departure)
    atis_letter = atis_info['atis'] if atis_info else 'A'
    runway = atis_info['runway'] if atis_info else 'active'

    if runway == 'active':
        parsed_runway = parse_arrival_runway(atis_info['entry'].get('content', '') if atis_info and atis_info.get('entry') else '')
        runway = parsed_runway or 'active'

    squawk = generate_squawk()
    clearance = _build_clearance_text(template, {
        'CALLSIGN': plan_callsign,
        'ATC_STATION': atc_station,
        'ATIS': atis_letter,
        'DESTINATION': destination,
        'ROUTE': route,
        'RUNWAY': runway,
        'INITIAL_ALT': '3000',
        'FLIGHT_LEVEL': flight_level,
        'SQUAWK': squawk,
    })

    try:
        supabase.from_('clearance_generations').insert({
            'user_id': session.get('user', {}).get('id'),
            'discord_username': session.get('user', {}).get('username'),
            'clearance_text': clearance,
            'callsign': callsign,
            'destination': destination,
        }).execute()
    except Exception as e:
        current_app.logger.error(f'Failed to track generated clearance: {e}', exc_info=True)

    return jsonify({
        'clearance': clearance,
        'squawk': squawk,
        'callsign': plan_callsign,
        'destination': destination,
        'departure': departure,
        'aircraft': aircraft,
        'flight_rules': flight_rules,
        'flight_level': flight_level,
        'atis': atis_letter,
        'atc_station': atc_station,
    })

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
            'clearance',
            'squawk',
            'callsign',
            'destination',
            'departure',
            'aircraft',
            'flight_rules',
            'flight_level',
            'atis',
            'atc_station',
        ],
    })

def search_flight_plan_route():
    callsign = request.args.get('callsign', '')
    if not callsign.strip():
        return jsonify({"error": "callsign is required"}), 400

    flight_plan = search_flight_plan(callsign, event=False)
    if not flight_plan:
        return jsonify({"error": "Flight plan not found"}), 404

    return jsonify(flight_plan)

def load_admin_documents():
    """Return admin-editable documents (changelog, support, credits).
    Attempts to read from `admin_documents` table; falls back to empty list on error.
    """
    try:
        resp = supabase.from_('site_documents').select('*').execute()
        if getattr(resp, 'error', None):
            current_app.logger.warning(f"Failed to fetch site_documents: {resp.error}")
            return jsonify({"documents": []})
        return jsonify({"documents": resp.data or []})
    except Exception as e:
        current_app.logger.warning(f"Exception fetching admin documents: {e}", exc_info=True)
        return jsonify([])

def load_admin_clearances_daily():
    """Return daily clearance counts for admin dashboard. Accepts ?days=14
    Falls back to empty list if not available.
    """
    days = int(request.args.get('days', 14))
    try:
        # Query clearance_generations table for created_at timestamps
        from datetime import date, timedelta, datetime
        since = (date.today() - timedelta(days=days - 1)).isoformat()
        resp = supabase.from_('clearance_generations').select('created_at').gte('created_at', since).execute()
        if getattr(resp, 'error', None):
            current_app.logger.warning(f"Failed to fetch clearance_generations: {resp.error}")
            return jsonify([])
        rows = resp.data or []
        counts = {}
        for r in rows:
            # created_at may be a datetime string
            ts = r.get('created_at')
            try:
                d = ts[:10]
            except Exception:
                d = None
            if not d:
                continue
            counts[d] = counts.get(d, 0) + 1
        out = []
        today = date.today()
        for i in range(days - 1, -1, -1):
            d = (today - timedelta(days=i)).isoformat()
            out.append({'date': d, 'count': counts.get(d, 0)})
        return jsonify(out)
    except Exception as e:
        current_app.logger.warning(f"Exception fetching admin daily clearances: {e}", exc_info=True)
        return jsonify([])


def load_admin_user_growth():
    days = int(request.args.get('days', 30))
    try:
        # Try RPC get_admin_users first, fall back to users table
        try:
            resp = supabase.rpc('get_admin_users').execute()
            rows = resp.data or []
        except Exception:
            # Fallback to users table
            from datetime import date, timedelta
            since = (date.today() - timedelta(days=days - 1)).isoformat()
            r2 = supabase.from_('users').select('created_at').gte('created_at', since).execute()
            rows = r2.data or []

        # Build counts per day, then cumulative
        from datetime import date, timedelta
        counts = {}
        for r in rows:
            ts = r.get('created_at') or r.get('date')
            if not ts:
                continue
            d = ts[:10]
            counts[d] = counts.get(d, 0) + 1

        out = []
        today = date.today()
        cum = 0
        for i in range(days - 1, -1, -1):
            d = (today - timedelta(days=i)).isoformat()
            cum += counts.get(d, 0)
            out.append({'date': d, 'count': cum})
        return jsonify(out)
    except Exception as e:
        current_app.logger.warning(f"Exception fetching admin user growth: {e}", exc_info=True)
        return jsonify([])


def analytics_clearances_per_day():
    try:
        # Query all clearance_generations and aggregate by date
        resp = supabase.from_('clearance_generations').select('created_at').execute()
        if getattr(resp, 'error', None):
            current_app.logger.warning(f"Failed to fetch clearance_generations: {resp.error}")
            return jsonify([])
        rows = resp.data or []
        counts = {}
        for r in rows:
            ts = r.get('created_at')
            if not ts:
                continue
            d = ts[:10]
            counts[d] = counts.get(d, 0) + 1
        out = [{'date': k, 'count': v} for k, v in sorted(counts.items())]
        return jsonify(out)
    except Exception as e:
        current_app.logger.warning(f"Exception fetching admin clearances per day: {e}", exc_info=True)
        return jsonify([])


def analytics_clearances_last_n(days):
    try:
        from datetime import date, timedelta
        since = (date.today() - timedelta(days=days - 1)).isoformat()
        resp = supabase.from_('clearance_generations').select('created_at').gte('created_at', since).execute()
        if getattr(resp, 'error', None):
            current_app.logger.warning(f"Failed to fetch clearance_generations for last {days} days: {resp.error}")
            return jsonify([])
        rows = resp.data or []
        mapping = {}
        for r in rows:
            ts = r.get('created_at')
            if not ts:
                continue
            d = ts[:10]
            mapping[d] = mapping.get(d, 0) + 1
        today = date.today()
        out = []
        for i in range(days - 1, -1, -1):
            d = (today - timedelta(days=i)).isoformat()
            out.append({'date': d, 'count': mapping.get(d, 0)})
        return jsonify(out)
    except Exception as e:
        current_app.logger.warning(f"Exception fetching admin clearances last {days} days: {e}", exc_info=True)
        return jsonify([])


def save_admin_document(doc_key):
    """Upsert a document identified by `doc_key`.
    Expects JSON payload with at least `title` and `content_md`.
    """
    payload = request.get_json(silent=True) or {}
    title = payload.get('title') or ''
    content_md = payload.get('content_md') or ''
    try:
        resp = supabase.from_('site_documents').upsert({
            'doc_key': doc_key,
            'title': title,
            'content_md': content_md,
        }, on_conflict='doc_key').execute()
        if getattr(resp, 'error', None):
            current_app.logger.error(f"Failed to upsert site_documents {doc_key}: {resp.error}")
            return jsonify({"error": "Failed to save document", "detail": str(resp.error)}), 500
        return jsonify({"success": True}), 200
    except Exception as e:
        current_app.logger.error(f"Exception saving site_documents {doc_key}: {e}", exc_info=True)
        return jsonify({"error": "Failed to save document", "detail": str(e)}), 500
