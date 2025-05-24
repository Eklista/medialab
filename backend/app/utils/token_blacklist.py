# Actualizar: backend/app/utils/token_blacklist.py

import json
from datetime import datetime, timedelta
from typing import Optional, Set
from jose import jwt, JWTError
import logging
from sqlalchemy.orm import Session
from sqlalchemy import text, create_engine
from sqlalchemy.exc import SQLAlchemyError

from app.config.settings import SECRET_KEY, ALGORITHM, TOKEN_BLACKLIST_ENABLED, DATABASE_URL
from app.database import get_db
from app.models.security.token_blacklist import TokenBlacklist  # ← NUEVO

logger = logging.getLogger(__name__)

class MySQLTokenBlacklist:
    """
    Sistema de blacklist para tokens JWT utilizando modelo SQLAlchemy
    Más eficiente y consistente al usar el modelo ORM
    """
    
    def __init__(self):
        self.enabled = TOKEN_BLACKLIST_ENABLED
        logger.info("Sistema de blacklist de tokens inicializado con modelo TokenBlacklist")
    
    def add_token(self, token: str, user_id: int = None) -> bool:
        """
        Añade un token a la blacklist usando el modelo
        """
        if not self.enabled:
            return False
            
        try:
            # Decodificar token para obtener tiempo de expiración
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            exp_timestamp = payload.get('exp')
            jti = payload.get('jti')  # JWT ID único
            
            if not exp_timestamp or not jti:
                return False
            
            # Convertir timestamp a datetime
            exp_datetime = datetime.fromtimestamp(exp_timestamp)
            
            if exp_datetime <= datetime.utcnow():
                # Token ya expirado, no necesita blacklist
                return True
            
            # Usar el modelo para insertar
            db = next(get_db())
            
            success = TokenBlacklist.add_token_to_blacklist(
                db_session=db,
                token_id=jti,
                user_id=user_id,
                token_type=payload.get('type', 'access'),
                expires_at=exp_datetime,
                reason='logout'
            )
            
            db.close()
            
            if success:
                logger.info(f"Token añadido a blacklist para usuario {user_id}")
            
            return success
            
        except JWTError as e:
            logger.error(f"Error al decodificar token para blacklist: {e}")
            return False
        except Exception as e:
            logger.error(f"Error al añadir token a blacklist: {e}")
            return False
    
    def is_blacklisted(self, token: str) -> bool:
        """
        Verifica si un token está en la blacklist usando el modelo
        """
        if not self.enabled:
            return False
            
        try:
            # Extraer JTI del token
            jti = self._extract_jti(token)
            if not jti:
                return True  # Si no tiene JTI, considerarlo inválido
            
            db = next(get_db())
            
            # Usar el modelo para verificar
            is_blacklisted = TokenBlacklist.is_token_blacklisted(db, jti)
            
            db.close()
            
            return is_blacklisted
                
        except Exception as e:
            logger.error(f"Error al verificar token en blacklist: {e}")
            # En caso de error, denegar acceso por seguridad
            return True
    
    def remove_token(self, token: str) -> bool:
        """
        Remueve un token de la blacklist (uso administrativo)
        """
        if not self.enabled:
            return False
            
        try:
            jti = self._extract_jti(token)
            if not jti:
                return False
            
            db = next(get_db())
            
            # Buscar y eliminar usando el modelo
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
            logger.error(f"Error al remover token de blacklist: {e}")
            return False
    
    def blacklist_all_user_tokens(self, user_id: int) -> bool:
        """
        Invalida todos los tokens de un usuario (útil para logout global)
        """
        if not self.enabled:
            return False
            
        try:
            db = next(get_db())
            
            # Usar un token_id especial para invalidación de usuario
            special_token_id = f"user_invalidation_{user_id}"
            expires_at = datetime.utcnow() + timedelta(days=1)  # 24 horas
            
            # Verificar si ya existe
            existing = db.query(TokenBlacklist).filter(
                TokenBlacklist.token_id == special_token_id
            ).first()
            
            if existing:
                # Actualizar fecha de expiración
                existing.expires_at = expires_at
                existing.blacklisted_at = datetime.utcnow()
            else:
                # Crear nueva entrada
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
            
            logger.info(f"Todos los tokens del usuario {user_id} invalidados")
            return True
            
        except Exception as e:
            logger.error(f"Error al invalidar tokens del usuario {user_id}: {e}")
            return False
    
    def is_user_invalidated(self, user_id: int, token_issued_at: datetime) -> bool:
        """
        Verifica si todos los tokens de un usuario han sido invalidados
        """
        if not self.enabled:
            return False
            
        try:
            db = next(get_db())
            
            # Buscar invalidación global del usuario
            special_token_id = f"user_invalidation_{user_id}"
            invalidation = db.query(TokenBlacklist).filter(
                TokenBlacklist.token_id == special_token_id,
                TokenBlacklist.token_type == 'user_invalidation',
                TokenBlacklist.expires_at > datetime.utcnow()
            ).first()
            
            db.close()
            
            if invalidation:
                # Comparar si el token fue emitido antes de la invalidación
                return token_issued_at < invalidation.blacklisted_at
                
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
                try:
                    from app.config.security import SecureTokenManager
                    
                    if SecureTokenManager._is_encrypted_token(token):
                        logger.debug("🔧 DEBUG: Token JWE detectado, desencriptando para extraer JTI")
                        
                        import hashlib
                        from jose import jwe
                        from app.config.settings import SECRET_KEY
                        
                        encryption_key = hashlib.sha256(SECRET_KEY.encode()).digest()
                        decrypted_bytes = jwe.decrypt(token.encode(), encryption_key)
                        jwt_token = decrypted_bytes.decode()
                        
                        # Ahora extraer JTI del JWT desencriptado
                        unverified_payload = jwt.get_unverified_claims(jwt_token)
                        jti = unverified_payload.get("jti")
                        
                        logger.debug(f"🔧 DEBUG: JTI extraído de token JWE: {jti}")
                        return jti
                        
                except Exception as jwe_error:
                    logger.error(f"🔧 DEBUG: Error al desencriptar JWE para extraer JTI: {jwe_error}")
                    return None
            
            # Token JWT normal (3 partes) - método original
            elif len(parts) == 3:
                logger.debug("🔧 DEBUG: Token JWT normal detectado")
                unverified_payload = jwt.get_unverified_claims(token)
                jti = unverified_payload.get("jti")
                logger.debug(f"🔧 DEBUG: JTI extraído de token JWT: {jti}")
                return jti
            
            else:
                logger.warning(f"🔧 DEBUG: Token con formato inesperado ({len(parts)} partes)")
                return None
                
        except Exception as e:
            logger.error(f"🔧 DEBUG: Error general al extraer JTI: {e}")
            return None
    
    def cleanup_expired_tokens(self) -> int:
        """
        Limpia tokens expirados usando el modelo
        """
        try:
            db = next(get_db())
            
            deleted_count = TokenBlacklist.cleanup_expired_tokens(db)
            
            db.close()
            
            if deleted_count > 0:
                logger.info(f"Limpiados {deleted_count} tokens expirados de la blacklist")
            
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error al limpiar tokens expirados: {e}")
            return 0
    
    def get_stats(self) -> dict:
        """
        Obtiene estadísticas de la blacklist usando el modelo
        """
        if not self.enabled:
            return {"enabled": False}
            
        try:
            db = next(get_db())
            
            # Contar tokens en blacklist
            total_tokens = db.query(TokenBlacklist).count()
            active_blacklist = db.query(TokenBlacklist).filter(
                TokenBlacklist.expires_at > datetime.utcnow()
            ).count()
            
            access_tokens = db.query(TokenBlacklist).filter(
                TokenBlacklist.token_type == 'access'
            ).count()
            
            refresh_tokens = db.query(TokenBlacklist).filter(
                TokenBlacklist.token_type == 'refresh'
            ).count()
            
            invalidated_users = db.query(TokenBlacklist).filter(
                TokenBlacklist.token_type == 'user_invalidation'
            ).count()
            
            db.close()
            
            return {
                "enabled": True,
                "total_blacklisted": total_tokens,
                "active_blacklisted": active_blacklist,
                "access_tokens": access_tokens,
                "refresh_tokens": refresh_tokens,
                "invalidated_users": invalidated_users,
                "storage": "mysql_orm"
            }
                
        except Exception as e:
            logger.error(f"Error al obtener estadísticas de blacklist: {e}")
            return {"enabled": True, "error": str(e), "storage": "mysql_orm"}

# Instancia global del sistema de blacklist
token_blacklist = MySQLTokenBlacklist()