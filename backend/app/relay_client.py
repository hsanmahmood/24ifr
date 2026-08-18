import time
import logging
import requests
from flask import current_app
from .config import Config
from .cache import ttl_cache

logger = logging.getLogger(__name__)

_session = requests.Session()

AIRPORTS = {
    "IGAR": None,
    "IJAF": None,
    "IBAR": None,
    "IBLT": None,
    "IRFD": None,
    "IGRV": None,
    "IHEN": None,
    "IZOL": None,
    "ILAR": None,
    "ILKL": None,
    "IIAB": None,
    "IMLR": None,
    "IPAP": None,
    "IPPH": None,
    "ISCM": None,
    "IDCS": None,
    "IBTH": None,
    "ISAU": None,
    "ISKP": None,
    "ITKO": None,
    "ITRC": None,
    "TVO": None,
    "SHV": None,
    "OWO": None,
    "IKFL": "IGCC",
}

def _get(path: str):
    url = Config.RELAY_URL.rstrip("/") + path
    logger.info(f"Fetching from relay: {url}")
    
    def fetch():
        try:
            resp = _session.get(url, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            logger.info(f"Successfully fetched {path}, data length: {len(data) if isinstance(data, list) else 'N/A'}")
            return data
        except requests.RequestException as e:
            logger.error(f"Failed to fetch {path} from relay: {e}")
            raise
        except ValueError as e:
            logger.error(f"Failed to decode JSON from {path}: {e}")
            raise
    
    return ttl_cache(path, 5, fetch)

def get_controllers():
    data = _get("/controllers")
    return {"data": data, "lastUpdated": time.time(), "source": "relay"}

def get_atis():
    data = _get("/atis")
    return {"data": data, "lastUpdated": time.time(), "source": "relay"}

def get_flight_plans(event: bool = False):
    return _get("/fpls/event" if event else "/fpls")

def get_airports():
    return [{"icao": icao, "ctr": ctr} for icao, ctr in AIRPORTS.items()]

def get_health():
    return _get("/health")