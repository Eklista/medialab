# backend/app/utils/redis_token_blacklist.py
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import jwt, JWTError
import logging

from app.config.settings import SECRET_KEY, ALGORITHM, TOKEN_BLACKLIST_ENABLED
from app.config.redis_config import redis_manager

logger = logging.getLogger(__name__)

class RedisTokenBlacklist:
    """
    Sistema de blacklist para tokens JWT utilizando Redis
    Mucho más eficiente y escalable que MySQL para esta funcionalidad
    """
    
    def __init__(self):
        self.enabled = TOKEN_BLACKLIST_ENABLED
        self.redis = redis_manager
        
        # Prefijos para diferentes tipos de datos en Redis
        self.TOKEN_PREFIX = "blacklist:token:"
        self.USER_INVALIDATION_PREFIX = "blacklist:user:"
        self.FAILED_ATTEMPTS_PREFIX = "failed_attempts:"
        self.RESET_ATTEMPTS_PREFIX = "reset_attempts:"
        
        logger.info("🔧 Sistema de blacklist de tokens inicializado con Redis")
    
    def add_token(self, token: str, user_id: int = None) -> bool:
        """
        Añade un token a la blacklist usando Redis
        """
        if not self.enabled or not self.redis.is_available():
            return False
            
        try:
            # Decodificar token para obtener información
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            exp_timestamp = payload.get('exp')
            jti = payload.get('jti')  # JWT ID único
            token_type = payload.get('type', 'access')
            
            if not exp_timestamp or not jti:
                logger.warning("Token sin exp o jti, no se puede añadir a blacklist")
                return False
            
            # Calcular tiempo hasta expiración
            exp_datetime = datetime.fromtimestamp(exp_timestamp)
            if exp_datetime <= datetime.utcnow():
                # Token ya expirado, no necesita blacklist
                logger.debug("Token ya expirado, no necesita blacklist")
                return True
            
            # Calcular TTL para Redis (tiempo hasta expiración)
            ttl_seconds = int((exp_datetime - datetime.utcnow()).total_seconds())
            
            # Crear clave Redis para el token
            redis_key = f"{self.TOKEN_PREFIX}{jti}"
            
            # Guardar información del token en Redis con TTL automático
            token_data = {
                "user_id": user_id,
                "token_type": token_type,
                "blacklisted_at": datetime.utcnow().isoformat(),
                "expires_at": exp_datetime.isoformat(),
                "reason": "logout"
            }
            
            success = self.redis.set(redis_key, token_data, expire=ttl_seconds)
            
            if success:
                logger.info(f"✅ Token añadido a blacklist Redis: user={user_id}, type={token_type}, ttl={ttl_seconds}s")
            else:
                logger.error(f"❌ Error añadiendo token a blacklist Redis")
            
            return success
            
        except JWTError as e:
            logger.error(f"Error al decodificar token para blacklist: {e}")
            return False
        except Exception as e:
            logger.error(f"Error al añadir token a blacklist Redis: {e}")
            return False
    
    def is_blacklisted(self, token: str) -> bool:
        """
        Verifica si un token está en la blacklist usando Redis
        """
        if not self.enabled or not self.redis.is_available():
            return False
            
        try:
            # Extraer JTI del token
            jti = self._extract_jti(token)
            if not jti:
                logger.warning("Token sin JTI, considerado inválido")
                return True  # Si no tiene JTI, considerarlo inválido
            
            # Verificar en Redis
            redis_key = f"{self.TOKEN_PREFIX}{jti}"
            token_data = self.redis.get(redis_key, as_json=True)
            
            if token_data:
                logger.debug(f"🔍 Token encontrado en blacklist: {jti}")
                return True
            
            return False
                
        except Exception as e:
            logger.error(f"Error al verificar token en blacklist Redis: {e}")
            # En caso de error, denegar acceso por seguridad
            return True
    
    def remove_token(self, token: str) -> bool:
        """
        Remueve un token de la blacklist (uso administrativo)
        """
        if not self.enabled or not self.redis.is_available():
            return False
            
        try:
            jti = self._extract_jti(token)
            if not jti:
                return False
            
            redis_key = f"{self.TOKEN_PREFIX}{jti}"
            success = self.redis.delete(redis_key)
            
            if success:
                logger.info(f"✅ Token removido de blacklist: {jti}")
            
            return success
                
        except Exception as e:
            logger.error(f"Error al remover token de blacklist: {e}")
            return False
    
    def blacklist_all_user_tokens(self, user_id: int) -> bool:
        """
        Invalida todos los tokens de un usuario (útil para logout global)
        Marca al usuario como "invalidado" por 24 horas
        """
        if not self.enabled or not self.redis.is_available():
            return False
            
        try:
            # Crear clave de invalidación global del usuario
            redis_key = f"{self.USER_INVALIDATION_PREFIX}{user_id}"
            
            # Datos de invalidación
            invalidation_data = {
                "user_id": user_id,
                "invalidated_at": datetime.utcnow().isoformat(),
                "reason": "global_logout",
                "expires_at": (datetime.utcnow() + timedelta(days=1)).isoformat()
            }
            
            # TTL de 24 horas
            ttl_seconds = 24 * 60 * 60
            
            success = self.redis.set(redis_key, invalidation_data, expire=ttl_seconds)
            
            if success:
                logger.info(f"✅ Todos los tokens del usuario {user_id} invalidados por 24h")
            
            return success
            
        except Exception as e:
            logger.error(f"Error al invalidar tokens del usuario {user_id}: {e}")
            return False
    
    def is_user_invalidated(self, user_id: int, token_issued_at: datetime) -> bool:
        """
        Verifica si todos los tokens de un usuario han sido invalidados
        """
        if not self.enabled or not self.redis.is_available():
            return False
            
        try:
            redis_key = f"{self.USER_INVALIDATION_PREFIX}{user_id}"
            invalidation_data = self.redis.get(redis_key, as_json=True)
            
            if not invalidation_data:
                return False
            
            # Comparar si el token fue emitido antes de la invalidación
            invalidated_at_str = invalidation_data.get('invalidated_at')
            if invalidated_at_str:
                invalidated_at = datetime.fromisoformat(invalidated_at_str)
                is_invalidated = token_issued_at < invalidated_at
                
                if is_invalidated:
                    logger.debug(f"🔍 Token de usuario {user_id} invalidado globalmente")
                
                return is_invalidated
                
            return False
            
        except Exception as e:
            logger.error(f"Error al verificar invalidación de usuario {user_id}: {e}")
            return True  # En caso de error, denegar acceso
    
    def _extract_jti(self, token: str) -> Optional[str]:
        """
        Extrae el JTI (JWT ID) del token, manejando tokens JWE encriptados
        """
        try:
            parts = token.split('.')

            if len(parts) == 5:
                # Token JWE encriptado
                try:
                    from app.config.security import SecureTokenManager
                    
                    if SecureTokenManager._is_encrypted_token(token):
                        logger.debug("🔧 Token JWE detectado, desencriptando para extraer JTI")
                        
                        import hashlib
                        from jose import jwe
                        from app.config.settings import SECRET_KEY
                        
                        encryption_key = hashlib.sha256(SECRET_KEY.encode()).digest()
                        decrypted_bytes = jwe.decrypt(token.encode(), encryption_key)
                        jwt_token = decrypted_bytes.decode()
                        
                        # Extraer JTI del JWT desencriptado
                        unverified_payload = jwt.get_unverified_claims(jwt_token)
                        jti = unverified_payload.get("jti")
                        
                        logger.debug(f"🔧 JTI extraído de token JWE: {jti}")
                        return jti
                        
                except Exception as jwe_error:
                    logger.error(f"Error al desencriptar JWE para extraer JTI: {jwe_error}")
                    return None
            
            # Token JWT normal (3 partes)
            elif len(parts) == 3:
                logger.debug("🔧 Token JWT normal detectado")
                unverified_payload = jwt.get_unverified_claims(token)
                jti = unverified_payload.get("jti")
                logger.debug(f"🔧 JTI extraído de token JWT: {jti}")
                return jti
            
            else:
                logger.warning(f"Token con formato inesperado ({len(parts)} partes)")
                return None
                
        except Exception as e:
            logger.error(f"Error general al extraer JTI: {e}")
            return None
    
    # ===== GESTIÓN DE INTENTOS FALLIDOS =====
    
    def record_failed_attempt(self, identifier: str, attempt_type: str = "login") -> int:
        """
        Registra un intento fallido (login, reset, verification)
        Retorna el número total de intentos en la ventana actual
        """
        if not self.redis.is_available():
            return 0
            
        try:
            prefix = self.FAILED_ATTEMPTS_PREFIX if attempt_type == "login" else f"{attempt_type}_attempts:"
            redis_key = f"{prefix}{identifier}"
            
            # Incrementar contador con TTL de 15 minutos
            current_attempts = self.redis.incr(redis_key)
            
            # Establecer TTL solo en el primer intento
            if current_attempts == 1:
                self.redis.expire(redis_key, 15 * 60)  # 15 minutos
            
            logger.warning(f"Intento fallido #{current_attempts} para {identifier} ({attempt_type})")
            return current_attempts
            
        except Exception as e:
            logger.error(f"Error registrando intento fallido: {e}")
            return 0
    
    def get_failed_attempts(self, identifier: str, attempt_type: str = "login") -> int:
        """
        Obtiene el número de intentos fallidos para un identificador
        """
        if not self.redis.is_available():
            return 0
            
        try:
            prefix = self.FAILED_ATTEMPTS_PREFIX if attempt_type == "login" else f"{attempt_type}_attempts:"
            redis_key = f"{prefix}{identifier}"
            
            attempts = self.redis.get(redis_key)
            return int(attempts) if attempts else 0
            
        except Exception as e:
            logger.error(f"Error obteniendo intentos fallidos: {e}")
            return 0
    
    def clear_failed_attempts(self, identifier: str, attempt_type: str = "login") -> bool:
        """
        Limpia los intentos fallidos para un identificador
        """
        if not self.redis.is_available():
            return False
            
        try:
            prefix = self.FAILED_ATTEMPTS_PREFIX if attempt_type == "login" else f"{attempt_type}_attempts:"
            redis_key = f"{prefix}{identifier}"
            
            success = self.redis.delete(redis_key)
            if success:
                logger.info(f"✅ Intentos fallidos limpiados para {identifier} ({attempt_type})")
            
            return success
            
        except Exception as e:
            logger.error(f"Error limpiando intentos fallidos: {e}")
            return False
    
    def is_locked_out(self, identifier: str, attempt_type: str = "login", max_attempts: int = 5) -> bool:
        """
        Verifica si un identificador está bloqueado por intentos fallidos
        """
        attempts = self.get_failed_attempts(identifier, attempt_type)
        is_locked = attempts >= max_attempts
        
        if is_locked:
            ttl = self.redis.ttl(f"{attempt_type}_attempts:{identifier}")
            logger.warning(f"🔒 {identifier} bloqueado por {attempts} intentos fallidos. TTL: {ttl}s")
        
        return is_locked
    
    # ===== ESTADÍSTICAS Y GESTIÓN =====
    
    def cleanup_expired_tokens(self) -> int:
        """
        En Redis, los tokens expirados se eliminan automáticamente por TTL
        Este método retorna información sobre la limpieza automática
        """
        if not self.redis.is_available():
            return 0
            
        try:
            # Contar tokens activos en blacklist
            active_tokens = len(self.redis.keys(f"{self.TOKEN_PREFIX}*"))
            active_users = len(self.redis.keys(f"{self.USER_INVALIDATION_PREFIX}*"))
            
            logger.info(f"📊 Blacklist Redis: {active_tokens} tokens, {active_users} usuarios invalidados")
            return 0  # Redis limpia automáticamente
            
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas de blacklist: {e}")
            return 0
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Obtiene estadísticas de la blacklist Redis
        """
        if not self.enabled:
            return {"enabled": False}
            
        if not self.redis.is_available():
            return {"enabled": True, "redis_available": False}
            
        try:
            # Contar diferentes tipos de datos
            blacklisted_tokens = len(self.redis.keys(f"{self.TOKEN_PREFIX}*"))
            invalidated_users = len(self.redis.keys(f"{self.USER_INVALIDATION_PREFIX}*"))
            failed_login_attempts = len(self.redis.keys(f"{self.FAILED_ATTEMPTS_PREFIX}*"))
            
            # Información de Redis
            redis_info = self.redis.info()
            memory_usage = redis_info.get('used_memory_human', 'N/A')
            total_keys = self.redis.dbsize()
            
            return {
                "enabled": True,
                "redis_available": True,
                "storage": "redis",
                "blacklisted_tokens": blacklisted_tokens,
                "invalidated_users": invalidated_users,
                "failed_login_attempts": failed_login_attempts,
                "total_redis_keys": total_keys,
                "redis_memory_usage": memory_usage,
                "auto_cleanup": True  # Redis limpia automáticamente con TTL
            }
                
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas de blacklist Redis: {e}")
            return {"enabled": True, "redis_available": True, "error": str(e)}
    
    def flush_all_blacklist_data(self) -> bool:
        """
        Limpia todos los datos de blacklist (USAR CON CUIDADO)
        Solo disponible en desarrollo
        """
        if not self.redis.is_available():
            return False
            
        try:
            from app.config.settings import ENVIRONMENT
            
            if ENVIRONMENT != "production":
                # Eliminar solo claves relacionadas con blacklist
                patterns = [
                    f"{self.TOKEN_PREFIX}*",
                    f"{self.USER_INVALIDATION_PREFIX}*",
                    f"{self.FAILED_ATTEMPTS_PREFIX}*",
                    f"{self.RESET_ATTEMPTS_PREFIX}*"
                ]
                
                deleted_count = 0
                for pattern in patterns:
                    keys = self.redis.keys(pattern)
                    for key in keys:
                        if self.redis.delete(key):
                            deleted_count += 1
                
                logger.warning(f"🧹 Datos de blacklist limpiados: {deleted_count} claves eliminadas")
                return True
            else:
                logger.error("No se puede limpiar blacklist en producción")
                return False
                
        except Exception as e:
            logger.error(f"Error limpiando datos de blacklist: {e}")
            return False

# Instancia global del sistema de blacklist Redis
redis_token_blacklist = RedisTokenBlacklist()