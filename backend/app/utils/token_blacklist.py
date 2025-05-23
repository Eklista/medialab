# app/utils/token_blacklist.py
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

logger = logging.getLogger(__name__)

class MySQLTokenBlacklist:
    """
    Sistema de blacklist para tokens JWT utilizando MySQL
    Más eficiente y consistente al usar la misma base de datos
    """
    
    def __init__(self):
        self.enabled = TOKEN_BLACKLIST_ENABLED
        self._ensure_blacklist_table()
        logger.info("Sistema de blacklist de tokens inicializado con MySQL")
    
    def _ensure_blacklist_table(self):
        """
        Asegura que la tabla de blacklist exista en la base de datos
        """
        try:
            # Usar el generador de sesión para obtener una sesión
            db = next(get_db())
            
            # Crear tabla si no existe
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS token_blacklist (
                id INT AUTO_INCREMENT PRIMARY KEY,
                token_id VARCHAR(32) NOT NULL UNIQUE,
                user_id INT,
                token_type ENUM('access', 'refresh', 'user_invalidation') DEFAULT 'access',
                blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                reason VARCHAR(100) DEFAULT 'logout',
                INDEX idx_token_id (token_id),
                INDEX idx_user_id (user_id),
                INDEX idx_expires_at (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """
            
            db.execute(text(create_table_sql))
            db.commit()
            
            # Crear evento para limpiar tokens expirados automáticamente
            cleanup_event_sql = """
            CREATE EVENT IF NOT EXISTS cleanup_expired_tokens
            ON SCHEDULE EVERY 1 HOUR
            DO DELETE FROM token_blacklist WHERE expires_at < NOW();
            """
            
            try:
                db.execute(text(cleanup_event_sql))
                db.commit()
            except SQLAlchemyError:
                # Los eventos pueden no estar habilitados, no es crítico
                logger.info("No se pudo crear evento de limpieza automática (normal si los eventos están deshabilitados)")
            
            db.close()
            
        except Exception as e:
            logger.error(f"Error al crear tabla de blacklist: {e}")
    
    def add_token(self, token: str, user_id: int = None) -> bool:
        """
        Añade un token a la blacklist
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
            
            # Insertar en blacklist
            db = next(get_db())
            
            insert_sql = """
            INSERT IGNORE INTO token_blacklist 
            (token_id, user_id, token_type, expires_at, reason) 
            VALUES (:token_id, :user_id, :token_type, :expires_at, :reason)
            """
            
            db.execute(text(insert_sql), {
                'token_id': jti,
                'user_id': user_id,
                'token_type': payload.get('type', 'access'),
                'expires_at': exp_datetime,
                'reason': 'logout'
            })
            
            db.commit()
            db.close()
            
            logger.info(f"Token añadido a blacklist para usuario {user_id}")
            return True
            
        except JWTError as e:
            logger.error(f"Error al decodificar token para blacklist: {e}")
            return False
        except Exception as e:
            logger.error(f"Error al añadir token a blacklist: {e}")
            return False
    
    def is_blacklisted(self, token: str) -> bool:
        """
        Verifica si un token está en la blacklist
        """
        if not self.enabled:
            return False
            
        try:
            # Extraer JTI del token
            jti = self._extract_jti(token)
            if not jti:
                return True  # Si no tiene JTI, considerarlo inválido
            
            db = next(get_db())
            
            # Verificar si el token está en blacklist y no ha expirado
            check_sql = """
            SELECT COUNT(*) as count FROM token_blacklist 
            WHERE token_id = :token_id AND expires_at > NOW()
            """
            
            result = db.execute(text(check_sql), {'token_id': jti}).fetchone()
            db.close()
            
            return result.count > 0 if result else False
                
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
            
            delete_sql = "DELETE FROM token_blacklist WHERE token_id = :token_id"
            result = db.execute(text(delete_sql), {'token_id': jti})
            
            db.commit()
            rows_affected = result.rowcount
            db.close()
            
            return rows_affected > 0
                
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
            
            # Crear entrada de invalidación global para el usuario
            # Esto invalidará todos los tokens emitidos antes de este momento
            insert_sql = """
            INSERT INTO token_blacklist 
            (token_id, user_id, token_type, expires_at, reason) 
            VALUES (:token_id, :user_id, 'user_invalidation', :expires_at, 'global_logout')
            ON DUPLICATE KEY UPDATE 
            blacklisted_at = NOW(), expires_at = :expires_at
            """
            
            # Usar un token_id especial para invalidación de usuario
            special_token_id = f"user_invalidation_{user_id}"
            expires_at = datetime.utcnow() + timedelta(days=1)  # 24 horas
            
            db.execute(text(insert_sql), {
                'token_id': special_token_id,
                'user_id': user_id,
                'expires_at': expires_at
            })
            
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
            check_sql = """
            SELECT blacklisted_at FROM token_blacklist 
            WHERE token_id = :token_id AND token_type = 'user_invalidation' 
            AND expires_at > NOW()
            """
            
            special_token_id = f"user_invalidation_{user_id}"
            result = db.execute(text(check_sql), {'token_id': special_token_id}).fetchone()
            db.close()
            
            if result:
                # Comparar si el token fue emitido antes de la invalidación
                return token_issued_at < result.blacklisted_at
                
            return False
            
        except Exception as e:
            logger.error(f"Error al verificar invalidación de usuario {user_id}: {e}")
            return True  # En caso de error, denegar acceso
    
    def _extract_jti(self, token: str) -> Optional[str]:
        """
        Extrae el JTI (JWT ID) del token sin validarlo completamente
        """
        try:
            # Decodificar sin verificar para obtener el JTI
            unverified_payload = jwt.get_unverified_claims(token)
            return unverified_payload.get("jti")
        except Exception:
            return None
    
    def cleanup_expired_tokens(self) -> int:
        """
        Limpia tokens expirados manualmente (útil si los eventos no están habilitados)
        """
        try:
            db = next(get_db())
            
            delete_sql = "DELETE FROM token_blacklist WHERE expires_at < NOW()"
            result = db.execute(text(delete_sql))
            
            db.commit()
            rows_deleted = result.rowcount
            db.close()
            
            if rows_deleted > 0:
                logger.info(f"Limpiados {rows_deleted} tokens expirados de la blacklist")
            
            return rows_deleted
            
        except Exception as e:
            logger.error(f"Error al limpiar tokens expirados: {e}")
            return 0
    
    def get_stats(self) -> dict:
        """
        Obtiene estadísticas de la blacklist
        """
        if not self.enabled:
            return {"enabled": False}
            
        try:
            db = next(get_db())
            
            # Contar tokens en blacklist
            stats_sql = """
            SELECT 
                COUNT(*) as total_tokens,
                COUNT(CASE WHEN token_type = 'access' THEN 1 END) as access_tokens,
                COUNT(CASE WHEN token_type = 'refresh' THEN 1 END) as refresh_tokens,
                COUNT(CASE WHEN token_type = 'user_invalidation' THEN 1 END) as invalidated_users,
                COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as active_blacklist
            FROM token_blacklist
            """
            
            result = db.execute(text(stats_sql)).fetchone()
            db.close()
            
            return {
                "enabled": True,
                "total_blacklisted": result.total_tokens if result else 0,
                "active_blacklisted": result.active_blacklist if result else 0,
                "access_tokens": result.access_tokens if result else 0,
                "refresh_tokens": result.refresh_tokens if result else 0,
                "invalidated_users": result.invalidated_users if result else 0,
                "storage": "mysql"
            }
                
        except Exception as e:
            logger.error(f"Error al obtener estadísticas de blacklist: {e}")
            return {"enabled": True, "error": str(e), "storage": "mysql"}

# Instancia global del sistema de blacklist
token_blacklist = MySQLTokenBlacklist()