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

        user_id = _resolve_current_discord_user_id()
        if not user_id:
            return jsonify([])
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


def _resolve_current_discord_user_id():
    """Resolve the canonical `discord_users.id` for the current session user."""
    user = session.get('user') or {}
    discord_id = user.get('discord_id')

    if discord_id:
        try:
            resp = supabase.from_('discord_users').select('id').eq('discord_id', discord_id).execute()
            rows = resp.data or []
            if rows and rows[0].get('id'):
                return rows[0]['id']
        except Exception as e:
            current_app.logger.warning(f"Failed to resolve discord_users.id for {discord_id}: {e}")

    return user.get('id')

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
        user_id = _resolve_current_discord_user_id()
        supabase.from_('clearance_generations').insert({
            'user_id': user_id,
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
    """Return admin-editable documents (changelog, support, credits) from site_documents table.
    Falls back to empty list on error.
    """
    try:
        resp = supabase.from_('site_documents').select('*').execute()
        if getattr(resp, 'error', None):
            current_app.logger.warning(f"Failed to fetch site_documents: {resp.error}")
            return jsonify({"documents": []})
        return jsonify({"documents": resp.data or []})
    except Exception as e:
        current_app.logger.warning(f"Exception fetching admin documents: {e}", exc_info=True)
        return jsonify({"documents": []})


def load_public_documents():
    """Return public site documents for the front-end popups.
    Falls back to empty list on error.
    """
    try:
        resp = supabase.from_('site_documents').select('*').execute()
        if getattr(resp, 'error', None):
            current_app.logger.warning(f"Failed to fetch public site_documents: {resp.error}")
            return jsonify({"documents": []})
        documents = resp.data or []
        allowed_keys = {'privacy_terms', 'changelog', 'credits', 'support'}
        filtered = [doc for doc in documents if doc.get('doc_key') in allowed_keys]
        return jsonify({"documents": filtered})
    except Exception as e:
        current_app.logger.warning(f"Exception fetching public documents: {e}", exc_info=True)
        return jsonify({"documents": []})

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


def _count_rows_by_date(rows, date_key='created_at'):
    counts = {}
    for row in rows:
        ts = row.get(date_key)
        if not ts:
            continue
        day = str(ts)[:10]
        if not day:
            continue
        counts[day] = counts.get(day, 0) + 1
    return counts


def _sum_last_days(counts, days):
    from datetime import date, timedelta

    today = date.today()
    return sum(counts.get((today - timedelta(days=i)).isoformat(), 0) for i in range(days - 1, -1, -1))


def _trend_pct(current, previous):
    if previous in (None, 0):
        return None
    value = ((current - previous) / previous) * 100
    return value if value == value else None


def _format_daily_series(counts, cumulative=False):
    from datetime import date, timedelta

    if not counts:
        return []

    first_day = min(counts.keys())
    start = date.fromisoformat(first_day)
    end = date.today()
    out = []
    running = 0

    current = start
    while current <= end:
        day = current.isoformat()
        daily_count = counts.get(day, 0)
        if cumulative:
            running += daily_count
            out.append({'date': day, 'count': running})
        else:
            out.append({'date': day, 'count': daily_count})
        current += timedelta(days=1)

    return out


def _fetch_admin_user_rows(all_time=False, days=30):
    """Fetch admin user rows from the most reliable source available.

    Prefer the `get_admin_users` RPC, then fall back to `discord_users`.
    """
    try:
        resp = supabase.rpc('get_admin_users').execute()
        rows = resp.data or []
        if rows:
            return rows
    except Exception as e:
        current_app.logger.warning(f"get_admin_users RPC failed: {e}")

    from datetime import date, timedelta

    since = None
    if not all_time:
        since = (date.today() - timedelta(days=days - 1)).isoformat()

    for table_name in ('discord_users',):
        try:
            query = supabase.from_(table_name).select('created_at')
            if since:
                query = query.gte('created_at', since)
            resp = query.execute()
            rows = resp.data or []
            if rows:
                return rows
        except Exception as e:
            current_app.logger.warning(f"Fallback {table_name} query failed: {e}")

    return []

def _fetch_all_rows(table_name, columns='created_at', since=None, batch_size=1000):
    """Fetch all rows from a Supabase table without hitting the default page-size cap."""
    rows = []
    offset = 0

    while True:
        query = supabase.from_(table_name).select(columns).range(offset, offset + batch_size - 1)
        if since:
            query = query.gte('created_at', since)

        resp = query.execute()
        batch = resp.data or []
        rows.extend(batch)

        if len(batch) < batch_size:
            break

        offset += batch_size

    return rows


def load_admin_analytics_overview():
    try:
        clearance_rows = _fetch_all_rows('clearance_generations', 'created_at')
        clearance_counts = _count_rows_by_date(clearance_rows)
        clearance_series = _format_daily_series(clearance_counts, cumulative=False)

        user_rows = _fetch_admin_user_rows(all_time=True)

        user_counts = _count_rows_by_date(user_rows)
        user_growth_series = _format_daily_series(user_counts, cumulative=True)

        from datetime import date, timedelta

        today_key = date.today().isoformat()
        yesterday_key = (date.today() - timedelta(days=1)).isoformat()

        total_clearances = sum(clearance_counts.values())
        today_clearances = clearance_counts.get(today_key, 0)
        last7_clearances = _sum_last_days(clearance_counts, 7)
        last15_clearances = _sum_last_days(clearance_counts, 15)
        last30_clearances = _sum_last_days(clearance_counts, 30)
        total_users = user_growth_series[-1]['count'] if user_growth_series else 0

        previous7_clearances = _sum_last_days(clearance_counts, 14) - last7_clearances if clearance_counts else 0
        previous15_clearances = _sum_last_days(clearance_counts, 30) - last15_clearances if clearance_counts else 0
        previous30_clearances = _sum_last_days(clearance_counts, 60) - last30_clearances if clearance_counts else 0
        previous_today = clearance_counts.get(yesterday_key, 0)
        previous_users = user_growth_series[-31]['count'] if len(user_growth_series) > 30 else 0

        def compact_trend(current, previous):
            value = _trend_pct(current, previous)
            return None if value is None else round(value, 1)

        payload = {
            'metrics': {
                'total_clearances': total_clearances,
                'today_clearances': today_clearances,
                'last7_clearances': last7_clearances,
                'last15_clearances': last15_clearances,
                'last30_clearances': last30_clearances,
                'total_users': total_users,
                'trends': {
                    'total_clearances': compact_trend(last30_clearances, previous30_clearances),
                    'today_clearances': compact_trend(today_clearances, previous_today),
                    'last7_clearances': compact_trend(last7_clearances, previous7_clearances),
                    'last15_clearances': compact_trend(last15_clearances, previous15_clearances),
                    'last30_clearances': compact_trend(last30_clearances, previous30_clearances),
                    'total_users': compact_trend(total_users, previous_users),
                },
            },
            'charts': {
                'clearances_per_day': clearance_series[-30:],
                'user_growth': user_growth_series,
            },
        }
        return jsonify(payload)
    except Exception as e:
        current_app.logger.warning(f"Exception fetching admin analytics overview: {e}", exc_info=True)
        return jsonify({"metrics": {}, "charts": {"clearances_per_day": [], "user_growth": []}})


def load_admin_user_growth():
    days = int(request.args.get('days', 30))
    all_time = request.args.get('all', 'false').lower() in ('1', 'true', 'yes')
    try:
        rows = _fetch_admin_user_rows(all_time=all_time, days=days)

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
        if all_time:
            for d in sorted(counts.keys()):
                cum += counts.get(d, 0)
                out.append({'date': d, 'count': cum})
        else:
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
        rows = _fetch_all_rows('clearance_generations', 'created_at')
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
        rows = _fetch_all_rows('clearance_generations', 'created_at', since=since)
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


def track_clearance_generation():
    """Track a generated clearance by inserting a row into `clearance_generations`.
    Accepts JSON body with keys: `clearance_text`, `callsign`, `destination`.
    Uses the current session user if present to attach `user_id` and `discord_username`.
    """
    try:
        payload = request.get_json(silent=True) or {}
        user_id = _resolve_current_discord_user_id()

        record = {
            'user_id': user_id,
            'discord_username': session.get('user', {}).get('username'),
            'clearance_text': payload.get('clearance_text') or payload.get('clearance') or '',
            'callsign': payload.get('callsign'),
            'destination': payload.get('destination'),
        }

        supabase.from_('clearance_generations').insert(record).execute()

        return jsonify({'success': True})
    except Exception as e:
        current_app.logger.error(f"Failed to track clearance generation: {e}", exc_info=True)
        return jsonify({'success': False, 'error': str(e)}), 500


def save_admin_document(doc_key):
    """Upsert a document identified by `doc_key`.
    Expects JSON payload with at least `title` and `content_md`.
    """
    payload = request.get_json(silent=True) or {}
    title = payload.get('title') or ''
    content_md = payload.get('content_md') or ''
    try:
        from datetime import datetime, timezone

        resp = supabase.from_('site_documents').upsert({
            'doc_key': doc_key,
            'title': title,
            'content_md': content_md,
            'updated_at': datetime.now(timezone.utc).isoformat(),
        }, on_conflict='doc_key').execute()
        if getattr(resp, 'error', None):
            current_app.logger.error(f"Failed to upsert site_documents {doc_key}: {resp.error}")
            return jsonify({"error": "Failed to save document", "detail": str(resp.error)}), 500
        return jsonify({"success": True}), 200
    except Exception as e:
        current_app.logger.error(f"Exception saving site_documents {doc_key}: {e}", exc_info=True)
        return jsonify({"error": "Failed to save document", "detail": str(e)}), 500
