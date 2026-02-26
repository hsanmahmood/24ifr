import json
import threading
import time
from collections import defaultdict
import requests
from flask import current_app
from ..core.config import Config

# simple in-memory TTL cache keyed by endpoint path
_cache = {}
_cache_lock = threading.Lock()
_CACHE_TTL = 5  # seconds

class ExternalApiService:
    def __init__(self):
        self.session = requests.Session()

    def _get(self, path: str):
        url = Config.RELAY_URL.rstrip('/') + path
        now = time.time()
        with _cache_lock:
            entry = _cache.get(path)
            if entry and now - entry[0] < _CACHE_TTL:
                return entry[1]
        try:
            resp = self.session.get(url, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            with _cache_lock:
                _cache[path] = (now, data)
            return data
        except requests.exceptions.RequestException as e:
            current_app.logger.error(f"Failed to fetch {url}: {e}", exc_info=True)
            raise

    def get_controllers(self):
        return {"data": self._get("/controllers"), "lastUpdated": time.time(), "source": "relay"}

    def get_atis(self):
        return {"data": self._get("/atis"), "lastUpdated": time.time(), "source": "relay"}

    def get_flight_plans(self, event: bool = False):
        path = "/fpls/event" if event else "/fpls"
        return self._get(path)

    def get_acft_data(self, event: bool = False):
        path = "/acft-data/event" if event else "/acft-data"
        return self._get(path)

    def get_health(self):
        return self._get("/health")

external_api_service = ExternalApiService()
