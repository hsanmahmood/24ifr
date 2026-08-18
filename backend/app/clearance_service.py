import random
from flask import session, current_app
from .relay_client import get_controllers, get_atis, get_flight_plans
from .database import supabase

DEFAULT_CLEARANCE_TEMPLATE = '{CALLSIGN}, {ATC_STATION}, good day. Startup approved. Information {ATIS} correct. Cleared {DESTINATION} via {ROUTE}, runway {RUNWAY}. Initial climb FT{INITIAL_ALT}. Squawk {SQUAWK}.'

def normalize_route(route):
    normalized = str(route or '').strip()
    if not normalized or normalized.upper() in {'N/A', 'NA', 'NONE'}:
        return 'as filed'
    return normalized

def format_flight_level(flight_level):
    normalized = str(flight_level or '').strip()
    if not normalized:
        return 'XXX'
    if normalized.isdigit() and len(normalized) == 3:
        return normalized
    if normalized.isdigit() and int(normalized) > 999:
        return str(int(normalized) // 100).zfill(3)
    return normalized

def build_clearance_text(template, replacements):
    output = template
    for token, value in replacements.items():
        output = output.replace(f'{{{token}}}', value or '')
    return output.strip()

def search_flight_plan(callsign: str, event: bool = False):
    normalized = callsign.strip().lower()
    if not normalized:
        return None
    plans = get_flight_plans(event=event)
    if not isinstance(plans, list):
        return None
    for plan in plans:
        if normalized == str(plan.get("callsign", "")).strip().lower():
            return plan
        if normalized == str(plan.get("realcallsign", "")).strip().lower():
            return plan
    return None

def resolve_controller_for_airport(airport: str):
    from .relay_client import AIRPORTS
    target = str(airport or "").strip().upper()
    if not target:
        return {"atc_station": f"{target}_TWR", "airport": target, "position": "TWR", "controller": None}
    controllers = get_controllers()
    controller_list = controllers.get("data", [])
    if not isinstance(controller_list, list):
        return {"atc_station": f"{target}_TWR", "airport": target, "position": "TWR", "controller": None}
    position_priority = {"DEL": 0, "GND": 1, "TWR": 2}
    station_controllers = sorted(
        [controller for controller in controller_list if str(controller.get("airport", "")).strip().upper() == target and controller.get("claimable") is False],
        key=lambda controller: position_priority.get(str(controller.get("position", "TWR")).strip().upper(), 99),
    )
    if station_controllers:
        controller = station_controllers[0]
        position = str(controller.get("position", "TWR")).strip().upper() or "TWR"
        return {"atc_station": f"{target}_{position}", "airport": target, "position": position, "controller": controller}
    ctr_prefix = AIRPORTS.get(target)
    if ctr_prefix:
        ctr_controller = next((controller for controller in controller_list if str(controller.get("callsign", "")).strip().upper().startswith(str(ctr_prefix).strip().upper()) and controller.get("claimable") is False), None)
        if ctr_controller:
            return {"atc_station": str(ctr_controller.get("callsign", "")).strip().upper(), "airport": target, "position": "CTR", "controller": ctr_controller}
    return {"atc_station": f"{target}_TWR", "airport": target, "position": "TWR", "controller": None}

def resolve_atis_for_airport(airport: str):
    target = airport.strip().upper()
    if not target:
        return {"atis": "A", "runway": "active", "entry": None}
    atis = get_atis()
    atis_list = atis.get("data", [])
    if not isinstance(atis_list, list):
        return {"atis": "A", "runway": "active", "entry": None}
    for entry in atis_list:
        if str(entry.get("airport", "")).strip().upper() != target:
            continue
        letter = str(entry.get("letter", "")).strip().upper() or "A"
        runway = parse_arrival_runway(entry.get("content", "")) or "active"
        return {"atis": letter, "runway": runway, "entry": entry}
    return {"atis": "A", "runway": "active", "entry": None}

def parse_arrival_runway(content: str):
    for line in str(content or "").splitlines():
        if "ARR RWY" not in line.upper():
            continue
        tail = line.upper().split("ARR RWY", 1)[1].strip()
        if not tail:
            return None
        candidate = tail.split()[0].strip(".,;:")
        if candidate:
            return candidate
    return None

def generate_squawk():
    excluded = {"7500", "7600", "7700"}
    digits = "01234567"
    while True:
        squawk = "".join(random.choice(digits) for _ in range(4))
        if squawk not in excluded:
            return squawk

def resolve_current_discord_user_id():
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

def generate_clearance_data(callsign: str, template: str = None, event: bool = False):
    if not callsign:
        raise ValueError("callsign is required")
    
    if template is None:
        template = DEFAULT_CLEARANCE_TEMPLATE
    
    flight_plan = search_flight_plan(callsign, event=event)
    if not flight_plan:
        raise ValueError("Flight plan not found")
    
    departure = str(flight_plan.get('departing', '')).strip().upper()
    destination = str(flight_plan.get('arriving', '')).strip().upper()
    plan_callsign = str(flight_plan.get('realcallsign') or flight_plan.get('callsign') or '').strip().upper()
    route = normalize_route(flight_plan.get('route'))
    flight_level = format_flight_level(flight_plan.get('flightlevel'))
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
    clearance = build_clearance_text(template, {
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
    
    return {
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
    }