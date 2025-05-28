# backend/app/repositories/auth_repository.py
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text, and_, or_
import logging

from app.models.auth.users import User
from app.models.security.token_blacklist import TokenBlacklist
from app.models.security.audit_log import AuditLog

logger = logging.getLogger(__name__)

class AuthRepository:
    """
    Repositorio especializado para operaciones de autenticación
    Separa las consultas específicas de auth del UserRepository general
    """
    
    # ===== OPERACIONES DE USUARIOS PARA AUTH =====
    
    @staticmethod
    def get_user_for_auth(db: Session, identifier: str) -> Optional[User]:
        """
        Obtiene usuario por email O username para autenticación
        Incluye eager loading de roles para evitar consultas adicionales
        """
        from sqlalchemy.orm import joinedload
        
        return db.query(User).options(
            joinedload(User.roles).joinedload("permissions")
        ).filter(
            or_(User.email == identifier, User.username == identifier),
            User.is_active == True
        ).first()
    
    @staticmethod
    def get_user_by_email_active(db: Session, email: str) -> Optional[User]:
        """
        Obtiene usuario activo por email con roles cargados
        """
        from sqlalchemy.orm import joinedload
        
        return db.query(User).options(
            joinedload(User.roles)
        ).filter(
            User.email == email,
            User.is_active == True
        ).first()
    
    @staticmethod
    def update_login_info(db: Session, user_id: int) -> bool:
        """
        Actualiza información de último login
        """
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.last_login = datetime.utcnow()
                user.is_online = True
                db.commit()
                return True
            return False
        except SQLAlchemyError as e:
            logger.error(f"Error actualizando info de login para usuario {user_id}: {e}")
            db.rollback()
            return False
    
    # ===== OPERACIONES DE RESET DE CONTRASEÑA =====
    
    @staticmethod
    def save_reset_code(db: Session, user_id: int, hashed_code: str, expires_at: datetime) -> bool:
        """
        Guarda código de reset de contraseña hasheado
        """
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.reset_token = hashed_code
                user.reset_token_expires = expires_at
                db.commit()
                logger.info(f"Código de reset guardado para usuario {user_id}")
                return True
            return False
        except SQLAlchemyError as e:
            logger.error(f"Error guardando código de reset para usuario {user_id}: {e}")
            db.rollback()
            return False
    
    @staticmethod
    def get_user_by_reset_code(db: Session, email: str) -> Optional[User]:
        """
        Obtiene usuario con código de reset válido (no expirado)
        """
        return db.query(User).filter(
            User.email == email,
            User.is_active == True,
            User.reset_token.isnot(None),
            User.reset_token_expires > datetime.utcnow()
        ).first()
    
    @staticmethod
    def clear_reset_code(db: Session, user_id: int) -> bool:
        """
        Limpia código de reset después de uso exitoso
        """
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.reset_token = None
                user.reset_token_expires = None
                db.commit()
                return True
            return False
        except SQLAlchemyError as e:
            logger.error(f"Error limpiando código de reset para usuario {user_id}: {e}")
            db.rollback()
            return False
    
    @staticmethod
    def update_password_with_tracking(db: Session, user_id: int, password_hash: str) -> bool:
        """
        Actualiza contraseña con tracking de cuándo se cambió
        """
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.password_hash = password_hash
                user.password_changed_at = datetime.utcnow()
                
                # Limpiar código de reset si existe
                user.reset_token = None
                user.reset_token_expires = None
                
                db.commit()
                logger.info(f"Contraseña actualizada para usuario {user_id}")
                return True
            return False
        except SQLAlchemyError as e:
            logger.error(f"Error actualizando contraseña para usuario {user_id}: {e}")
            db.rollback()
            return False
    
    # ===== OPERACIONES DE BLACKLIST DE TOKENS =====
    
    @staticmethod
    def add_token_to_blacklist(db: Session, token_jti: str, user_id: int, expires_at: datetime, reason: str = "logout") -> bool:
        """
        Añade token a blacklist en base de datos
        """
        try:
            blacklist_entry = TokenBlacklist(
                jti=token_jti,
                user_id=user_id,
                blacklisted_at=datetime.utcnow(),
                expires_at=expires_at,
                reason=reason
            )
            db.add(blacklist_entry)
            db.commit()
            return True
        except SQLAlchemyError as e:
            logger.error(f"Error añadiendo token a blacklist: {e}")
            db.rollback()
            return False
    
    @staticmethod
    def is_token_blacklisted(db: Session, token_jti: str) -> bool:
        """
        Verifica si un token está en blacklist
        """
        try:
            blacklisted = db.query(TokenBlacklist).filter(
                TokenBlacklist.jti == token_jti,
                TokenBlacklist.expires_at > datetime.utcnow()
            ).first()
            return blacklisted is not None
        except SQLAlchemyError as e:
            logger.error(f"Error verificando blacklist: {e}")
            return True  # En caso de error, asumir que está blacklisted por seguridad
    
    @staticmethod
    def blacklist_all_user_tokens(db: Session, user_id: int, reason: str = "logout_all") -> int:
        """
        Marca todos los tokens de un usuario como blacklisted
        Retorna número de tokens afectados
        """
        try:
            # En lugar de blacklistear tokens específicos, 
            # guardamos un timestamp de invalidación global para el usuario
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.tokens_invalid_before = datetime.utcnow()
                db.commit()
                
                # Log de auditoría
                audit_log = AuditLog(
                    user_id=user_id,
                    action="global_token_invalidation",
                    details={"reason": reason, "timestamp": datetime.utcnow().isoformat()},
                    ip_address="system",
                    user_agent="auth_service"
                )
                db.add(audit_log)
                db.commit()
                
                logger.info(f"Todos los tokens invalidados para usuario {user_id}")
                return 1  # Indicamos éxito
            return 0
        except SQLAlchemyError as e:
            logger.error(f"Error invalidando tokens de usuario {user_id}: {e}")
            db.rollback()
            return 0
    
    @staticmethod
    def cleanup_expired_blacklist(db: Session) -> int:
        """
        Limpia entradas expiradas de blacklist
        Retorna número de entradas eliminadas
        """
        try:
            deleted_count = db.query(TokenBlacklist).filter(
                TokenBlacklist.expires_at <= datetime.utcnow()
            ).delete()
            db.commit()
            
            if deleted_count > 0:
                logger.info(f"Limpieza de blacklist: {deleted_count} entradas eliminadas")
            
            return deleted_count
        except SQLAlchemyError as e:
            logger.error(f"Error limpiando blacklist: {e}")
            db.rollback()
            return 0
    
    # ===== OPERACIONES DE AUDITORÍA Y SEGURIDAD =====
    
    @staticmethod
    def log_security_event(db: Session, user_id: Optional[int], event_type: str, 
                          details: Dict[str, Any], ip_address: str = None, 
                          user_agent: str = None) -> bool:
        """
        Registra evento de seguridad en audit log
        """
        try:
            audit_log = AuditLog(
                user_id=user_id,
                action=event_type,
                details=details,  # Cambiar a JSON si es necesario
                ip_address=ip_address,
                user_agent=user_agent,
                timestamp=datetime.utcnow()  # Cambiar created_at por timestamp
            )
            db.add(audit_log)
            db.commit()
            return True
        except SQLAlchemyError as e:
            logger.error(f"Error logging security event: {e}")
            db.rollback()
            return False
    
    @staticmethod
    def get_user_security_info(db: Session, user_id: int) -> Dict[str, Any]:
        """
        Obtiene información de seguridad del usuario
        """
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return {}
            
            # Obtener estadísticas de intentos fallidos recientes (últimas 24 horas)
            recent_failed_attempts = db.query(AuditLog).filter(
                AuditLog.user_id == user_id,
                AuditLog.action.in_(["failed_login", "failed_password_reset"]),
                AuditLog.created_at >= datetime.utcnow() - timedelta(hours=24)
            ).count()
            
            # Obtener último login exitoso
            last_successful_login = db.query(AuditLog).filter(
                AuditLog.user_id == user_id,
                AuditLog.action == "successful_login"
            ).order_by(AuditLog.created_at.desc()).first()
            
            return {
                "user_id": user_id,
                "failed_attempts_24h": recent_failed_attempts,
                "last_successful_login": last_successful_login.created_at if last_successful_login else None,
                "password_changed_at": getattr(user, 'password_changed_at', None),
                "tokens_invalid_before": getattr(user, 'tokens_invalid_before', None),
                "is_active": user.is_active,
                "last_login": user.last_login
            }
        except SQLAlchemyError as e:
            logger.error(f"Error obteniendo info de seguridad para usuario {user_id}: {e}")
            return {}
    
    @staticmethod
    def get_security_stats(db: Session) -> Dict[str, Any]:
        """
        Obtiene estadísticas generales de seguridad
        """
        try:
            # Estadísticas de blacklist
            active_blacklist_count = db.query(TokenBlacklist).filter(
                TokenBlacklist.expires_at > datetime.utcnow()
            ).count()
            
            # Estadísticas de eventos de seguridad (últimas 24 horas)
            recent_events = db.query(AuditLog).filter(
                AuditLog.created_at >= datetime.utcnow() - timedelta(hours=24)
            ).count()
            
            # Usuarios con tokens invalidados globalmente
            users_with_global_invalidation = db.query(User).filter(
                User.tokens_invalid_before.isnot(None)
            ).count()
            
            return {
                "active_blacklist_entries": active_blacklist_count,
                "security_events_24h": recent_events,
                "users_with_global_token_invalidation": users_with_global_invalidation,
                "last_updated": datetime.utcnow().isoformat()
            }
        except SQLAlchemyError as e:
            logger.error(f"Error obteniendo estadísticas de seguridad: {e}")
            return {"error": str(e)}
    
    # ===== OPERACIONES DE VALIDACIÓN =====
    
    @staticmethod
    def is_user_globally_invalidated(db: Session, user_id: int, token_issued_at: datetime) -> bool:
        """
        Verifica si los tokens del usuario han sido invalidados globalmente
        """
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return True  # Usuario no existe, considerar invalidado
            
            # Si el usuario tiene una fecha de invalidación global
            if hasattr(user, 'tokens_invalid_before') and user.tokens_invalid_before:
                return token_issued_at < user.tokens_invalid_before
            
            return False
        except SQLAlchemyError as e:
            logger.error(f"Error verificando invalidación global para usuario {user_id}: {e}")
            return True  # En caso de error, asumir invalidado por seguridad
    
    @staticmethod
    def emergency_security_reset(db: Session, user_id: int, admin_user_id: int) -> Dict[str, Any]:
        """
        Reset de emergencia de seguridad para un usuario
        """
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return {"success": False, "error": "Usuario no encontrado"}
            
            # Invalidar todos los tokens
            user.tokens_invalid_before = datetime.utcnow()
            
            # Limpiar códigos de reset
            user.reset_token = None
            user.reset_token_expires = None
            
            # Log de auditoría
            audit_details = {
                "action": "emergency_security_reset",
                "target_user_id": user_id,
                "admin_user_id": admin_user_id,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            audit_log = AuditLog(
                user_id=admin_user_id,
                action="emergency_security_reset",
                details=audit_details,
                ip_address="admin_action",
                user_agent="security_service"
            )
            db.add(audit_log)
            db.commit()
            
            logger.warning(f"🚨 Reset de seguridad de emergencia ejecutado para usuario {user_id} por admin {admin_user_id}")
            
            return {
                "success": True,
                "actions_taken": [
                    "Todos los tokens invalidados",
                    "Códigos de reset limpiados",
                    "Evento registrado en auditoría"
                ],
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except SQLAlchemyError as e:
            logger.error(f"Error en reset de emergencia para usuario {user_id}: {e}")
            db.rollback()
            return {"success": False, "error": str(e)}