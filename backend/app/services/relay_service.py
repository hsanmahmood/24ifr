import threading
import time
import requests
from flask import current_app
from ..core.config import Config
from ..utils.cache import Cache

relay_cache = Cache(ttl=5)
http_session = requests.Session()

def _fetch(path: str):
    cached = relay_cache.get(path)
    if cached:
        return cached

    url = Config.RELAY_URL.rstrip('/') + path
    try:
        resp = http_session.get(url, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        relay_cache.set(path, data)
        return data
    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"Relay fetch failed for {url}: {e}")
        raise

def get_controllers():
    return {
        "data": _fetch("/controllers"),
        "lastUpdated": relay_cache.get_timestamp("/controllers"),
        "source": "relay"
    }

def get_atis():
    return {
        "data": _fetch("/atis"),
        "lastUpdated": relay_cache.get_timestamp("/atis"),
        "source": "relay"
    }

def get_flight_plans(event=False):
    path = "/fpls/event" if event else "/fpls"
    return _fetch(path)

def search_flight_plan(callsign, event=False):
    normalized = (callsign or '').strip().lower()
    if not normalized:
        return None

    plans = get_flight_plans(event=event)
    if not isinstance(plans, list):
        return None

    for plan in plans:
        p_call = str(plan.get('callsign', '')).strip().lower()
        r_call = str(plan.get('realcallsign', '')).strip().lower()
        if normalized in (p_call, r_call):
            return plan
    return None

def resolve_controller_for_airport(airport: str):
    target = (airport or '').strip().upper()
    if not target:
        return None

    controllers = get_controllers().get('data', [])
    for c in controllers:
        if str(c.get('airport', '')).strip().upper() == target and c.get('claimable') is False:
            pos = str(c.get('position', 'TWR')).strip().upper() or 'TWR'
            return {
                'atc_station': f'{target}_{pos}',
                'airport': target,
                'position': pos,
                'controller': c,
            }

    return {
        'atc_station': f'{target}_TWR',
        'airport': target,
        'position': 'TWR',
        'controller': None,
    }

def resolve_atis_for_airport(airport: str):
    target = (airport or '').strip().upper()
    if not target:
        return {'atis': 'A', 'runway': 'active', 'entry': None}

    atis_list = get_atis().get('data', [])
    for entry in atis_list:
        if str(entry.get('airport', '')).strip().upper() == target:
            letter = str(entry.get('letter', '')).strip().upper() or 'A'
            content = entry.get('content') or ''
            runway = 'active'
            for line in str(content).splitlines():
                if 'ARR RWY' in line.upper():
                    tail = line.upper().split('ARR RWY', 1)[1].strip()
                    if tail:
                        runway = tail.split()[0].strip('.,;:')
                        break
            return {'atis': letter, 'runway': runway, 'entry': entry}

    return {'atis': 'A', 'runway': 'active', 'entry': None}

def _cache_daemon_loop(app):
    paths = ["/controllers", "/atis", "/fpls"]
    with app.app_context():
        while True:
            for path in paths:
                try:
                    _fetch(path)
                except:
                    pass
            time.sleep(4)

def start_cache_daemon(app):
    thread = threading.Thread(target=_cache_daemon_loop, args=(app,), daemon=True)
    thread.start()
