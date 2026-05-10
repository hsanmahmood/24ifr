import threading
import time
import random
import requests
from flask import current_app
from .config import Config

_cache = {}
_cache_lock = threading.Lock()
_CACHE_TTL = 5
session = requests.Session()

def _get(path: str):
    url = Config.RELAY_URL.rstrip('/') + path
    now = time.time()
    with _cache_lock:
        entry = _cache.get(path)
        if entry and now - entry[0] < _CACHE_TTL:
            return entry[1]
    try:
        resp = session.get(url, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        with _cache_lock:
            _cache[path] = (now, data)
        return data
    except requests.exceptions.RequestException as e:
        try:
            current_app.logger.error(f"Failed to fetch {url}: {e}", exc_info=True)
        except:
            pass
        raise

def get_controllers():
    fetch_time = _cache.get("/controllers")[0] if "/controllers" in _cache else time.time()
    return {"data": _get("/controllers"), "lastUpdated": fetch_time, "source": "relay"}

def get_atis():
    fetch_time = _cache.get("/atis")[0] if "/atis" in _cache else time.time()
    return {"data": _get("/atis"), "lastUpdated": fetch_time, "source": "relay"}

def get_flight_plans(event: bool = False):
    path = "/fpls/event" if event else "/fpls"
    return _get(path)

def search_flight_plan(callsign: str, event: bool = False):
    normalized_callsign = (callsign or '').strip().lower()
    if not normalized_callsign:
        return None

    plans = get_flight_plans(event=event)
    if not isinstance(plans, list):
        return None

    for plan in plans:
        plan_callsign = str(plan.get('callsign', '')).strip().lower()
        real_callsign = str(plan.get('realcallsign', '')).strip().lower()
        if normalized_callsign == plan_callsign or normalized_callsign == real_callsign:
            return plan

    return None

def resolve_controller_for_airport(airport: str):
    target_airport = (airport or '').strip().upper()
    if not target_airport:
        return None

    controllers = get_controllers()
    controller_list = controllers.get('data', []) if isinstance(controllers, dict) else controllers
    if not isinstance(controller_list, list):
        return None

    for controller in controller_list:
        controller_airport = str(controller.get('airport', '')).strip().upper()
        claimable = controller.get('claimable', True)
        if controller_airport == target_airport and claimable is False:
            position = str(controller.get('position', 'TWR')).strip().upper() or 'TWR'
            return {
                'atc_station': f'{target_airport}_{position}',
                'airport': target_airport,
                'position': position,
                'controller': controller,
            }

    return {
        'atc_station': f'{target_airport}_TWR',
        'airport': target_airport,
        'position': 'TWR',
        'controller': None,
    }

def resolve_atis_for_airport(airport: str):
    target_airport = (airport or '').strip().upper()
    if not target_airport:
        return {'atis': 'A', 'runway': 'active', 'entry': None}

    atis = get_atis()
    atis_list = atis.get('data', []) if isinstance(atis, dict) else atis
    if not isinstance(atis_list, list):
        return {'atis': 'A', 'runway': 'active', 'entry': None}

    for entry in atis_list:
        entry_airport = str(entry.get('airport', '')).strip().upper()
        if entry_airport != target_airport:
            continue

        letter = str(entry.get('letter', '')).strip().upper() or 'A'
        content = entry.get('content') or ''
        runway = parse_arrival_runway(content) or 'active'
        return {'atis': letter, 'runway': runway, 'entry': entry}

    return {'atis': 'A', 'runway': 'active', 'entry': None}

def parse_arrival_runway(content: str):
    if not content:
        return None

    for line in str(content).splitlines():
        if 'ARR RWY' not in line.upper():
            continue

        tail = line.upper().split('ARR RWY', 1)[1].strip()
        if not tail:
            return None

        candidate = tail.split()[0].strip('.,;:')
        if candidate:
            return candidate

    return None

def generate_squawk():
    excluded = {'7500', '7600', '7700'}
    digits = '01234567'

    while True:
        squawk = ''.join(random.choice(digits) for _ in range(4))
        if squawk not in excluded:
            return squawk

def get_health():
    return _get("/health")

def _cache_daemon_loop():
    paths = ["/controllers", "/atis", "/fpls"]
    while True:
        for path in paths:
            try:
                _get(path)
            except:
                pass
        time.sleep(4)

def start_cache_daemon():
    thread = threading.Thread(target=_cache_daemon_loop, daemon=True)
    thread.start()
