# ===== backend/app/services/system/__init__.py =====
"""
Servicios de sistema y Redis
"""

from .redis_cache_service import RedisCacheService, redis_cache
from .redis_init_service import RedisInitService, redis_init
from .redis_session_service import RedisSessionService, redis_sessions

__all__ = [
    "RedisCacheService",
    "redis_cache",
    "RedisInitService", 
    "redis_init",
    "RedisSessionService",
    "redis_sessions"
]

__version__ = "1.0.0"
__description__ = "System and Redis services"