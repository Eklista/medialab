# backend/app/config/redis_config.py
import redis
import json
import logging
from typing import Optional, Any, Dict, List
from datetime import datetime, timedelta
from app.config.settings import (
    REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB, 
    REDIS_ENABLED, ENVIRONMENT
)

logger = logging.getLogger(__name__)

class RedisManager:
    """
    Gestor centralizado para todas las operaciones con Redis
    """
    
    def __init__(self):
        self._client = None
        self.enabled = REDIS_ENABLED
        self._initialize_connection()
    
    def _initialize_connection(self):
        """Inicializa la conexión con Redis"""
        if not self.enabled:
            logger.warning("Redis está deshabilitado en la configuración")
            return
            
        try:
            self._client = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                password=REDIS_PASSWORD if REDIS_PASSWORD else None,
                db=REDIS_DB,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30
            )
            
            # Probar conexión
            self._client.ping()
            logger.info(f"✅ Conexión a Redis establecida - {REDIS_HOST}:{REDIS_PORT}")
            
        except Exception as e:
            logger.error(f"❌ Error conectando a Redis: {e}")
            if ENVIRONMENT == "development":
                logger.warning("🔧 Usando fallback en memoria para desarrollo")
                self.enabled = False
            else:
                raise e
    
    @property
    def client(self) -> Optional[redis.Redis]:
        """Retorna el cliente Redis si está disponible"""
        if not self.enabled or not self._client:
            return None
        return self._client
    
    def is_available(self) -> bool:
        """Verifica si Redis está disponible"""
        if not self.enabled or not self._client:
            return False
            
        try:
            self._client.ping()
            return True
        except Exception:
            return False
    
    # ===== OPERACIONES BÁSICAS =====
    
    def set(self, key: str, value: Any, expire: Optional[int] = None) -> bool:
        """Guarda un valor en Redis con expiración opcional"""
        if not self.is_available():
            return False
            
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            
            result = self._client.set(key, value, ex=expire)
            return bool(result)
        except Exception as e:
            logger.error(f"Error setting Redis key {key}: {e}")
            return False
    
    def get(self, key: str, as_json: bool = False) -> Any:
        """Obtiene un valor de Redis"""
        if not self.is_available():
            return None
            
        try:
            value = self._client.get(key)
            if value is None:
                return None
                
            if as_json:
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
            
            return value
        except Exception as e:
            logger.error(f"Error getting Redis key {key}: {e}")
            return None
    
    def delete(self, key: str) -> bool:
        """Elimina una clave de Redis"""
        if not self.is_available():
            return False
            
        try:
            result = self._client.delete(key)
            return bool(result)
        except Exception as e:
            logger.error(f"Error deleting Redis key {key}: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        """Verifica si una clave existe en Redis"""
        if not self.is_available():
            return False
            
        try:
            return bool(self._client.exists(key))
        except Exception as e:
            logger.error(f"Error checking Redis key {key}: {e}")
            return False
    
    def expire(self, key: str, seconds: int) -> bool:
        """Establece tiempo de expiración para una clave"""
        if not self.is_available():
            return False
            
        try:
            return bool(self._client.expire(key, seconds))
        except Exception as e:
            logger.error(f"Error setting expiration for Redis key {key}: {e}")
            return False
    
    # ===== OPERACIONES PARA LISTAS =====
    
    def lpush(self, key: str, *values) -> bool:
        """Añade elementos al inicio de una lista"""
        if not self.is_available():
            return False
            
        try:
            self._client.lpush(key, *values)
            return True
        except Exception as e:
            logger.error(f"Error lpush Redis key {key}: {e}")
            return False
    
    def rpush(self, key: str, *values) -> bool:
        """Añade elementos al final de una lista"""
        if not self.is_available():
            return False
            
        try:
            self._client.rpush(key, *values)
            return True
        except Exception as e:
            logger.error(f"Error rpush Redis key {key}: {e}")
            return False
    
    def lrange(self, key: str, start: int = 0, end: int = -1) -> List[str]:
        """Obtiene elementos de una lista"""
        if not self.is_available():
            return []
            
        try:
            return self._client.lrange(key, start, end)
        except Exception as e:
            logger.error(f"Error lrange Redis key {key}: {e}")
            return []
    
    def llen(self, key: str) -> int:
        """Obtiene la longitud de una lista"""
        if not self.is_available():
            return 0
            
        try:
            return self._client.llen(key)
        except Exception as e:
            logger.error(f"Error llen Redis key {key}: {e}")
            return 0
    
    # ===== OPERACIONES PARA CONJUNTOS =====
    
    def sadd(self, key: str, *values) -> bool:
        """Añade elementos a un conjunto"""
        if not self.is_available():
            return False
            
        try:
            self._client.sadd(key, *values)
            return True
        except Exception as e:
            logger.error(f"Error sadd Redis key {key}: {e}")
            return False
    
    def sismember(self, key: str, value: str) -> bool:
        """Verifica si un elemento está en un conjunto"""
        if not self.is_available():
            return False
            
        try:
            return bool(self._client.sismember(key, value))
        except Exception as e:
            logger.error(f"Error sismember Redis key {key}: {e}")
            return False
    
    def srem(self, key: str, *values) -> bool:
        """Remueve elementos de un conjunto"""
        if not self.is_available():
            return False
            
        try:
            self._client.srem(key, *values)
            return True
        except Exception as e:
            logger.error(f"Error srem Redis key {key}: {e}")
            return False
    
    # ===== OPERACIONES PARA HASHES =====
    
    def hset(self, key: str, field: str, value: Any) -> bool:
        """Establece un campo en un hash"""
        if not self.is_available():
            return False
            
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            self._client.hset(key, field, value)
            return True
        except Exception as e:
            logger.error(f"Error hset Redis key {key}: {e}")
            return False
    
    def hget(self, key: str, field: str, as_json: bool = False) -> Any:
        """Obtiene un campo de un hash"""
        if not self.is_available():
            return None
            
        try:
            value = self._client.hget(key, field)
            if value is None:
                return None
                
            if as_json:
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
            
            return value
        except Exception as e:
            logger.error(f"Error hget Redis key {key}: {e}")
            return None
    
    def hgetall(self, key: str) -> Dict[str, Any]:
        """Obtiene todos los campos de un hash"""
        if not self.is_available():
            return {}
            
        try:
            return self._client.hgetall(key)
        except Exception as e:
            logger.error(f"Error hgetall Redis key {key}: {e}")
            return {}
    
    def hdel(self, key: str, *fields) -> bool:
        """Elimina campos de un hash"""
        if not self.is_available():
            return False
            
        try:
            self._client.hdel(key, *fields)
            return True
        except Exception as e:
            logger.error(f"Error hdel Redis key {key}: {e}")
            return False
    
    # ===== OPERACIONES AVANZADAS =====
    
    def incr(self, key: str, amount: int = 1) -> Optional[int]:
        """Incrementa un contador"""
        if not self.is_available():
            return None
            
        try:
            return self._client.incr(key, amount)
        except Exception as e:
            logger.error(f"Error incr Redis key {key}: {e}")
            return None
    
    def decr(self, key: str, amount: int = 1) -> Optional[int]:
        """Decrementa un contador"""
        if not self.is_available():
            return None
            
        try:
            return self._client.decr(key, amount)
        except Exception as e:
            logger.error(f"Error decr Redis key {key}: {e}")
            return None
    
    def keys(self, pattern: str = "*") -> List[str]:
        """Obtiene claves que coinciden con un patrón"""
        if not self.is_available():
            return []
            
        try:
            return self._client.keys(pattern)
        except Exception as e:
            logger.error(f"Error getting Redis keys with pattern {pattern}: {e}")
            return []
    
    def ttl(self, key: str) -> int:
        """Obtiene el tiempo de vida restante de una clave"""
        if not self.is_available():
            return -1
            
        try:
            return self._client.ttl(key)
        except Exception as e:
            logger.error(f"Error getting TTL for Redis key {key}: {e}")
            return -1
    
    def flushdb(self) -> bool:
        """Limpia la base de datos actual (USAR CON CUIDADO)"""
        if not self.is_available():
            return False
            
        try:
            if ENVIRONMENT != "production":
                self._client.flushdb()
                logger.warning("Redis database flushed")
                return True
            else:
                logger.error("No se puede hacer flush en producción")
                return False
        except Exception as e:
            logger.error(f"Error flushing Redis database: {e}")
            return False
    
    # ===== INFORMACIÓN Y ESTADÍSTICAS =====
    
    def info(self) -> Dict[str, Any]:
        """Obtiene información del servidor Redis"""
        if not self.is_available():
            return {}
            
        try:
            return self._client.info()
        except Exception as e:
            logger.error(f"Error getting Redis info: {e}")
            return {}
    
    def dbsize(self) -> int:
        """Obtiene el número de claves en la base de datos"""
        if not self.is_available():
            return 0
            
        try:
            return self._client.dbsize()
        except Exception as e:
            logger.error(f"Error getting Redis dbsize: {e}")
            return 0

# Instancia global del gestor Redis
redis_manager = RedisManager()