# backend/app/utils/token_blacklist.py
"""
Sistema de blacklist de tokens actualizado para usar Redis como almacén principal
y MySQL como fallback para persistencia a largo plazo
"""

import json
from datetime import datetime, timedelta
from typing import Optional, Set, Dict, Any
from jose import jwt, JWTError
import logging
from sqlalchemy.orm import Session
from sqlalchemy import text, create_engine
from sqlalchemy.exc import SQLAlchemyError

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
    
    def add_token(self, token: str, user_id: int = None) -> bool:
        """
        Añade un token a la blacklist usando Redis como principal y MySQL como backup
        """
        if not self.enabled:
            return False
        
        try:
            success_redis = False
            success_mysql = False
            
            # 1. Intentar añadir a Redis (principal)
            if self.redis_enabled and self.redis_blacklist.redis.is_available():
                success_redis = self.redis_blacklist.add_token(token, user_id)
                if success_redis:
                    logger.debug(f"✅ Token añadido a Redis blacklist")
                else:
                    logger.warning(f"⚠️ No se pudo añadir token a Redis blacklist")
            
            # 2. Añadir a MySQL como backup/persistencia
            try:
                success_mysql = self._add_token_to_mysql(token, user_id)
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
    
    def is_blacklisted(self, token: str) -> bool:
        """
        Verifica si un token está en blacklist, usando Redis como principal
        """
        if not self.enabled:
            return False
        
        try:
            # 1. Verificar en Redis primero (más rápido)
            if self.redis_enabled and self.redis_blacklist.redis.is_available():
                is_blacklisted_redis = self.redis_blacklist.is_blacklisted(token)
                if is_blacklisted_redis:
                    logger.debug(f"🔍 Token encontrado en Redis blacklist")
                    return True
            
            # 2. Si no está en Redis, verificar en MySQL
            try:
                is_blacklisted_mysql = self._is_blacklisted_in_mysql(token)
                if is_blacklisted_mysql:
                    logger.debug(f"🔍 Token encontrado en MySQL blacklist")
                    
                    # Si está en MySQL pero no en Redis, añadirlo a Redis para cache
                    if self.redis_enabled and self.redis_blacklist.redis.is_available():
                        try:
                            self.redis_blacklist.add_token(token)
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
            success_redis = False
            success_mysql = False
            
            # Remover de Redis
            if self.redis_enabled and self.redis_blacklist.redis.is_available():
                success_redis = self.redis_blacklist.remove_token(token)
            
            # Remover de MySQL
            try:
                success_mysql = self._remove_token_from_mysql(token)
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
                success_redis = self.redis_blacklist.blacklist_all_user_tokens(user_id)
            
            # Invalidar en MySQL
            try:
                success_mysql = self._blacklist_all_user_tokens_mysql(user_id)
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
                is_invalidated_redis = self.redis_blacklist.is_user_invalidated(user_id, token_issued_at)
                if is_invalidated_redis:
                    return True
            
            # Verificar en MySQL como fallback
            try:
                return self._is_user_invalidated_mysql(user_id, token_issued_at)
            except Exception as mysql_error:
                logger.error(f"Error verificando invalidación de usuario en MySQL: {mysql_error}")
                return False
                
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
    
    # ===== MÉTODOS PRIVADOS PARA MYSQL =====
    
    def _add_token_to_mysql(self, token: str, user_id: int = None) -> bool:
        """
        Añade un token a la blacklist MySQL
        """
        try:
            # Decodificar token para obtener información
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            exp_timestamp = payload.get('exp')
            jti = payload.get('jti')
            token_type = payload.get('type', 'access')
            
            if not exp_timestamp or not jti:
                return False
            
            exp_datetime = datetime.fromtimestamp(exp_timestamp)
            if exp_datetime <= datetime.utcnow():
                return True  # Token ya expirado
            
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
            logger.error(f"Error añadiendo token a MySQL: {e}")
            return False
    
    def _is_blacklisted_in_mysql(self, token: str) -> bool:
        """
        Verifica si un token está en blacklist MySQL
        """
        try:
            jti = self._extract_jti(token)
            if not jti:
                return True
            
            db = next(get_db())
            is_blacklisted = TokenBlacklist.is_token_blacklisted(db, jti)
            db.close()
            
            return is_blacklisted
            
        except Exception as e:
            logger.error(f"Error verificando token en MySQL: {e}")
            return True
    
    def _remove_token_from_mysql(self, token: str) -> bool:
        """
        Remueve un token de blacklist MySQL
        """
        try:
            jti = self._extract_jti(token)
            if not jti:
                return False
            
            db = next(get_db())
            
            token_entry = db.query(TokenBlacklist).filter(
                TokenBlacklist.token_id == jti
            ).first()
            
            if token_entry:
                db.delete(token_entry)
                db.commit()
                db.close()
                return True
            
            db.close()
            return False
            
        except Exception as e:
            logger.error(f"Error removiendo token de MySQL: {e}")
            return False
    
    def _blacklist_all_user_tokens_mysql(self, user_id: int) -> bool:
        """
        Invalida todos los tokens de un usuario en MySQL
        """
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
                success = TokenBlacklist.add_token_to_blacklist(
                    db_session=db,
                    token_id=special_token_id,
                    user_id=user_id,
                    token_type='user_invalidation',
                    expires_at=expires_at,
                    reason='global_logout'
                )
                
                if not success:
                    db.close()
                    return False
            
            db.commit()
            db.close()
            return True
            
        except Exception as e:
            logger.error(f"Error invalidando tokens de usuario en MySQL: {e}")
            return False
    
    def _is_user_invalidated_mysql(self, user_id: int, token_issued_at: datetime) -> bool:
        """
        Verifica invalidación global de usuario en MySQL
        """
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
            
        except Exception as e:
            logger.error(f"Error verificando invalidación de usuario en MySQL: {e}")
            return True
    
    def _extract_jti(self, token: str) -> Optional[str]:
        """
        Extrae el JTI del token (delegado al Redis blacklist)
        """
        return self.redis_blacklist._extract_jti(token)
    
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
                redis_stats = self.redis_blacklist.get_stats()
                stats["redis"] = redis_stats
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
    
    def sync_mysql_to_redis(self, hours_back: int = 24) -> Dict[str, int]:
        """
        Sincroniza tokens activos de MySQL a Redis (útil después de reinicio de Redis)
        """
        if not self.redis_enabled or not self.redis_blacklist.redis.is_available():
            return {"error": "Redis no disponible"}
        
        try:
            db = next(get_db())
            
            # Obtener tokens activos de las últimas X horas
            cutoff_time = datetime.utcnow() - timedelta(hours=hours_back)
            
            active_tokens = db.query(TokenBlacklist).filter(
                TokenBlacklist.expires_at > datetime.utcnow(),
                TokenBlacklist.blacklisted_at > cutoff_time
            ).all()
            
            synced_count = 0
            
            for token_entry in active_tokens:
                try:
                    # Añadir a Redis con TTL apropiado
                    ttl = int((token_entry.expires_at - datetime.utcnow()).total_seconds())
                    if ttl > 0:
                        redis_key = f"{self.redis_blacklist.TOKEN_PREFIX}{token_entry.token_id}"
                        token_data = {
                            "user_id": token_entry.user_id,
                            "token_type": token_entry.token_type,
                            "blacklisted_at": token_entry.blacklisted_at.isoformat(),
                            "expires_at": token_entry.expires_at.isoformat(),
                            "reason": token_entry.reason
                        }
                        
                        if self.redis_blacklist.redis.set(redis_key, token_data, expire=ttl):
                            synced_count += 1
                            
                except Exception as sync_error:
                    logger.warning(f"Error sincronizando token {token_entry.token_id}: {sync_error}")
            
            db.close()
            
            logger.info(f"🔄 Sincronizados {synced_count} tokens de MySQL a Redis")
            
            return {
                "total_mysql_tokens": len(active_tokens),
                "synced_to_redis": synced_count,
                "hours_back": hours_back
            }
            
        except Exception as e:
            logger.error(f"Error sincronizando MySQL a Redis: {e}")
            return {"error": str(e)}

# Instancia global del sistema híbrido de blacklist
token_blacklist = HybridTokenBlacklist()

# Alias para compatibilidad con código existente
redis_token_blacklist_instance = token_blacklist