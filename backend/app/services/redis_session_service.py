# backend/app/services/redis_session_service.py
import json
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import logging

from app.config.redis_config import redis_manager
from app.config.settings import ACCESS_TOKEN_EXPIRE_MINUTES

logger = logging.getLogger(__name__)

class RedisSessionService:
    """
    Servicio de gestión de sesiones usando Redis
    """
    
    def __init__(self):
        self.redis = redis_manager
        
        # Prefijos para diferentes tipos de sesiones
        self.SESSION_PREFIX = "session:"
        self.USER_SESSIONS_PREFIX = "user_sessions:"
        self.ACTIVE_USERS_PREFIX = "active_users:"
        self.DEVICE_SESSIONS_PREFIX = "device_sessions:"
        
        # TTL por defecto para sesiones (en segundos)
        self.DEFAULT_SESSION_TTL = ACCESS_TOKEN_EXPIRE_MINUTES * 60
        self.EXTENDED_SESSION_TTL = 7 * 24 * 60 * 60  # 7 días
        
        logger.info("🔐 Redis Session Service inicializado")
    
    def create_session(
        self,
        user_id: int,
        device_info: Dict[str, Any] = None,
        extended: bool = False,
        session_data: Dict[str, Any] = None
    ) -> str:
        """
        Crea una nueva sesión para un usuario
        """
        if not self.redis.is_available():
            logger.warning("Redis no disponible, sesión no creada")
            return None
        
        try:
            # Generar ID único de sesión
            session_id = secrets.token_urlsafe(32)
            
            # Preparar datos de la sesión
            session_info = {
                "session_id": session_id,
                "user_id": user_id,
                "created_at": datetime.utcnow().isoformat(),
                "last_activity": datetime.utcnow().isoformat(),
                "device_info": device_info or {},
                "is_active": True,
                "extended": extended,
                "data": session_data or {}
            }
            
            # TTL según tipo de sesión
            ttl = self.EXTENDED_SESSION_TTL if extended else self.DEFAULT_SESSION_TTL
            
            # Guardar sesión principal
            session_key = f"{self.SESSION_PREFIX}{session_id}"
            success = self.redis.set(session_key, session_info, expire=ttl)
            
            if not success:
                logger.error(f"Error creando sesión para usuario {user_id}")
                return None
            
            # Añadir a lista de sesiones del usuario
            user_sessions_key = f"{self.USER_SESSIONS_PREFIX}{user_id}"
            self.redis.sadd(user_sessions_key, session_id)
            self.redis.expire(user_sessions_key, ttl)
            
            # Marcar usuario como activo
            self._update_user_activity(user_id, session_id)
            
            logger.info(f"✅ Sesión creada: {session_id} para usuario {user_id} (TTL: {ttl}s)")
            return session_id
            
        except Exception as e:
            logger.error(f"Error creando sesión para usuario {user_id}: {e}")
            return None
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene información de una sesión
        """
        if not self.redis.is_available() or not session_id:
            return None
        
        try:
            session_key = f"{self.SESSION_PREFIX}{session_id}"
            session_data = self.redis.get(session_key, as_json=True)
            
            if session_data and session_data.get("is_active"):
                # Actualizar última actividad
                self._update_session_activity(session_id)
                return session_data
            
            return None
            
        except Exception as e:
            logger.error(f"Error obteniendo sesión {session_id}: {e}")
            return None
    
    def update_session(
        self,
        session_id: str,
        session_data: Dict[str, Any] = None,
        extend_ttl: bool = True
    ) -> bool:
        """
        Actualiza datos de una sesión
        """
        if not self.redis.is_available() or not session_id:
            return False
        
        try:
            session_key = f"{self.SESSION_PREFIX}{session_id}"
            current_session = self.redis.get(session_key, as_json=True)
            
            if not current_session:
                return False
            
            # Actualizar datos
            if session_data:
                current_session["data"].update(session_data)
            
            current_session["last_activity"] = datetime.utcnow().isoformat()
            
            # Determinar TTL
            if extend_ttl:
                ttl = self.EXTENDED_SESSION_TTL if current_session.get("extended") else self.DEFAULT_SESSION_TTL
            else:
                ttl = self.redis.ttl(session_key)
                ttl = max(ttl, 60)  # Mínimo 1 minuto
            
            success = self.redis.set(session_key, current_session, expire=ttl)
            
            if success:
                # Actualizar actividad del usuario
                self._update_user_activity(current_session["user_id"], session_id)
                logger.debug(f"✅ Sesión actualizada: {session_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error actualizando sesión {session_id}: {e}")
            return False
    
    def destroy_session(self, session_id: str) -> bool:
        """
        Destruye una sesión específica
        """
        if not self.redis.is_available() or not session_id:
            return False
        
        try:
            session_key = f"{self.SESSION_PREFIX}{session_id}"
            
            # Obtener info antes de eliminar
            session_data = self.redis.get(session_key, as_json=True)
            
            if session_data:
                user_id = session_data.get("user_id")
                
                # Eliminar de lista de sesiones del usuario
                if user_id:
                    user_sessions_key = f"{self.USER_SESSIONS_PREFIX}{user_id}"
                    self.redis.srem(user_sessions_key, session_id)
            
            # Eliminar sesión
            success = self.redis.delete(session_key)
            
            if success:
                logger.info(f"🗑️ Sesión destruida: {session_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error destruyendo sesión {session_id}: {e}")
            return False
    
    def destroy_all_user_sessions(self, user_id: int) -> int:
        """
        Destruye todas las sesiones de un usuario
        """
        if not self.redis.is_available():
            return 0
        
        try:
            user_sessions_key = f"{self.USER_SESSIONS_PREFIX}{user_id}"
            
            # Obtener todas las sesiones del usuario
            session_ids = self.redis.client.smembers(user_sessions_key)
            
            destroyed_count = 0
            
            for session_id in session_ids:
                session_key = f"{self.SESSION_PREFIX}{session_id}"
                if self.redis.delete(session_key):
                    destroyed_count += 1
            
            # Limpiar lista de sesiones del usuario
            self.redis.delete(user_sessions_key)
            
            # Remover de usuarios activos
            active_users_key = f"{self.ACTIVE_USERS_PREFIX}current"
            self.redis.client.zrem(active_users_key, user_id)
            
            if destroyed_count > 0:
                logger.info(f"🗑️ Destruidas {destroyed_count} sesiones del usuario {user_id}")
            
            return destroyed_count
            
        except Exception as e:
            logger.error(f"Error destruyendo sesiones del usuario {user_id}: {e}")
            return 0
    
    def get_user_sessions(self, user_id: int) -> List[Dict[str, Any]]:
        """
        Obtiene todas las sesiones activas de un usuario
        """
        if not self.redis.is_available():
            return []
        
        try:
            user_sessions_key = f"{self.USER_SESSIONS_PREFIX}{user_id}"
            session_ids = self.redis.client.smembers(user_sessions_key)
            
            sessions = []
            
            for session_id in session_ids:
                session_data = self.get_session(session_id)
                if session_data:
                    sessions.append(session_data)
            
            return sessions
            
        except Exception as e:
            logger.error(f"Error obteniendo sesiones del usuario {user_id}: {e}")
            return []
    
    def get_active_users(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Obtiene lista de usuarios activos
        """
        if not self.redis.is_available():
            return []
        
        try:
            active_users_key = f"{self.ACTIVE_USERS_PREFIX}current"
            
            # Obtener usuarios ordenados por última actividad (score es timestamp)
            user_scores = self.redis.client.zrevrange(
                active_users_key, 
                0, 
                limit - 1, 
                withscores=True
            )
            
            active_users = []
            
            for user_id, last_activity_timestamp in user_scores:
                user_id = int(user_id)
                last_activity = datetime.fromtimestamp(last_activity_timestamp)
                
                # Solo incluir usuarios activos en las últimas 2 horas
                if datetime.utcnow() - last_activity < timedelta(hours=2):
                    sessions = self.get_user_sessions(user_id)
                    
                    active_users.append({
                        "user_id": user_id,
                        "last_activity": last_activity.isoformat(),
                        "active_sessions": len(sessions),
                        "sessions": sessions
                    })
            
            return active_users
            
        except Exception as e:
            logger.error(f"Error obteniendo usuarios activos: {e}")
            return []
    
    def cleanup_expired_sessions(self) -> int:
        """
        Limpia sesiones expiradas (Redis hace esto automáticamente, pero limpiamos metadatos)
        """
        if not self.redis.is_available():
            return 0
        
        try:
            cleaned_count = 0
            
            # Limpiar listas de sesiones de usuarios
            user_session_keys = self.redis.keys(f"{self.USER_SESSIONS_PREFIX}*")
            
            for user_sessions_key in user_session_keys:
                try:
                    user_id = user_sessions_key.split(":")[-1]
                    session_ids = self.redis.client.smembers(user_sessions_key)
                    
                    valid_sessions = []
                    
                    for session_id in session_ids:
                        session_key = f"{self.SESSION_PREFIX}{session_id}"
                        if self.redis.exists(session_key):
                            valid_sessions.append(session_id)
                        else:
                            cleaned_count += 1
                    
                    # Actualizar lista con solo sesiones válidas
                    if valid_sessions:
                        self.redis.delete(user_sessions_key)
                        for session_id in valid_sessions:
                            self.redis.sadd(user_sessions_key, session_id)
                    else:
                        self.redis.delete(user_sessions_key)
                        
                except Exception as cleanup_error:
                    logger.warning(f"Error limpiando sesiones de usuario {user_id}: {cleanup_error}")
            
            # Limpiar usuarios inactivos del sorted set
            active_users_key = f"{self.ACTIVE_USERS_PREFIX}current"
            cutoff_time = (datetime.utcnow() - timedelta(hours=24)).timestamp()
            
            # Remover usuarios inactivos por más de 24 horas
            removed_users = self.redis.client.zremrangebyscore(active_users_key, 0, cutoff_time)
            cleaned_count += removed_users
            
            if cleaned_count > 0:
                logger.info(f"🧹 Limpieza de sesiones: {cleaned_count} entradas eliminadas")
            
            return cleaned_count
            
        except Exception as e:
            logger.error(f"Error en limpieza de sesiones: {e}")
            return 0
    
    def _update_session_activity(self, session_id: str) -> bool:
        """
        Actualiza la última actividad de una sesión
        """
        try:
            session_key = f"{self.SESSION_PREFIX}{session_id}"
            session_data = self.redis.get(session_key, as_json=True)
            
            if session_data:
                session_data["last_activity"] = datetime.utcnow().isoformat()
                
                # Mantener TTL existente
                ttl = self.redis.ttl(session_key)
                ttl = max(ttl, 60)  # Mínimo 1 minuto
                
                return self.redis.set(session_key, session_data, expire=ttl)
            
            return False
            
        except Exception as e:
            logger.error(f"Error actualizando actividad de sesión {session_id}: {e}")
            return False
    
    def _update_user_activity(self, user_id: int, session_id: str) -> bool:
        """
        Actualiza la actividad del usuario en el sorted set de usuarios activos
        """
        try:
            active_users_key = f"{self.ACTIVE_USERS_PREFIX}current"
            current_timestamp = datetime.utcnow().timestamp()
            
            # Añadir/actualizar usuario con timestamp actual como score
            success = self.redis.client.zadd(active_users_key, {user_id: current_timestamp})
            
            # Establecer TTL para el sorted set (48 horas)
            self.redis.expire(active_users_key, 48 * 60 * 60)
            
            return bool(success)
            
        except Exception as e:
            logger.error(f"Error actualizando actividad del usuario {user_id}: {e}")
            return False
    
    def is_user_online(self, user_id: int, threshold_minutes: int = 15) -> bool:
        """
        Verifica si un usuario está online (tiene actividad reciente)
        """
        if not self.redis.is_available():
            return False
        
        try:
            active_users_key = f"{self.ACTIVE_USERS_PREFIX}current"
            last_activity_timestamp = self.redis.client.zscore(active_users_key, user_id)
            
            if last_activity_timestamp is None:
                return False
            
            last_activity = datetime.fromtimestamp(last_activity_timestamp)
            threshold = datetime.utcnow() - timedelta(minutes=threshold_minutes)
            
            return last_activity > threshold
            
        except Exception as e:
            logger.error(f"Error verificando si usuario {user_id} está online: {e}")
            return False
    
    def get_session_stats(self) -> Dict[str, Any]:
        """
        Obtiene estadísticas de sesiones
        """
        if not self.redis.is_available():
            return {"redis_available": False}
        
        try:
            # Contar diferentes tipos de claves
            total_sessions = len(self.redis.keys(f"{self.SESSION_PREFIX}*"))
            user_session_lists = len(self.redis.keys(f"{self.USER_SESSIONS_PREFIX}*"))
            active_users_sets = len(self.redis.keys(f"{self.ACTIVE_USERS_PREFIX}*"))
            
            # Usuarios únicos activos
            active_users_key = f"{self.ACTIVE_USERS_PREFIX}current"
            unique_active_users = self.redis.client.zcard(active_users_key)
            
            # Sesiones por tipo (estimado)
            extended_sessions = 0
            regular_sessions = 0
            
            session_keys = self.redis.keys(f"{self.SESSION_PREFIX}*")[:100]  # Muestra de 100
            for session_key in session_keys:
                session_data = self.redis.get(session_key, as_json=True)
                if session_data:
                    if session_data.get("extended"):
                        extended_sessions += 1
                    else:
                        regular_sessions += 1
            
            return {
                "redis_available": True,
                "total_active_sessions": total_sessions,
                "unique_active_users": unique_active_users,
                "user_session_lists": user_session_lists,
                "session_breakdown": {
                    "regular_sessions": regular_sessions,
                    "extended_sessions": extended_sessions,
                    "sample_size": len(session_keys)
                },
                "default_session_ttl": self.DEFAULT_SESSION_TTL,
                "extended_session_ttl": self.EXTENDED_SESSION_TTL
            }
            
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas de sesiones: {e}")
            return {"redis_available": True, "error": str(e)}
    
    def force_logout_user(self, user_id: int, reason: str = "admin_action") -> Dict[str, Any]:
        """
        Fuerza el logout de un usuario desde administración
        """
        try:
            sessions_destroyed = self.destroy_all_user_sessions(user_id)
            
            # Registrar acción en logs
            logger.warning(f"🚨 Logout forzado del usuario {user_id} - Razón: {reason}")
            
            return {
                "user_id": user_id,
                "sessions_destroyed": sessions_destroyed,
                "reason": reason,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error en logout forzado del usuario {user_id}: {e}")
            return {"error": str(e)}
    
    def get_user_login_history(self, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Obtiene historial de logins recientes del usuario (requiere implementación adicional)
        """
        # Esta funcionalidad requeriría un sistema adicional de logging
        # Por ahora, retornamos las sesiones actuales como referencia
        try:
            current_sessions = self.get_user_sessions(user_id)
            
            # Formatear como historial básico
            history = []
            for session in current_sessions[-limit:]:
                history.append({
                    "session_id": session.get("session_id"),
                    "login_time": session.get("created_at"),
                    "last_activity": session.get("last_activity"),
                    "device_info": session.get("device_info", {}),
                    "status": "active"
                })
            
            return history
            
        except Exception as e:
            logger.error(f"Error obteniendo historial de usuario {user_id}: {e}")
            return []


# Instancia global del servicio de sesiones
redis_sessions = RedisSessionService()


# ===== MIDDLEWARE DE SESIONES =====

class SessionMiddleware:
    """
    Middleware para gestión automática de sesiones con Redis
    """
    
    def __init__(self, auto_extend: bool = True, activity_threshold: int = 300):
        self.auto_extend = auto_extend
        self.activity_threshold = activity_threshold  # 5 minutos
    
    async def __call__(self, request, call_next):
        """
        Procesa request con gestión de sesiones
        """
        # Buscar session_id en cookies o headers
        session_id = request.cookies.get("session_id") or request.headers.get("X-Session-ID")
        
        if session_id:
            # Obtener y validar sesión
            session_data = redis_sessions.get_session(session_id)
            
            if session_data:
                # Añadir datos de sesión al request
                request.state.session = session_data
                request.state.user_id = session_data.get("user_id")
                
                # Auto-extender sesión si está configurado
                if self.auto_extend:
                    last_activity = datetime.fromisoformat(session_data.get("last_activity"))
                    if (datetime.utcnow() - last_activity).total_seconds() > self.activity_threshold:
                        redis_sessions.update_session(session_id, extend_ttl=True)
        
        # Procesar request
        response = await call_next(request)
        
        return response