# backend/app/utils/redis_rate_limiter.py
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, status
import logging

from app.config.settings import RATE_LIMIT_ENABLED, RATE_LIMIT_STORAGE
from app.config.redis_config import redis_manager

logger = logging.getLogger(__name__)

class RedisRateLimiter:
    """
    Sistema de rate limiting utilizando Redis
    Implementa algoritmo de sliding window con contadores por minuto
    """
    
    def __init__(self):
        self.enabled = RATE_LIMIT_ENABLED
        self.use_redis = RATE_LIMIT_STORAGE == "redis"
        self.redis = redis_manager
        
        # Fallback en memoria si Redis no está disponible
        self._memory_cache = {}
        
        # Prefijo para claves Redis
        self.RATE_LIMIT_PREFIX = "rate_limit:"
        
        logger.info(f"🚦 Rate Limiter inicializado - Storage: {RATE_LIMIT_STORAGE}, Enabled: {self.enabled}")
    
    def check_rate_limit(
        self, 
        identifier: str, 
        max_requests: int = 60, 
        window_seconds: int = 60,
        endpoint: str = "general"
    ) -> Dict[str, Any]:
        """
        Verifica si el identificador está dentro del límite de requests
        
        Returns:
            Dict con información del rate limit:
            - allowed: bool - Si la request está permitida
            - remaining: int - Requests restantes en la ventana
            - reset_time: int - Timestamp cuando se resetea el límite
            - retry_after: int - Segundos para reintentar si bloqueado
        """
        if not self.enabled:
            return {
                "allowed": True,
                "remaining": max_requests,
                "reset_time": int((datetime.utcnow() + timedelta(seconds=window_seconds)).timestamp()),
                "retry_after": 0
            }
        
        if self.use_redis and self.redis.is_available():
            return self._check_redis_rate_limit(identifier, max_requests, window_seconds, endpoint)
        else:
            return self._check_memory_rate_limit(identifier, max_requests, window_seconds, endpoint)
    
    def _check_redis_rate_limit(
        self, 
        identifier: str, 
        max_requests: int, 
        window_seconds: int,
        endpoint: str
    ) -> Dict[str, Any]:
        """
        Implementación de rate limiting con Redis usando sliding window
        """
        try:
            current_time = datetime.utcnow()
            window_start = current_time - timedelta(seconds=window_seconds)
            
            # Crear clave única para este identificador y endpoint
            redis_key = f"{self.RATE_LIMIT_PREFIX}{endpoint}:{identifier}"
            
            # Usar un sorted set para implementar sliding window
            # Score = timestamp, Value = request_id único
            request_id = f"{current_time.timestamp()}_{id(current_time)}"
            
            # Pipeline para operaciones atómicas
            pipe = self.redis.client.pipeline()
            
            # 1. Remover requests fuera de la ventana
            pipe.zremrangebyscore(redis_key, 0, window_start.timestamp())
            
            # 2. Añadir la request actual
            pipe.zadd(redis_key, {request_id: current_time.timestamp()})
            
            # 3. Contar requests en la ventana actual
            pipe.zcard(redis_key)
            
            # 4. Establecer TTL para limpieza automática
            pipe.expire(redis_key, window_seconds + 10)  # TTL algo mayor que la ventana
            
            # Ejecutar pipeline
            results = pipe.execute()
            current_requests = results[2]  # Resultado del ZCARD
            
            # Calcular información del rate limit
            remaining = max(0, max_requests - current_requests)
            reset_time = int((current_time + timedelta(seconds=window_seconds)).timestamp())
            allowed = current_requests <= max_requests
            
            if not allowed:
                # Si excede el límite, remover la request que acabamos de añadir
                self.redis.client.zrem(redis_key, request_id)
                retry_after = window_seconds
                
                logger.warning(
                    f"🚦 Rate limit excedido: {identifier} en {endpoint} "
                    f"({current_requests}/{max_requests} en {window_seconds}s)"
                )
            else:
                retry_after = 0
                logger.debug(
                    f"🚦 Rate limit OK: {identifier} en {endpoint} "
                    f"({current_requests}/{max_requests})"
                )
            
            return {
                "allowed": allowed,
                "remaining": remaining,
                "reset_time": reset_time,
                "retry_after": retry_after,
                "current_requests": current_requests
            }
            
        except Exception as e:
            logger.error(f"Error en Redis rate limiting: {e}")
            # En caso de error, permitir la request pero logear el problema
            return {
                "allowed": True,
                "remaining": max_requests,
                "reset_time": int((datetime.utcnow() + timedelta(seconds=window_seconds)).timestamp()),
                "retry_after": 0,
                "error": str(e)
            }
    
    def _check_memory_rate_limit(
        self, 
        identifier: str, 
        max_requests: int, 
        window_seconds: int,
        endpoint: str
    ) -> Dict[str, Any]:
        """
        Implementación de rate limiting en memoria (fallback)
        """
        try:
            current_time = datetime.utcnow()
            window_start = current_time - timedelta(seconds=window_seconds)
            
            # Crear clave única
            cache_key = f"{endpoint}:{identifier}"
            
            # Obtener o crear lista de timestamps
            if cache_key not in self._memory_cache:
                self._memory_cache[cache_key] = []
            
            # Limpiar requests fuera de la ventana
            self._memory_cache[cache_key] = [
                timestamp for timestamp in self._memory_cache[cache_key]
                if timestamp > window_start
            ]
            
            current_requests = len(self._memory_cache[cache_key])
            allowed = current_requests < max_requests
            
            if allowed:
                # Añadir request actual
                self._memory_cache[cache_key].append(current_time)
                current_requests += 1
            
            remaining = max(0, max_requests - current_requests)
            reset_time = int((current_time + timedelta(seconds=window_seconds)).timestamp())
            retry_after = window_seconds if not allowed else 0
            
            if not allowed:
                logger.warning(
                    f"🚦 Rate limit excedido (memoria): {identifier} en {endpoint} "
                    f"({current_requests}/{max_requests})"
                )
            
            return {
                "allowed": allowed,
                "remaining": remaining,
                "reset_time": reset_time,
                "retry_after": retry_after,
                "current_requests": current_requests
            }
            
        except Exception as e:
            logger.error(f"Error en memory rate limiting: {e}")
            return {
                "allowed": True,
                "remaining": max_requests,
                "reset_time": int((datetime.utcnow() + timedelta(seconds=window_seconds)).timestamp()),
                "retry_after": 0,
                "error": str(e)
            }
    
    def get_identifier(self, request: Request, use_user_id: bool = False) -> str:
        """
        Obtiene un identificador único para la request
        """
        # Si se especifica usar user_id y está disponible
        if use_user_id and hasattr(request.state, 'user_id'):
            return f"user:{request.state.user_id}"
        
        # Usar IP como identificador por defecto
        ip_address = self._get_client_ip(request)
        return f"ip:{ip_address}"
    
    def _get_client_ip(self, request: Request) -> str:
        """
        Obtiene la IP real del cliente considerando proxies
        """
        # Intentar obtener IP real de headers de proxy
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # X-Forwarded-For puede contener múltiples IPs separadas por coma
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        
        # Fallback a IP directa
        return getattr(request.client, 'host', 'unknown') if request.client else 'unknown'
    
    def cleanup_memory_cache(self) -> int:
        """
        Limpia entradas expiradas del cache en memoria
        """
        if not self._memory_cache:
            return 0
        
        try:
            current_time = datetime.utcnow()
            cleaned_count = 0
            
            # Limpiar entradas con timestamps muy antiguos (>1 hora)
            cutoff_time = current_time - timedelta(hours=1)
            
            keys_to_remove = []
            for key, timestamps in self._memory_cache.items():
                # Filtrar timestamps antiguos
                filtered_timestamps = [ts for ts in timestamps if ts > cutoff_time]
                
                if not filtered_timestamps:
                    keys_to_remove.append(key)
                    cleaned_count += 1
                else:
                    self._memory_cache[key] = filtered_timestamps
            
            # Remover claves vacías
            for key in keys_to_remove:
                del self._memory_cache[key]
            
            if cleaned_count > 0:
                logger.info(f"🧹 Cache de rate limiting limpiado: {cleaned_count} entradas")
            
            return cleaned_count
            
        except Exception as e:
            logger.error(f"Error limpiando cache de rate limiting: {e}")
            return 0
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Obtiene estadísticas del rate limiter
        """
        stats = {
            "enabled": self.enabled,
            "storage": RATE_LIMIT_STORAGE,
            "redis_available": self.redis.is_available() if self.use_redis else False
        }
        
        if self.use_redis and self.redis.is_available():
            try:
                # Contar claves de rate limiting en Redis
                rate_limit_keys = self.redis.keys(f"{self.RATE_LIMIT_PREFIX}*")
                stats.update({
                    "active_limiters": len(rate_limit_keys),
                    "storage_type": "redis",
                    "auto_cleanup": True
                })
            except Exception as e:
                stats["redis_error"] = str(e)
        else:
            # Estadísticas del cache en memoria
            stats.update({
                "active_limiters": len(self._memory_cache),
                "storage_type": "memory",
                "auto_cleanup": False
            })
        
        return stats
    
    def reset_identifier_limits(self, identifier: str, endpoint: str = "*") -> bool:
        """
        Resetea los límites para un identificador específico
        """
        try:
            if self.use_redis and self.redis.is_available():
                if endpoint == "*":
                    # Resetear todos los endpoints para este identificador
                    pattern = f"{self.RATE_LIMIT_PREFIX}*:{identifier}"
                    keys = self.redis.keys(pattern)
                    deleted_count = 0
                    for key in keys:
                        if self.redis.delete(key):
                            deleted_count += 1
                    logger.info(f"✅ Rate limits reseteados para {identifier}: {deleted_count} endpoints")
                    return deleted_count > 0
                else:
                    # Resetear endpoint específico
                    redis_key = f"{self.RATE_LIMIT_PREFIX}{endpoint}:{identifier}"
                    success = self.redis.delete(redis_key)
                    if success:
                        logger.info(f"✅ Rate limit reseteado: {identifier} en {endpoint}")
                    return success
            else:
                # Resetear en memoria
                if endpoint == "*":
                    keys_to_remove = [k for k in self._memory_cache.keys() if k.endswith(f":{identifier}")]
                    for key in keys_to_remove:
                        del self._memory_cache[key]
                    return len(keys_to_remove) > 0
                else:
                    cache_key = f"{endpoint}:{identifier}"
                    if cache_key in self._memory_cache:
                        del self._memory_cache[cache_key]
                        return True
                    return False
                    
        except Exception as e:
            logger.error(f"Error reseteando rate limits para {identifier}: {e}")
            return False

# Instancia global del rate limiter
redis_rate_limiter = RedisRateLimiter()

# Decorador para aplicar rate limiting
def rate_limit(
    max_requests: int = 60,
    window_seconds: int = 60,
    per_user: bool = False,
    endpoint_name: Optional[str] = None
):
    """
    Decorador para aplicar rate limiting a endpoints
    
    Args:
        max_requests: Número máximo de requests en la ventana
        window_seconds: Duración de la ventana en segundos
        per_user: Si True, aplica límite por usuario; si False, por IP
        endpoint_name: Nombre personalizado del endpoint (auto-detectado si no se especifica)
    """
    def decorator(func):
        def wrapper(request: Request, *args, **kwargs):
            # Determinar nombre del endpoint
            endpoint = endpoint_name or getattr(func, '__name__', 'unknown')
            
            # Obtener identificador
            identifier = redis_rate_limiter.get_identifier(request, use_user_id=per_user)
            
            # Verificar rate limit
            limit_info = redis_rate_limiter.check_rate_limit(
                identifier=identifier,
                max_requests=max_requests,
                window_seconds=window_seconds,
                endpoint=endpoint
            )
            
            if not limit_info["allowed"]:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Demasiadas solicitudes. Inténtalo más tarde.",
                    headers={
                        "Retry-After": str(limit_info["retry_after"]),
                        "X-RateLimit-Limit": str(max_requests),
                        "X-RateLimit-Remaining": str(limit_info["remaining"]),
                        "X-RateLimit-Reset": str(limit_info["reset_time"])
                    }
                )
            
            # Ejecutar función original
            return func(request, *args, **kwargs)
        
        return wrapper
    return decorator