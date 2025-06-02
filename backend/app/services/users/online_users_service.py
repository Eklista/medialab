# backend/app/services/users/online_users_service.py - SERVICIO COMPLETO

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import logging

from app.config.redis_config import redis_manager
from app.models.auth.users import User

logger = logging.getLogger(__name__)

class OnlineUsersService:
    """
    🎯 Servicio completo para usuarios online usando tu RedisManager existente
    """
    
    # ===== CONFIGURACIÓN =====
    REDIS_PREFIX = "user:online:"
    STATS_PREFIX = "online:stats:"
    HEARTBEAT_TTL = 90  # 90 segundos (permite 1 heartbeat perdido)
    HEARTBEAT_INTERVAL = 60  # Heartbeat cada 60 segundos
    FALLBACK_THRESHOLD_MINUTES = 5  # Para fallback a BD
    
    def __init__(self):
        self.redis = redis_manager
        logger.info("🎯 OnlineUsersService inicializado con RedisManager")
    
    # ===== CORE METHODS =====
    
    def mark_user_online(self, user_id: int, extra_data: Optional[Dict] = None) -> bool:
        """
        🟢 Marca un usuario como online en Redis
        """
        try:
            redis_key = f"{self.REDIS_PREFIX}{user_id}"
            
            # Datos a guardar
            online_data = {
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat(),
                "status": "online",
                "heartbeat_count": self._increment_heartbeat_count(user_id)
            }
            
            # Añadir datos extra si se proporcionan
            if extra_data:
                online_data.update(extra_data)
            
            # Guardar en Redis con TTL
            success = self.redis.set(redis_key, online_data, expire=self.HEARTBEAT_TTL)
            
            if success:
                logger.debug(f"✅ Usuario {user_id} marcado como online (TTL: {self.HEARTBEAT_TTL}s)")
                
                # Actualizar estadísticas globales
                self._update_global_stats("user_online", user_id)
            else:
                logger.warning(f"⚠️ No se pudo marcar usuario {user_id} como online en Redis")
            
            return success
            
        except Exception as e:
            logger.error(f"💥 Error marcando usuario {user_id} como online: {e}")
            return False
    
    def mark_user_offline(self, user_id: int, reason: str = "logout") -> bool:
        """
        🔴 Marca un usuario como offline (elimina de Redis)
        """
        try:
            redis_key = f"{self.REDIS_PREFIX}{user_id}"
            
            # Obtener datos antes de eliminar (para logs)
            user_data = self.redis.get(redis_key, as_json=True)
            
            # Eliminar de Redis
            success = self.redis.delete(redis_key)
            
            if success:
                logger.debug(f"✅ Usuario {user_id} marcado como offline (razón: {reason})")
                
                # Actualizar estadísticas
                self._update_global_stats("user_offline", user_id)
                
                # Log del tiempo online si había datos
                if user_data and isinstance(user_data, dict):
                    try:
                        online_since = datetime.fromisoformat(user_data.get("timestamp", ""))
                        online_duration = datetime.utcnow() - online_since
                        logger.debug(f"📊 Usuario {user_id} estuvo online {online_duration.total_seconds():.0f}s")
                    except:
                        pass
            else:
                logger.debug(f"⚠️ Usuario {user_id} ya estaba offline o no se pudo remover")
            
            return True  # Siempre exitoso (no importa si ya estaba offline)
            
        except Exception as e:
            logger.error(f"💥 Error marcando usuario {user_id} como offline: {e}")
            return False
    
    def is_user_online(self, user_id: int) -> bool:
        """
        🔍 Verifica si un usuario está online
        """
        try:
            redis_key = f"{self.REDIS_PREFIX}{user_id}"
            return self.redis.exists(redis_key)
        except Exception as e:
            logger.error(f"💥 Error verificando si usuario {user_id} está online: {e}")
            return False
    
    def get_user_online_info(self, user_id: int) -> Optional[Dict[str, Any]]:
        """
        📋 Obtiene información detallada del estado online de un usuario
        """
        try:
            redis_key = f"{self.REDIS_PREFIX}{user_id}"
            user_data = self.redis.get(redis_key, as_json=True)
            
            if user_data and isinstance(user_data, dict):
                # Calcular tiempo online
                try:
                    online_since = datetime.fromisoformat(user_data.get("timestamp", ""))
                    online_duration = datetime.utcnow() - online_since
                    user_data["online_duration_seconds"] = int(online_duration.total_seconds())
                    user_data["online_since_readable"] = online_since.strftime("%H:%M:%S")
                except:
                    pass
                
                return user_data
            
            return None
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo info online de usuario {user_id}: {e}")
            return None
    
    # ===== BULK OPERATIONS =====
    
    def get_online_user_ids(self) -> List[int]:
        """
        📋 Obtiene lista de IDs de usuarios online
        """
        try:
            pattern = f"{self.REDIS_PREFIX}*"
            keys = self.redis.keys(pattern)
            
            user_ids = []
            for key in keys:
                try:
                    # Extraer user_id: "user:online:123" -> 123
                    user_id = int(key.split(':')[-1])
                    user_ids.append(user_id)
                except (ValueError, IndexError):
                    logger.warning(f"⚠️ Key Redis malformada: {key}")
                    continue
            
            logger.debug(f"📊 {len(user_ids)} usuarios online en Redis")
            return user_ids
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo IDs de usuarios online: {e}")
            return []
    
    def get_online_users_formatted(self, db: Session, include_details: bool = True) -> List[Dict[str, Any]]:
        """
        👥 Obtiene usuarios online con datos completos desde Redis + BD
        """
        try:
            # 1. Obtener IDs desde Redis
            online_user_ids = self.get_online_user_ids()
            
            if not online_user_ids:
                logger.debug("📭 No hay usuarios online en Redis")
                return []
            
            # 2. Obtener datos de usuarios desde BD (single query)
            users_query = db.query(User).filter(
                User.id.in_(online_user_ids),
                User.is_active == True
            )
            
            users = users_query.all()
            logger.debug(f"📊 {len(users)} usuarios encontrados en BD de {len(online_user_ids)} IDs online")
            
            # 3. Formatear usuarios
            formatted_users = []
            for user in users:
                try:
                    # Datos básicos
                    formatted_user = {
                        "id": user.id,
                        "email": user.email,
                        "fullName": self._get_full_name(user),
                        "initials": self._get_initials(user),
                        "profileImage": getattr(user, 'profile_image', None),
                        "isOnline": True,
                        "status": "online",
                        "source": "redis"
                    }
                    
                    # Datos detallados si se solicitan
                    if include_details:
                        # Info de Redis
                        online_info = self.get_user_online_info(user.id)
                        if online_info:
                            formatted_user.update({
                                "lastSeen": online_info.get("timestamp"),
                                "onlineDuration": online_info.get("online_duration_seconds", 0),
                                "heartbeatCount": online_info.get("heartbeat_count", 0),
                                "onlineSince": online_info.get("online_since_readable")
                            })
                        
                        # Info de BD
                        formatted_user.update({
                            "lastLogin": user.last_login.isoformat() if user.last_login else None,
                            "joinDate": user.join_date.isoformat() if hasattr(user, 'join_date') and user.join_date else None,
                            "phone": getattr(user, 'phone', None)
                        })
                    
                    formatted_users.append(formatted_user)
                    
                except Exception as format_error:
                    logger.error(f"💥 Error formateando usuario {user.id}: {format_error}")
                    continue
            
            logger.info(f"✅ {len(formatted_users)} usuarios online formateados")
            return formatted_users
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo usuarios online formateados: {e}")
            return []
    
    def get_online_users_fallback(self, db: Session) -> List[Dict[str, Any]]:
        """
        🔄 Fallback: obtener usuarios "online" desde BD cuando Redis no está disponible
        """
        try:
            logger.info("🔄 Usando fallback BD para usuarios online...")
            
            # Usar last_login reciente como indicador de "online"
            threshold = datetime.utcnow() - timedelta(minutes=self.FALLBACK_THRESHOLD_MINUTES)
            
            # Query de fallback
            fallback_users = db.query(User).filter(
                User.is_active == True,
                User.last_login >= threshold
            ).order_by(User.last_login.desc()).limit(50).all()
            
            # Formatear usuarios de fallback
            formatted_users = []
            for user in fallback_users:
                try:
                    # Determinar si está "recientemente activo"
                    is_recent = user.last_login and user.last_login >= threshold
                    
                    formatted_user = {
                        "id": user.id,
                        "email": user.email,
                        "fullName": self._get_full_name(user),
                        "initials": self._get_initials(user),
                        "profileImage": getattr(user, 'profile_image', None),
                        "isOnline": is_recent,
                        "status": "away" if is_recent else "offline",
                        "lastSeen": user.last_login.isoformat() if user.last_login else None,
                        "lastLogin": user.last_login.isoformat() if user.last_login else None,
                        "source": "database_fallback"
                    }
                    
                    # Solo incluir usuarios que parezcan "activos"
                    if is_recent:
                        formatted_users.append(formatted_user)
                    
                except Exception as format_error:
                    logger.error(f"💥 Error formateando usuario fallback {user.id}: {format_error}")
                    continue
            
            logger.info(f"✅ {len(formatted_users)} usuarios desde BD fallback")
            return formatted_users
            
        except Exception as e:
            logger.error(f"💥 Error en fallback BD: {e}")
            return []
    
    # ===== UNIFIED METHOD =====
    
    def get_online_users_unified(self, db: Session, force_fallback: bool = False) -> Tuple[List[Dict[str, Any]], str]:
        """
        🎯 Método unificado: Redis primero, BD como fallback
        Returns: (usuarios, fuente)
        """
        if force_fallback or not self.redis.is_available():
            users = self.get_online_users_fallback(db)
            return users, "database_fallback"
        
        try:
            # Intentar Redis primero
            users = self.get_online_users_formatted(db, include_details=True)
            
            if users:
                return users, "redis"
            else:
                # Si Redis está vacío, usar fallback
                logger.info("📭 Redis vacío, usando fallback BD")
                fallback_users = self.get_online_users_fallback(db)
                return fallback_users, "database_fallback"
                
        except Exception as e:
            logger.error(f"💥 Error en método unificado: {e}")
            # Fallback en caso de error
            fallback_users = self.get_online_users_fallback(db)
            return fallback_users, "database_fallback"
    
    # ===== STATISTICS =====
    
    def get_online_stats(self) -> Dict[str, Any]:
        """
        📊 Estadísticas de usuarios online
        """
        try:
            online_user_ids = self.get_online_user_ids()
            
            # Estadísticas básicas
            stats = {
                "total_online": len(online_user_ids),
                "timestamp": datetime.utcnow().isoformat(),
                "source": "redis",
                "redis_available": self.redis.is_available(),
                "ttl_seconds": self.HEARTBEAT_TTL,
                "heartbeat_interval": self.HEARTBEAT_INTERVAL
            }
            
            # Estadísticas detalladas si hay usuarios
            if online_user_ids:
                stats.update({
                    "online_user_ids": online_user_ids[:10],  # Solo primeros 10
                    "min_user_id": min(online_user_ids),
                    "max_user_id": max(online_user_ids)
                })
                
                # Obtener info de Redis para estadísticas avanzadas
                if self.redis.is_available():
                    try:
                        redis_info = self.redis.info()
                        stats["redis_info"] = {
                            "used_memory_human": redis_info.get("used_memory_human", "N/A"),
                            "total_keys": self.redis.dbsize(),
                            "connected_clients": redis_info.get("connected_clients", 0)
                        }
                    except:
                        pass
            
            return stats
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo estadísticas: {e}")
            return {
                "total_online": 0,
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e),
                "redis_available": False
            }
    
    # ===== MAINTENANCE =====
    
    def cleanup_expired_users(self) -> Dict[str, int]:
        """
        🧹 Limpieza manual (Redis TTL ya hace limpieza automática)
        """
        try:
            # En Redis, TTL hace la limpieza automática
            # Este método es principalmente para estadísticas y verificación
            
            pattern = f"{self.REDIS_PREFIX}*"
            all_keys = self.redis.keys(pattern)
            
            expired_count = 0
            valid_count = 0
            
            for key in all_keys:
                ttl = self.redis.ttl(key)
                if ttl == -1:  # Key sin TTL (problemática)
                    logger.warning(f"⚠️ Key sin TTL encontrada: {key}")
                    self.redis.expire(key, self.HEARTBEAT_TTL)  # Añadir TTL
                    expired_count += 1
                elif ttl > 0:
                    valid_count += 1
            
            result = {
                "total_keys_checked": len(all_keys),
                "keys_without_ttl": expired_count,
                "keys_with_valid_ttl": valid_count,
                "auto_cleanup_active": True,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            if expired_count > 0:
                logger.warning(f"🧹 {expired_count} keys sin TTL encontradas y corregidas")
            
            return result
            
        except Exception as e:
            logger.error(f"💥 Error en cleanup: {e}")
            return {"error": str(e), "timestamp": datetime.utcnow().isoformat()}
    
    def get_service_health(self) -> Dict[str, Any]:
        """
        🏥 Health check del servicio
        """
        try:
            health = {
                "service": "OnlineUsersService",
                "redis_available": self.redis.is_available(),
                "timestamp": datetime.utcnow().isoformat()
            }
            
            if self.redis.is_available():
                # Test básico de Redis
                test_key = f"{self.REDIS_PREFIX}health_test"
                test_value = datetime.utcnow().isoformat()
                
                # Test write
                write_success = self.redis.set(test_key, test_value, expire=10)
                
                # Test read
                read_value = self.redis.get(test_key) if write_success else None
                read_success = read_value == test_value
                
                # Cleanup test key
                if write_success:
                    self.redis.delete(test_key)
                
                health.update({
                    "redis_write": write_success,
                    "redis_read": read_success,
                    "redis_healthy": write_success and read_success
                })
                
                # Stats básicas
                stats = self.get_online_stats()
                health["current_online_users"] = stats.get("total_online", 0)
            else:
                health.update({
                    "redis_write": False,
                    "redis_read": False,
                    "redis_healthy": False,
                    "fallback_available": True
                })
            
            # Determinar estado general
            if health.get("redis_healthy", False):
                health["status"] = "healthy"
            elif self.redis.is_available():
                health["status"] = "degraded"
            else:
                health["status"] = "fallback_mode"
            
            return health
            
        except Exception as e:
            logger.error(f"💥 Error en health check: {e}")
            return {
                "service": "OnlineUsersService",
                "status": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    # ===== PRIVATE HELPERS =====
    
    def _increment_heartbeat_count(self, user_id: int) -> int:
        """
        Incrementa contador de heartbeats para un usuario
        """
        try:
            counter_key = f"heartbeat:count:{user_id}"
            count = self.redis.incr(counter_key)
            # TTL más largo para el contador
            self.redis.expire(counter_key, self.HEARTBEAT_TTL * 2)
            return count
        except:
            return 1
    
    def _update_global_stats(self, event_type: str, user_id: int):
        """
        Actualiza estadísticas globales
        """
        try:
            stats_key = f"{self.STATS_PREFIX}daily"
            date_key = datetime.utcnow().strftime("%Y-%m-%d")
            
            # Incrementar contador del evento
            event_key = f"{stats_key}:{date_key}:{event_type}"
            self.redis.incr(event_key)
            self.redis.expire(event_key, 24 * 60 * 60)  # TTL 24 horas
            
        except Exception as e:
            logger.debug(f"Error actualizando stats globales: {e}")
    
    @staticmethod
    def _get_full_name(user) -> str:
        """Obtiene nombre completo del usuario"""
        first_name = getattr(user, 'first_name', '') or ''
        last_name = getattr(user, 'last_name', '') or ''
        
        if first_name and last_name:
            return f"{first_name} {last_name}"
        elif first_name:
            return first_name
        elif last_name:
            return last_name
        else:
            return user.email.split('@')[0] if user.email else "Usuario"
    
    @staticmethod
    def _get_initials(user) -> str:
        """Obtiene iniciales del usuario"""
        first_name = getattr(user, 'first_name', '') or ''
        last_name = getattr(user, 'last_name', '') or ''
        
        if first_name and last_name:
            return f"{first_name[0]}{last_name[0]}".upper()
        elif first_name:
            return first_name[0].upper()
        elif user.email:
            return user.email[0].upper()
        else:
            return "U"

# ===== INSTANCIA GLOBAL =====
online_users_service = OnlineUsersService()

# ===== UTILIDADES ADICIONALES =====

def get_user_online_status(user_id: int) -> Dict[str, Any]:
    """
    Función de utilidad para obtener estado online de un usuario
    """
    return {
        "user_id": user_id,
        "is_online": online_users_service.is_user_online(user_id),
        "details": online_users_service.get_user_online_info(user_id),
        "timestamp": datetime.utcnow().isoformat()
    }

def mark_user_activity(user_id: int, activity_type: str = "heartbeat"):
    """
    Función de utilidad para marcar actividad de usuario
    """
    extra_data = {
        "activity_type": activity_type,
        "activity_timestamp": datetime.utcnow().isoformat()
    }
    return online_users_service.mark_user_online(user_id, extra_data)