# backend/app/utils/token_blacklist.py
"""
Sistema de blacklist de tokens actualizado para manejar tanto JWT como JWE
con manejo robusto de errores
"""

import json
from datetime import datetime, timedelta
from typing import Optional, Set, Dict, Any
from jose import jwt, JWTError, jwe
import logging
from sqlalchemy.orm import Session
from sqlalchemy import text, create_engine
from sqlalchemy.exc import SQLAlchemyError
import hashlib
import base64

from app.config.settings import (
    SECRET_KEY, ALGORITHM, TOKEN_BLACKLIST_ENABLED, 
    DATABASE_URL, REDIS_ENABLED
)
from app.database import get_db

# NUEVO: Importar Redis blacklist como principal
from app.utils.redis_token_blacklist import redis_token_blacklist

# Importar modelo MySQL como fallback
from app.models.security.token_blacklist import TokenBlacklist

logger = logging.getLogger(__name__)

class HybridTokenBlacklist:
    """
    Sistema híbrido de blacklist de tokens:
    - Redis como almacén principal (rápido, temporal)
    - MySQL como fallback y persistencia a largo plazo
    - Manejo robusto de JWT y JWE
    """
    
    def __init__(self):
        self.enabled = TOKEN_BLACKLIST_ENABLED
        self.redis_enabled = REDIS_ENABLED
        self.redis_blacklist = redis_token_blacklist
        
        logger.info(
            f"🔧 Sistema híbrido de blacklist inicializado - "
            f"Redis: {'✅' if self.redis_enabled else '❌'}, "
            f"MySQL: ✅, "
            f"Enabled: {'✅' if self.enabled else '❌'}"
        )
    
    def _safe_extract_jti(self, token: str) -> Optional[str]:
        """
        Extrae JTI de manera segura, manejando tanto JWT como JWE
        """
        if not token or not isinstance(token, str):
            logger.warning("Token inválido o vacío")
            return None
            
        try:
            # Limpiar token de espacios y caracteres raros
            token = token.strip()
            
            # Verificar formato básico
            if not token or token.count('.') < 2:
                logger.warning(f"Token con formato inválido: {len(token)} caracteres, {token.count('.')} puntos")
                return None
            
            parts = token.split('.')
            
            # Token JWE (5 partes)
            if len(parts) == 5:
                try:
                    logger.debug("🔧 Detectado token JWE, intentando desencriptar...")
                    
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
                    # Si falla la desencriptación, intentar como JWT normal
                    return None
            
            # Token JWT normal (3 partes)
            elif len(parts) == 3:
                try:
                    logger.debug("🔧 Detectado token JWT normal")
                    
                    # Intentar decodificar sin verificación
                    payload = jwt.get_unverified_claims(token)
                    jti = payload.get("jti")
                    
                    logger.debug(f"✅ JTI extraído de token JWT: {jti}")
                    return jti
                    
                except Exception as jwt_error:
                    logger.error(f"❌ Error al extraer JTI de JWT: {jwt_error}")
                    
                    # Fallback: intentar decodificar header y payload manualmente
                    try:
                        # Decodificar payload (segunda parte)
                        payload_part = parts[1]
                        # Agregar padding si es necesario
                        missing_padding = len(payload_part) % 4
                        if missing_padding:
                            payload_part += '=' * (4 - missing_padding)
                        
                        payload_bytes = base64.urlsafe_b64decode(payload_part)
                        payload_json = json.loads(payload_bytes.decode('utf-8'))
                        
                        jti = payload_json.get("jti")
                        logger.debug(f"✅ JTI extraído manualmente: {jti}")
                        return jti
                        
                    except Exception as manual_error:
                        logger.error(f"❌ Error en extracción manual: {manual_error}")
                        return None
            
            else:
                logger.warning(f"Token con número de partes inesperado: {len(parts)}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error general al extraer JTI: {e}")
            return None
    
    def _safe_decode_token_info(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Decodifica información básica del token de manera segura
        """
        try:
            jti = self._safe_extract_jti(token)
            if not jti:
                return None
            
            # Intentar obtener información de expiración
            try:
                # Para tokens JWE, necesitamos desencriptar primero
                parts = token.split('.')
                if len(parts) == 5:  # JWE
                    encryption_key = hashlib.sha256(SECRET_KEY.encode()).digest()
                    decrypted_bytes = jwe.decrypt(token.encode(), encryption_key)
                    jwt_token = decrypted_bytes.decode()
                    payload = jwt.get_unverified_claims(jwt_token)
                else:  # JWT normal
                    payload = jwt.get_unverified_claims(token)
                
                return {
                    'jti': jti,
                    'exp': payload.get('exp'),
                    'type': payload.get('type', 'access'),
                    'sub': payload.get('sub')
                }
                
            except Exception as decode_error:
                logger.warning(f"No se pudo decodificar payload completo: {decode_error}")
                # Retornar información mínima
                return {
                    'jti': jti,
                    'exp': None,
                    'type': 'unknown',
                    'sub': None
                }
                
        except Exception as e:
            logger.error(f"Error al decodificar información del token: {e}")
            return None
    
    def add_token(self, token: str, user_id: int = None) -> bool:
        """
        Añade un token a la blacklist usando Redis como principal y MySQL como backup
        """
        if not self.enabled:
            return False
        
        if not token or not isinstance(token, str):
            logger.warning("Token inválido proporcionado para blacklist")
            return False
        
        try:
            # Extraer información del token de manera segura
            token_info = self._safe_decode_token_info(token)
            if not token_info:
                logger.warning("No se pudo extraer información del token, añadiendo con datos mínimos")
                # Crear un hash del token como fallback
                import hashlib
                token_hash = hashlib.sha256(token.encode()).hexdigest()[:16]
                token_info = {
                    'jti': f"fallback_{token_hash}",
                    'exp': None,
                    'type': 'unknown',
                    'sub': user_id
                }
            
            success_redis = False
            success_mysql = False
            
            # 1. Intentar añadir a Redis (principal)
            if self.redis_enabled and self.redis_blacklist.redis.is_available():
                try:
                    # Usar método específico para tokens problemáticos
                    success_redis = self._add_token_to_redis_safe(token_info, user_id)
                    if success_redis:
                        logger.debug(f"✅ Token añadido a Redis blacklist")
                    else:
                        logger.warning(f"⚠️ No se pudo añadir token a Redis blacklist")
                except Exception as redis_error:
                    logger.error(f"Error añadiendo a Redis: {redis_error}")
                    success_redis = False
            
            # 2. Añadir a MySQL como backup/persistencia
            try:
                success_mysql = self._add_token_to_mysql_safe(token_info, user_id)
                if success_mysql:
                    logger.debug(f"✅ Token añadido a MySQL blacklist")
                else:
                    logger.warning(f"⚠️ No se pudo añadir token a MySQL blacklist")
            except Exception as mysql_error:
                logger.error(f"Error añadiendo token a MySQL: {mysql_error}")
                success_mysql = False
            
            # Consideramos éxito si al menos uno funciona
            overall_success = success_redis or success_mysql
            
            if overall_success:
                storage_info = []
                if success_redis: storage_info.append("Redis")
                if success_mysql: storage_info.append("MySQL")
                logger.info(f"✅ Token añadido a blacklist ({', '.join(storage_info)})")
            else:
                logger.error(f"❌ Error añadiendo token a blacklist (Redis y MySQL fallaron)")
            
            return overall_success
            
        except Exception as e:
            logger.error(f"Error general añadiendo token a blacklist: {e}")
            return False
    
    def _add_token_to_redis_safe(self, token_info: Dict[str, Any], user_id: int = None) -> bool:
        """
        Añade token a Redis de manera segura
        """
        try:
            jti = token_info['jti']
            exp_timestamp = token_info.get('exp')
            token_type = token_info.get('type', 'unknown')
            
            # Calcular TTL
            if exp_timestamp:
                exp_datetime = datetime.fromtimestamp(exp_timestamp)
                if exp_datetime <= datetime.utcnow():
                    logger.debug("Token ya expirado, considerando como éxito")
                    return True
                ttl_seconds = int((exp_datetime - datetime.utcnow()).total_seconds())
            else:
                # Si no hay expiración, usar TTL por defecto
                ttl_seconds = 24 * 60 * 60  # 24 horas
            
            # Crear clave Redis
            redis_key = f"{self.redis_blacklist.TOKEN_PREFIX}{jti}"
            
            # Datos para Redis
            token_data = {
                "user_id": user_id,
                "token_type": token_type,
                "blacklisted_at": datetime.utcnow().isoformat(),
                "expires_at": (datetime.utcnow() + timedelta(seconds=ttl_seconds)).isoformat(),
                "reason": "logout"
            }
            
            return self.redis_blacklist.redis.set(redis_key, token_data, expire=ttl_seconds)
            
        except Exception as e:
            logger.error(f"Error en _add_token_to_redis_safe: {e}")
            return False
    
    def _add_token_to_mysql_safe(self, token_info: Dict[str, Any], user_id: int = None) -> bool:
        """
        Añade token a MySQL de manera segura
        """
        try:
            jti = token_info['jti']
            exp_timestamp = token_info.get('exp')
            token_type = token_info.get('type', 'unknown')
            
            # Calcular fecha de expiración
            if exp_timestamp:
                exp_datetime = datetime.fromtimestamp(exp_timestamp)
                if exp_datetime <= datetime.utcnow():
                    logger.debug("Token ya expirado para MySQL")
                    return True
            else:
                # Si no hay expiración, usar fecha por defecto
                exp_datetime = datetime.utcnow() + timedelta(days=1)
            
            db = next(get_db())
            
            success = TokenBlacklist.add_token_to_blacklist(
                db_session=db,
                token_id=jti,
                user_id=user_id,
                token_type=token_type,
                expires_at=exp_datetime,
                reason='logout'
            )
            
            db.close()
            return success
            
        except Exception as e:
            logger.error(f"Error en _add_token_to_mysql_safe: {e}")
            return False
    
    def is_blacklisted(self, token: str) -> bool:
        """
        Verifica si un token está en blacklist, usando Redis como principal
        """
        if not self.enabled:
            return False
        
        if not token or not isinstance(token, str):
            logger.warning("Token inválido para verificación")
            return True  # Por seguridad, considerar inválido
        
        try:
            # Extraer JTI de manera segura
            jti = self._safe_extract_jti(token)
            if not jti:
                logger.warning("No se pudo extraer JTI, considerando token inválido")
                return True  # Por seguridad
            
            # 1. Verificar en Redis primero (más rápido)
            if self.redis_enabled and self.redis_blacklist.redis.is_available():
                try:
                    redis_key = f"{self.redis_blacklist.TOKEN_PREFIX}{jti}"
                    token_data = self.redis_blacklist.redis.get(redis_key, as_json=True)
                    
                    if token_data:
                        logger.debug(f"🔍 Token encontrado en Redis blacklist")
                        return True
                except Exception as redis_error:
                    logger.error(f"Error verificando en Redis: {redis_error}")
            
            # 2. Si no está en Redis, verificar en MySQL
            try:
                db = next(get_db())
                is_blacklisted_mysql = TokenBlacklist.is_token_blacklisted(db, jti)
                db.close()
                
                if is_blacklisted_mysql:
                    logger.debug(f"🔍 Token encontrado en MySQL blacklist")
                    
                    # Si está en MySQL pero no en Redis, añadirlo a Redis para cache
                    if self.redis_enabled and self.redis_blacklist.redis.is_available():
                        try:
                            redis_key = f"{self.redis_blacklist.TOKEN_PREFIX}{jti}"
                            token_data = {
                                "user_id": None,
                                "token_type": "unknown",
                                "blacklisted_at": datetime.utcnow().isoformat(),
                                "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat(),
                                "reason": "sync_from_mysql"
                            }
                            self.redis_blacklist.redis.set(redis_key, token_data, expire=24*60*60)
                            logger.debug(f"🔄 Token sincronizado de MySQL a Redis")
                        except Exception as sync_error:
                            logger.warning(f"No se pudo sincronizar token a Redis: {sync_error}")
                    
                    return True
                    
            except Exception as mysql_error:
                logger.error(f"Error verificando token en MySQL: {mysql_error}")
                # En caso de error de MySQL, confiar solo en Redis
                pass
            
            return False
            
        except Exception as e:
            logger.error(f"Error verificando token en blacklist: {e}")
            # En caso de error, denegar acceso por seguridad
            return True
    
    def remove_token(self, token: str) -> bool:
        """
        Remueve un token de ambos almacenes
        """
        if not self.enabled:
            return False
        
        try:
            jti = self._safe_extract_jti(token)
            if not jti:
                return False
            
            success_redis = False
            success_mysql = False
            
            # Remover de Redis
            if self.redis_enabled and self.redis_blacklist.redis.is_available():
                try:
                    redis_key = f"{self.redis_blacklist.TOKEN_PREFIX}{jti}"
                    success_redis = self.redis_blacklist.redis.delete(redis_key)
                except Exception as redis_error:
                    logger.error(f"Error removiendo de Redis: {redis_error}")
            
            # Remover de MySQL
            try:
                db = next(get_db())
                
                token_entry = db.query(TokenBlacklist).filter(
                    TokenBlacklist.token_id == jti
                ).first()
                
                if token_entry:
                    db.delete(token_entry)
                    db.commit()
                    success_mysql = True
                
                db.close()
                
            except Exception as mysql_error:
                logger.error(f"Error removiendo token de MySQL: {mysql_error}")
            
            overall_success = success_redis or success_mysql
            
            if overall_success:
                logger.info(f"✅ Token removido de blacklist")
            
            return overall_success
            
        except Exception as e:
            logger.error(f"Error removiendo token de blacklist: {e}")
            return False
    
    def blacklist_all_user_tokens(self, user_id: int) -> bool:
        """
        Invalida todos los tokens de un usuario en ambos almacenes
        """
        if not self.enabled:
            return False
        
        try:
            success_redis = False
            success_mysql = False
            
            # Invalidar en Redis
            if self.redis_enabled and self.redis_blacklist.redis.is_available():
                try:
                    success_redis = self.redis_blacklist.blacklist_all_user_tokens(user_id)
                except Exception as redis_error:
                    logger.error(f"Error invalidando tokens de usuario en Redis: {redis_error}")
            
            # Invalidar en MySQL
            try:
                db = next(get_db())
                
                special_token_id = f"user_invalidation_{user_id}"
                expires_at = datetime.utcnow() + timedelta(days=1)
                
                existing = db.query(TokenBlacklist).filter(
                    TokenBlacklist.token_id == special_token_id
                ).first()
                
                if existing:
                    existing.expires_at = expires_at
                    existing.blacklisted_at = datetime.utcnow()
                else:
                    success_mysql = TokenBlacklist.add_token_to_blacklist(
                        db_session=db,
                        token_id=special_token_id,
                        user_id=user_id,
                        token_type='user_invalidation',
                        expires_at=expires_at,
                        reason='global_logout'
                    )
                
                if success_mysql or existing:
                    db.commit()
                    success_mysql = True
                
                db.close()
                
            except Exception as mysql_error:
                logger.error(f"Error invalidando tokens de usuario en MySQL: {mysql_error}")
            
            overall_success = success_redis or success_mysql
            
            if overall_success:
                logger.info(f"✅ Todos los tokens del usuario {user_id} invalidados")
            
            return overall_success
            
        except Exception as e:
            logger.error(f"Error invalidando tokens del usuario {user_id}: {e}")
            return False
    
    def is_user_invalidated(self, user_id: int, token_issued_at: datetime) -> bool:
        """
        Verifica si un usuario ha sido invalidado globalmente
        """
        if not self.enabled:
            return False
        
        try:
            # Verificar en Redis primero
            if self.redis_enabled and self.redis_blacklist.redis.is_available():
                try:
                    is_invalidated_redis = self.redis_blacklist.is_user_invalidated(user_id, token_issued_at)
                    if is_invalidated_redis:
                        return True
                except Exception as redis_error:
                    logger.error(f"Error verificando invalidación en Redis: {redis_error}")
            
            # Verificar en MySQL como fallback
            try:
                db = next(get_db())
                
                special_token_id = f"user_invalidation_{user_id}"
                invalidation = db.query(TokenBlacklist).filter(
                    TokenBlacklist.token_id == special_token_id,
                    TokenBlacklist.token_type == 'user_invalidation',
                    TokenBlacklist.expires_at > datetime.utcnow()
                ).first()
                
                db.close()
                
                if invalidation:
                    return token_issued_at < invalidation.blacklisted_at
                    
                return False
                
            except Exception as mysql_error:
                logger.error(f"Error verificando invalidación de usuario en MySQL: {mysql_error}")
                return True
                
        except Exception as e:
            logger.error(f"Error verificando invalidación de usuario {user_id}: {e}")
            return True  # En caso de error, denegar acceso
    
    # ===== MÉTODOS PARA GESTIÓN DE INTENTOS FALLIDOS =====
    
    def record_failed_attempt(self, identifier: str, attempt_type: str = "login") -> int:
        """
        Registra un intento fallido usando Redis como principal
        """
        if self.redis_enabled and self.redis_blacklist.redis.is_available():
            return self.redis_blacklist.record_failed_attempt(identifier, attempt_type)
        else:
            # Fallback a sistema en memoria simple
            logger.warning(f"Redis no disponible, registrando intento fallido en memoria")
            return 1
    
    def get_failed_attempts(self, identifier: str, attempt_type: str = "login") -> int:
        """
        Obtiene el número de intentos fallidos
        """
        if self.redis_enabled and self.redis_blacklist.redis.is_available():
            return self.redis_blacklist.get_failed_attempts(identifier, attempt_type)
        else:
            return 0
    
    def clear_failed_attempts(self, identifier: str, attempt_type: str = "login") -> bool:
        """
        Limpia los intentos fallidos
        """
        if self.redis_enabled and self.redis_blacklist.redis.is_available():
            return self.redis_blacklist.clear_failed_attempts(identifier, attempt_type)
        else:
            return True
    
    def is_locked_out(self, identifier: str, attempt_type: str = "login", max_attempts: int = 5) -> bool:
        """
        Verifica si un identificador está bloqueado
        """
        if self.redis_enabled and self.redis_blacklist.redis.is_available():
            return self.redis_blacklist.is_locked_out(identifier, attempt_type, max_attempts)
        else:
            return False
    
    # ===== MÉTODOS DE ESTADÍSTICAS Y GESTIÓN =====
    
    def cleanup_expired_tokens(self) -> int:
        """
        Limpia tokens expirados de MySQL (Redis se limpia automáticamente)
        """
        try:
            db = next(get_db())
            deleted_count = TokenBlacklist.cleanup_expired_tokens(db)
            db.close()
            
            if deleted_count > 0:
                logger.info(f"🧹 Limpiados {deleted_count} tokens expirados de MySQL")
            
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error limpiando tokens expirados de MySQL: {e}")
            return 0
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Obtiene estadísticas completas del sistema híbrido
        """
        try:
            stats = {
                "enabled": self.enabled,
                "storage": "hybrid_redis_mysql",
                "redis_available": self.redis_enabled and self.redis_blacklist.redis.is_available()
            }
            
            # Estadísticas de Redis
            if stats["redis_available"]:
                try:
                    redis_stats = self.redis_blacklist.get_stats()
                    stats["redis"] = redis_stats
                except Exception as redis_error:
                    stats["redis"] = {"available": False, "error": str(redis_error)}
            else:
                stats["redis"] = {"available": False}
            
            # Estadísticas de MySQL
            try:
                db = next(get_db())
                
                total_mysql_tokens = db.query(TokenBlacklist).count()
                active_mysql_tokens = db.query(TokenBlacklist).filter(
                    TokenBlacklist.expires_at > datetime.utcnow()
                ).count()
                
                stats["mysql"] = {
                    "total_tokens": total_mysql_tokens,
                    "active_tokens": active_mysql_tokens,
                    "available": True
                }
                
                db.close()
                
            except Exception as mysql_error:
                stats["mysql"] = {
                    "available": False,
                    "error": str(mysql_error)
                }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas híbridas: {e}")
            return {"enabled": self.enabled, "error": str(e)}

# Instancia global del sistema híbrido de blacklist
token_blacklist = HybridTokenBlacklist()

# Alias para compatibilidad con código existente
redis_token_blacklist_instance = token_blacklist