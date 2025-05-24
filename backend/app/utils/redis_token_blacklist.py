# backend/app/utils/redis_token_blacklist.py
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import jwt, JWTError, jwe
import logging
import hashlib
import base64

from app.config.settings import SECRET_KEY, ALGORITHM, TOKEN_BLACKLIST_ENABLED
from app.config.redis_config import redis_manager

logger = logging.getLogger(__name__)

class RedisTokenBlacklist:
    """
    Sistema de blacklist para tokens JWT utilizando Redis
    Mejorado para manejar tanto JWT como JWE de manera robusta
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
    
    def _safe_extract_jti(self, token: str) -> Optional[str]:
        """
        Extrae JTI de manera segura, manejando tanto JWT como JWE con mejor manejo de errores
        """
        if not token or not isinstance(token, str):
            logger.warning("Token inválido o vacío")
            return None
            
        try:
            # Limpiar token de espacios y caracteres extraños
            token = token.strip()
            
            # Verificar formato básico del token
            if not token or token.count('.') < 2:
                logger.warning(f"Token con formato inválido: {len(token)} caracteres, {token.count('.')} puntos")
                return None
            
            parts = token.split('.')
            
            # Token JWE (5 partes: header.encrypted_key.iv.ciphertext.tag)
            if len(parts) == 5:
                try:
                    logger.debug("🔧 Detectado token JWE, intentando desencriptar...")
                    
                    # Verificar que es realmente un JWE examinando el header
                    try:
                        header_part = parts[0]
                        # Agregar padding si es necesario
                        missing_padding = len(header_part) % 4
                        if missing_padding:
                            header_part += '=' * (4 - missing_padding)
                        
                        header_bytes = base64.urlsafe_b64decode(header_part)
                        header_json = json.loads(header_bytes.decode('utf-8'))
                        
                        # Verificar que tiene campo "enc" (indicativo de JWE)
                        if "enc" not in header_json:
                            logger.warning("Token de 5 partes pero sin campo 'enc', no es JWE válido")
                            return None
                            
                    except Exception as header_error:
                        logger.warning(f"No se pudo verificar header JWE: {header_error}")
                        return None
                    
                    # Preparar clave de desencriptación
                    encryption_key = hashlib.sha256(SECRET_KEY.encode()).digest()
                    
                    # Desencriptar JWE
                    decrypted_bytes = jwe.decrypt(token.encode(), encryption_key)
                    jwt_token = decrypted_bytes.decode()
                    
                    # Extraer JTI del JWT desencriptado
                    payload = jwt.get_unverified_claims(jwt_token)
                    jti = payload.get("jti")
                    
                    logger.debug(f"✅ JTI extraído de token JWE: {jti}")
                    return jti
                    
                except Exception as jwe_error:
                    logger.error(f"❌ Error al desencriptar JWE: {jwe_error}")
                    # Si falla la desencriptación, generar un identificador único basado en el token
                    token_hash = hashlib.sha256(token.encode()).hexdigest()[:16]
                    fallback_jti = f"jwe_fallback_{token_hash}"
                    logger.debug(f"🔄 Usando JTI fallback para JWE: {fallback_jti}")
                    return fallback_jti
            
            # Token JWT normal (3 partes: header.payload.signature)
            elif len(parts) == 3:
                try:
                    logger.debug("🔧 Detectado token JWT normal")
                    
                    # Intentar decodificar sin verificación para extraer JTI
                    payload = jwt.get_unverified_claims(token)
                    jti = payload.get("jti")
                    
                    if jti:
                        logger.debug(f"✅ JTI extraído de token JWT: {jti}")
                        return jti
                    else:
                        logger.warning("Token JWT sin JTI, generando identificador fallback")
                        # Generar un identificador único basado en el token
                        token_hash = hashlib.sha256(token.encode()).hexdigest()[:16]
                        fallback_jti = f"jwt_fallback_{token_hash}"
                        logger.debug(f"🔄 Usando JTI fallback: {fallback_jti}")
                        return fallback_jti
                    
                except Exception as jwt_error:
                    logger.error(f"❌ Error al extraer JTI de JWT: {jwt_error}")
                    
                    # Fallback: intentar decodificar payload manualmente
                    try:
                        logger.debug("🔧 Intentando extracción manual del payload...")
                        
                        # Decodificar payload (segunda parte)
                        payload_part = parts[1]
                        
                        # Agregar padding si es necesario
                        missing_padding = len(payload_part) % 4
                        if missing_padding:
                            payload_part += '=' * (4 - missing_padding)
                        
                        payload_bytes = base64.urlsafe_b64decode(payload_part)
                        payload_json = json.loads(payload_bytes.decode('utf-8'))
                        
                        jti = payload_json.get("jti")
                        if jti:
                            logger.debug(f"✅ JTI extraído manualmente: {jti}")
                            return jti
                        else:
                            # Usar sub + timestamp como fallback
                            sub = payload_json.get("sub")
                            iat = payload_json.get("iat")
                            if sub and iat:
                                fallback_jti = f"manual_{sub}_{iat}"
                                logger.debug(f"🔄 JTI generado desde sub+iat: {fallback_jti}")
                                return fallback_jti
                            else:
                                # Último recurso: hash del token
                                token_hash = hashlib.sha256(token.encode()).hexdigest()[:16]
                                fallback_jti = f"hash_{token_hash}"
                                logger.debug(f"🔄 JTI generado desde hash: {fallback_jti}")
                                return fallback_jti
                        
                    except Exception as manual_error:
                        logger.error(f"❌ Error en extracción manual: {manual_error}")
                        # Último recurso: generar un hash del token completo
                        token_hash = hashlib.sha256(token.encode()).hexdigest()[:16]
                        fallback_jti = f"error_fallback_{token_hash}"
                        logger.debug(f"🔄 JTI de último recurso: {fallback_jti}")
                        return fallback_jti
            
            else:
                logger.warning(f"Token con número de partes inesperado: {len(parts)}")
                # Para tokens con formato inesperado, usar hash
                token_hash = hashlib.sha256(token.encode()).hexdigest()[:16]
                fallback_jti = f"unknown_format_{token_hash}"
                logger.debug(f"🔄 JTI para formato desconocido: {fallback_jti}")
                return fallback_jti
                
        except Exception as e:
            logger.error(f"❌ Error general al extraer JTI: {e}")
            # En cualquier error, generar un identificador único
            try:
                token_hash = hashlib.sha256(token.encode()).hexdigest()[:16]
                emergency_jti = f"emergency_{token_hash}"
                logger.debug(f"🆘 JTI de emergencia: {emergency_jti}")
                return emergency_jti
            except:
                logger.error("❌ No se pudo generar ni siquiera un JTI de emergencia")
                return None
    
    def add_token(self, token: str, user_id: int = None) -> bool:
        """
        Añade un token a la blacklist usando Redis con manejo robusto de errores
        """
        if not self.enabled or not self.redis.is_available():
            return False
            
        if not token or not isinstance(token, str):
            logger.warning("Token inválido proporcionado para blacklist")
            return False
            
        try:
            # Extraer JTI de manera segura
            jti = self._safe_extract_jti(token)
            if not jti:
                logger.error("No se pudo extraer JTI del token")
                return False
            
            # Intentar obtener información del token para TTL
            try:
                exp_timestamp = None
                token_type = "unknown"
                
                # Intentar decodificar para obtener información adicional
                parts = token.split('.')
                if len(parts) == 5:  # JWE
                    try:
                        encryption_key = hashlib.sha256(SECRET_KEY.encode()).digest()
                        decrypted_bytes = jwe.decrypt(token.encode(), encryption_key)
                        jwt_token = decrypted_bytes.decode()
                        payload = jwt.get_unverified_claims(jwt_token)
                        exp_timestamp = payload.get('exp')
                        token_type = payload.get('type', 'access')
                    except:
                        # Si falla, usar valores por defecto
                        pass
                elif len(parts) == 3:  # JWT
                    try:
                        payload = jwt.get_unverified_claims(token)
                        exp_timestamp = payload.get('exp')
                        token_type = payload.get('type', 'access')
                    except:
                        # Si falla, usar valores por defecto
                        pass
                
            except Exception as decode_error:
                logger.warning(f"No se pudo decodificar información del token: {decode_error}")
                exp_timestamp = None
                token_type = "unknown"
            
            # Calcular TTL para Redis
            if exp_timestamp:
                try:
                    exp_datetime = datetime.fromtimestamp(exp_timestamp)
                    if exp_datetime <= datetime.utcnow():
                        # Token ya expirado, no necesita blacklist
                        logger.debug("Token ya expirado, no necesita blacklist")
                        return True
                    
                    ttl_seconds = int((exp_datetime - datetime.utcnow()).total_seconds())
                    # Asegurar TTL mínimo de 60 segundos y máximo de 30 días
                    ttl_seconds = max(60, min(ttl_seconds, 30 * 24 * 60 * 60))
                except Exception as ttl_error:
                    logger.warning(f"Error calculando TTL: {ttl_error}")
                    # TTL por defecto: 24 horas
                    ttl_seconds = 24 * 60 * 60
            else:
                # TTL por defecto si no hay expiración: 24 horas
                ttl_seconds = 24 * 60 * 60
            
            # Crear clave Redis para el token
            redis_key = f"{self.TOKEN_PREFIX}{jti}"
            
            # Guardar información del token en Redis con TTL automático
            token_data = {
                "user_id": user_id,
                "token_type": token_type,
                "blacklisted_at": datetime.utcnow().isoformat(),
                "expires_at": (datetime.utcnow() + timedelta(seconds=ttl_seconds)).isoformat(),
                "reason": "logout",
                "original_jti": jti
            }
            
            success = self.redis.set(redis_key, token_data, expire=ttl_seconds)
            
            if success:
                logger.info(f"✅ Token añadido a blacklist Redis: user={user_id}, type={token_type}, jti={jti}, ttl={ttl_seconds}s")
            else:
                logger.error(f"❌ Error añadiendo token a blacklist Redis")
            
            return success
            
        except Exception as e:
            logger.error(f"Error al añadir token a blacklist Redis: {e}")
            return False
    
    def is_blacklisted(self, token: str) -> bool:
        """
        Verifica si un token está en la blacklist usando Redis con manejo robusto
        """
        if not self.enabled or not self.redis.is_available():
            return False
            
        if not token or not isinstance(token, str):
            logger.warning("Token inválido para verificación")
            return True  # Por seguridad, considerar inválido
            
        try:
            # Extraer JTI del token
            jti = self._safe_extract_jti(token)
            if not jti:
                logger.warning("Token sin JTI válido, considerado inválido")
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
            jti = self._safe_extract_jti(token)
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
            prefix = self.FAILED_ATTEMPTS_PREFIX if attempt_type == "login" else f"{attempt_type}_attempts:"
            redis_key = f"{prefix}{identifier}"
            ttl = self.redis.ttl(redis_key)
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
                "auto_cleanup": True,  # Redis limpia automáticamente con TTL
                "robust_jti_extraction": True  # Nueva característica
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