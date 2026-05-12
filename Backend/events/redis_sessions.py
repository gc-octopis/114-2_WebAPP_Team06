import os
import secrets
import json
from typing import Optional, Dict, Any

import redis

REDIS_URL = os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/0')

# If Redis is not available (common in local dev / CI), fall back to an in-memory store.
_redis = None
_memory_store: Dict[str, Dict[str, Any]] = {}

try:
    _redis = redis.from_url(REDIS_URL)
    _redis.ping()
except Exception:
    _redis = None

# session TTL in seconds (7 days)
SESSION_TTL = int(os.getenv('SESSION_TTL', 60 * 60 * 24 * 7))

def create_session(user_data: Dict[str, Any]) -> str:
    token = secrets.token_urlsafe(32)
    key = f"myntupp:session:{token}"
    if _redis is not None:
        _redis.set(key, json.dumps(user_data, ensure_ascii=False), ex=SESSION_TTL)
    else:
        _memory_store[key] = {"value": user_data, "expires_at": int(__import__("time").time()) + SESSION_TTL}
    return token

def get_session_user(token: str) -> Optional[Dict[str, Any]]:
    if not token:
        return None
    key = f"myntupp:session:{token}"
    if _redis is not None:
        v = _redis.get(key)
        if v is None:
            return None
        try:
            if isinstance(v, bytes):
                v = v.decode('utf-8')
            return json.loads(v)
        except Exception:
            return None

    entry = _memory_store.get(key)
    if not entry:
        return None
    now = int(__import__("time").time())
    if entry.get("expires_at", 0) <= now:
        _memory_store.pop(key, None)
        return None
    return entry.get("value")

def delete_session(token: str):
    if not token:
        return
    key = f"myntupp:session:{token}"
    if _redis is not None:
        _redis.delete(key)
    else:
        _memory_store.pop(key, None)
