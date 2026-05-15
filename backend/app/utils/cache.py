import threading
import time

class Cache:
    def __init__(self, ttl=5):
        self._data = {}
        self._lock = threading.Lock()
        self._ttl = ttl

    def get(self, key):
        with self._lock:
            entry = self._data.get(key)
            if entry and (time.time() - entry[0] < self._ttl):
                return entry[1]
        return None

    def set(self, key, value):
        with self._lock:
            self._data[key] = (time.time(), value)

    def get_timestamp(self, key):
        with self._lock:
            entry = self._data.get(key)
            return entry[0] if entry else time.time()
