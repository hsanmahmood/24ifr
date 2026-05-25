import threading
import time
import random
import requests
from flask import current_app
from .config import Config

_cache = {}
_cache_lock = threading.Lock()
import threading
import time
import random
import requests
from .config import Config

_cache: dict = {}
_cache_lock = threading.Lock()
_CACHE_TTL = 5
_session = requests.Session()


def _get(path: str):
    url = Config.RELAY_URL.rstrip("/") + path
    now = time.time()
    with _cache_lock:
        entry = _cache.get(path)
        if entry and now - entry[0] < _CACHE_TTL:
            return entry[1]
    resp = _session.get(url, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    with _cache_lock:
        _cache[path] = (now, data)
    return data


def get_controllers():
    data = _get("/controllers")
    with _cache_lock:
        fetch_time = _cache.get("/controllers", (time.time(), None))[0]
    return {"data": data, "lastUpdated": fetch_time, "source": "relay"}


def get_atis():
    data = _get("/atis")
    with _cache_lock:
        fetch_time = _cache.get("/atis", (time.time(), None))[0]
    return {"data": data, "lastUpdated": fetch_time, "source": "relay"}


def get_flight_plans(event: bool = False):
    return _get("/fpls/event" if event else "/fpls")


def get_health():
    return _get("/health")


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
    target = airport.strip().upper()
    if not target:
        return {"atc_station": f"{target}_TWR", "airport": target, "position": "TWR", "controller": None}
    controllers = get_controllers()
    controller_list = controllers.get("data", [])
    if not isinstance(controller_list, list):
        return {"atc_station": f"{target}_TWR", "airport": target, "position": "TWR", "controller": None}
    for controller in controller_list:
        if str(controller.get("airport", "")).strip().upper() == target and controller.get("claimable") is False:
            position = str(controller.get("position", "TWR")).strip().upper() or "TWR"
            return {"atc_station": f"{target}_{position}", "airport": target, "position": position, "controller": controller}
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


def _cache_daemon_loop():
    paths = ["/controllers", "/atis", "/fpls"]
    while True:
        for path in paths:
            try:
                _get(path)
            except requests.RequestException:
                pass
        time.sleep(4)


def start_cache_daemon():
    thread = threading.Thread(target=_cache_daemon_loop, daemon=True)
    thread.start()
    return _get("/health")
