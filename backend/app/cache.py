import threading
import time
import logging

logger = logging.getLogger(__name__)

_cache: dict = {}
_cache_lock = threading.Lock()


def ttl_cache(key: str, ttl: int, builder):
    """
    Thread-safe TTL cache with on-demand fetching.
    
    Args:
        key: Cache key
        ttl: Time-to-live in seconds
        builder: Function that generates the value if cache miss
        
    Returns:
        Cached value or freshly built value
    """
    now = time.time()
    
    # Try to get from cache
    with _cache_lock:
        entry = _cache.get(key)
        if entry and now - entry[0] < ttl:
            logger.debug(f"Cache hit for {key}")
            return entry[1]
    
    # Cache miss - build value
    try:
        value = builder()
        with _cache_lock:
            _cache[key] = (now, value)
        return value
    except Exception as e:
        logger.error(f"Failed to build cache value for {key}: {e}", exc_info=True)
        raise