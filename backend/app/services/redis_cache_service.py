# backend/app/services/redis_cache_service.py
import json
import hashlib
from typing import Any, Optional, Callable, Union
from datetime import datetime, timedelta
from functools import wraps
import logging
import pickle

from app.config.redis_config import redis_manager
from app.config.settings import CACHE_ENABLED, CACHE_DEFAULT_TTL

logger = logging.getLogger(__name__)

class RedisCacheService:
    """
    Servicio de cache genérico usando Redis
    """
    
    def __init__(self):
        self.enabled = CACHE_ENABLED
        self.redis = redis_manager
        self.default_ttl = CACHE_DEFAULT_TTL
        
        # Prefijos para diferentes tipos de cache
        self.CACHE_PREFIX = "cache:"
        self.QUERY_CACHE_PREFIX = "query_cache:"
        self.USER_CACHE_PREFIX = "user_cache:"
        self.SESSION_CACHE_PREFIX = "session_cache:"
        
        logger.info(f"🗄️ Redis Cache Service inicializado - Enabled: {self.enabled}")
    
    def _generate_cache_key(self, key: str, prefix: str = None) -> str:
        """
        Genera una clave de cache normalizada
        """
        prefix = prefix or self.CACHE_PREFIX
        
        # Si la clave es muy larga, usar hash
        if len(key) > 200:
            key_hash = hashlib.md5(key.encode()).hexdigest()
            return f"{prefix}hash:{key_hash}"
        
        # Normalizar la clave
        normalized_key = key.replace(" ", "_").lower()
        return f"{prefix}{normalized_key}"
    
    def set(
        self, 
        key: str, 
        value: Any, 
        ttl: Optional[int] = None,
        prefix: str = None,
        serialize_method: str = "json"
    ) -> bool:
        """
        Almacena un valor en cache
        """
        if not self.enabled or not self.redis.is_available():
            return False
        
        try:
            cache_key = self._generate_cache_key(key, prefix)
            ttl = ttl or self.default_ttl
            
            # Serializar valor según método especificado
            if serialize_method == "json":
                serialized_value = json.dumps(value, default=str)
            elif serialize_method == "pickle":
                serialized_value = pickle.dumps(value)
            else:
                serialized_value = str(value)
            
            success = self.redis.set(cache_key, serialized_value, expire=ttl)
            
            if success:
                logger.debug(f"✅ Valor cacheado: {cache_key} (TTL: {ttl}s)")
            
            return success
            
        except Exception as e:
            logger.error(f"Error cacheando valor {key}: {e}")
            return False
    
    def get(
        self, 
        key: str, 
        prefix: str = None,
        deserialize_method: str = "json"
    ) -> Any:
        """
        Obtiene un valor del cache
        """
        if not self.enabled or not self.redis.is_available():
            return None
        
        try:
            cache_key = self._generate_cache_key(key, prefix)
            serialized_value = self.redis.get(cache_key)
            
            if serialized_value is None:
                logger.debug(f"🔍 Cache miss: {cache_key}")
                return None
            
            # Deserializar según método especificado
            if deserialize_method == "json":
                value = json.loads(serialized_value)
            elif deserialize_method == "pickle":
                value = pickle.loads(serialized_value)
            else:
                value = serialized_value
            
            logger.debug(f"✅ Cache hit: {cache_key}")
            return value
            
        except Exception as e:
            logger.error(f"Error obteniendo valor del cache {key}: {e}")
            return None
    
    def delete(self, key: str, prefix: str = None) -> bool:
        """
        Elimina un valor del cache
        """
        if not self.enabled or not self.redis.is_available():
            return False
        
        try:
            cache_key = self._generate_cache_key(key, prefix)
            success = self.redis.delete(cache_key)
            
            if success:
                logger.debug(f"🗑️ Valor eliminado del cache: {cache_key}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error eliminando valor del cache {key}: {e}")
            return False
    
    def exists(self, key: str, prefix: str = None) -> bool:
        """
        Verifica si una clave existe en cache
        """
        if not self.enabled or not self.redis.is_available():
            return False
        
        try:
            cache_key = self._generate_cache_key(key, prefix)
            return self.redis.exists(cache_key)
            
        except Exception as e:
            logger.error(f"Error verificando existencia en cache {key}: {e}")
            return False
    
    def invalidate_pattern(self, pattern: str, prefix: str = None) -> int:
        """
        Invalida todas las claves que coincidan con un patrón
        """
        if not self.enabled or not self.redis.is_available():
            return 0
        
        try:
            prefix = prefix or self.CACHE_PREFIX
            search_pattern = f"{prefix}{pattern}"
            
            keys = self.redis.keys(search_pattern)
            deleted_count = 0
            
            for key in keys:
                if self.redis.delete(key):
                    deleted_count += 1
            
            if deleted_count > 0:
                logger.info(f"🧹 Cache invalidado: {deleted_count} claves con patrón {pattern}")
            
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error invalidando cache con patrón {pattern}: {e}")
            return 0
    
    def get_or_set(
        self,
        key: str,
        fetch_function: Callable,
        ttl: Optional[int] = None,
        prefix: str = None,
        serialize_method: str = "json"
    ) -> Any:
        """
        Obtiene del cache o ejecuta función para obtener y cachear el valor
        """
        # Intentar obtener del cache
        cached_value = self.get(key, prefix, serialize_method)
        
        if cached_value is not None:
            return cached_value
        
        # Si no está en cache, ejecutar función
        try:
            fresh_value = fetch_function()
            
            # Cachear el resultado
            self.set(key, fresh_value, ttl, prefix, serialize_method)
            
            return fresh_value
            
        except Exception as e:
            logger.error(f"Error ejecutando función para cache {key}: {e}")
            return None
    
    # ===== MÉTODOS ESPECÍFICOS =====
    
    def cache_user_data(self, user_id: int, user_data: dict, ttl: int = 300) -> bool:
        """
        Cachea datos de usuario
        """
        key = f"user:{user_id}"
        return self.set(key, user_data, ttl, self.USER_CACHE_PREFIX)
    
    def get_user_data(self, user_id: int) -> Optional[dict]:
        """
        Obtiene datos de usuario del cache
        """
        key = f"user:{user_id}"
        return self.get(key, self.USER_CACHE_PREFIX)
    
    def invalidate_user_cache(self, user_id: int) -> bool:
        """
        Invalida cache de un usuario específico
        """
        pattern = f"user:{user_id}*"
        deleted_count = self.invalidate_pattern(pattern, self.USER_CACHE_PREFIX)
        return deleted_count > 0
    
    def cache_query_result(
        self, 
        query_signature: str, 
        result: Any, 
        ttl: int = 600
    ) -> bool:
        """
        Cachea resultado de una consulta
        """
        return self.set(query_signature, result, ttl, self.QUERY_CACHE_PREFIX)
    
    def get_query_result(self, query_signature: str) -> Any:
        """
        Obtiene resultado de consulta del cache
        """
        return self.get(query_signature, self.QUERY_CACHE_PREFIX)
    
    def invalidate_table_cache(self, table_name: str) -> int:
        """
        Invalida cache de una tabla específica
        """
        pattern = f"*{table_name}*"
        return self.invalidate_pattern(pattern, self.QUERY_CACHE_PREFIX)
    
    # ===== ESTADÍSTICAS =====
    
    def get_cache_stats(self) -> dict:
        """
        Obtiene estadísticas del cache
        """
        if not self.enabled or not self.redis.is_available():
            return {"enabled": False}
        
        try:
            # Contar claves por tipo
            cache_keys = len(self.redis.keys(f"{self.CACHE_PREFIX}*"))
            query_cache_keys = len(self.redis.keys(f"{self.QUERY_CACHE_PREFIX}*"))
            user_cache_keys = len(self.redis.keys(f"{self.USER_CACHE_PREFIX}*"))
            session_cache_keys = len(self.redis.keys(f"{self.SESSION_CACHE_PREFIX}*"))
            
            total_keys = cache_keys + query_cache_keys + user_cache_keys + session_cache_keys
            
            # Información de Redis
            redis_info = self.redis.info()
            
            return {
                "enabled": True,
                "redis_available": True,
                "total_cache_keys": total_keys,
                "cache_breakdown": {
                    "general": cache_keys,
                    "queries": query_cache_keys,
                    "users": user_cache_keys,
                    "sessions": session_cache_keys
                },
                "redis_memory": redis_info.get("used_memory_human", "N/A"),
                "default_ttl": self.default_ttl
            }
            
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas de cache: {e}")
            return {"enabled": True, "error": str(e)}
    
    def flush_all_cache(self) -> bool:
        """
        Limpia todo el cache (USAR CON CUIDADO)
        """
        if not self.enabled or not self.redis.is_available():
            return False
        
        try:
            from app.config.settings import ENVIRONMENT
            
            if ENVIRONMENT != "production":
                patterns = [
                    f"{self.CACHE_PREFIX}*",
                    f"{self.QUERY_CACHE_PREFIX}*",
                    f"{self.USER_CACHE_PREFIX}*",
                    f"{self.SESSION_CACHE_PREFIX}*"
                ]
                
                total_deleted = 0
                for pattern in patterns:
                    keys = self.redis.keys(pattern)
                    for key in keys:
                        if self.redis.delete(key):
                            total_deleted += 1
                
                logger.warning(f"🧹 Cache completamente limpiado: {total_deleted} claves")
                return True
            else:
                logger.error("No se puede limpiar cache en producción")
                return False
                
        except Exception as e:
            logger.error(f"Error limpiando cache: {e}")
            return False


# Instancia global del servicio de cache
redis_cache = RedisCacheService()


# ===== DECORADORES DE CACHE =====

def cache_result(
    ttl: int = 300,
    key_prefix: str = "func",
    include_args: bool = True,
    serialize_method: str = "json"
):
    """
    Decorador para cachear resultados de funciones
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not redis_cache.enabled:
                return func(*args, **kwargs)
            
            # Generar clave de cache
            if include_args:
                args_str = str(args) + str(sorted(kwargs.items()))
                cache_key = f"{key_prefix}:{func.__name__}:{hashlib.md5(args_str.encode()).hexdigest()}"
            else:
                cache_key = f"{key_prefix}:{func.__name__}"
            
            # Intentar obtener del cache
            cached_result = redis_cache.get(cache_key, deserialize_method=serialize_method)
            
            if cached_result is not None:
                logger.debug(f"🎯 Cache hit para función {func.__name__}")
                return cached_result
            
            # Ejecutar función y cachear resultado
            result = func(*args, **kwargs)
            redis_cache.set(cache_key, result, ttl, serialize_method=serialize_method)
            
            logger.debug(f"💾 Resultado cacheado para función {func.__name__}")
            return result
        
        return wrapper
    return decorator


def invalidate_cache_on_change(table_names: Union[str, list]):
    """
    Decorador para invalidar cache cuando se modifica una tabla
    """
    if isinstance(table_names, str):
        table_names = [table_names]
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            
            # Invalidar cache de las tablas especificadas
            for table_name in table_names:
                deleted_count = redis_cache.invalidate_table_cache(table_name)
                if deleted_count > 0:
                    logger.info(f"🧹 Cache invalidado para tabla {table_name}: {deleted_count} entradas")
            
            return result
        
        return wrapper
    return decorator