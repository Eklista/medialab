# backend/app/services/auth_service.py
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import jwt, JWTError
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import logging
import secrets

from app.config.settings import (
    SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, 
    REFRESH_TOKEN_EXPIRE_DAYS
)
from app.config.security import (
    SecureTokenManager, verify_password, create_password_hash
)
from app.repositories.user_repository import UserRepository
from app.models.auth.users import User
from app.schemas.auth.token import TokenPayload

# NUEVO: Importar Redis blacklist y rate limiter
from app.utils.redis_token_blacklist import redis_token_blacklist
from app.utils.redis_rate_limiter import redis_rate_limiter

logger = logging.getLogger(__name__)

class AuthService:
    """
    Servicio fortificado para gestionar autenticación y tokens
    Ahora utiliza Redis para blacklist, rate limiting y gestión de intentos fallidos
    """
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """
        Autentica un usuario con protección contra ataques de fuerza bruta usando Redis
        """
        # Verificar si la IP/usuario está bloqueado usando Redis
        if redis_token_blacklist.is_locked_out(email, "login", max_attempts=5):
            logger.warning(f"Intento de login en cuenta bloqueada: {email}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Demasiados intentos fallidos. Inténtalo más tarde."
            )
        
        user = UserRepository.get_by_email(db, email)
        
        if not user:
            # Registrar intento fallido para prevenir enumeración
            redis_token_blacklist.record_failed_attempt(email, "login")
            logger.warning(f"Intento de login con email inexistente: {email}")
            return None
        
        if not verify_password(password, user.password_hash):
            # Registrar intento fallido
            redis_token_blacklist.record_failed_attempt(email, "login")
            logger.warning(f"Intento de login con contraseña incorrecta para: {email}")
            return None
        
        # Limpiar intentos fallidos después de login exitoso
        redis_token_blacklist.clear_failed_attempts(email, "login")
        
        logger.info(f"Login exitoso para usuario: {email}")
        return user
    
    @staticmethod
    def create_tokens(user_id: int, additional_claims: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
        """
        Crea tokens de acceso y refresco con seguridad mejorada
        """
        try:
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
            
            # Crear token de acceso con claims adicionales
            access_token = SecureTokenManager.create_access_token(
                subject=user_id,
                expires_delta=access_token_expires,
                additional_claims=additional_claims
            )
            
            # Crear token de refresco
            refresh_token = SecureTokenManager.create_refresh_token(
                subject=user_id,
                expires_delta=refresh_token_expires
            )
            
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60  # segundos
            }
            
        except Exception as e:
            logger.error(f"Error al crear tokens para usuario {user_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al generar tokens de autenticación"
            )
    
    @staticmethod
    def refresh_access_token(refresh_token: str, db: Session) -> Dict[str, str]:
        """
        Genera un nuevo access token usando un refresh token válido
        Ahora usa Redis blacklist para verificación
        """
        try:
            # Verificar que el refresh token no esté en blacklist (Redis)
            if redis_token_blacklist.is_blacklisted(refresh_token):
                logger.warning("Intento de usar refresh token en blacklist")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token de refresh inválido"
                )
            
            # Verificar y decodificar refresh token
            payload = SecureTokenManager.verify_token(refresh_token, "refresh")
            user_id = int(payload.get("sub"))
            token_issued_at = datetime.fromtimestamp(payload.get("iat", 0))
            
            # Verificar que el usuario no haya sido invalidado globalmente (Redis)
            if redis_token_blacklist.is_user_invalidated(user_id, token_issued_at):
                logger.warning(f"Intento de usar refresh token de usuario invalidado: {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Sesión expirada. Por favor, inicia sesión nuevamente."
                )
            
            # Verificar que el usuario existe y está activo
            user = UserRepository.get_by_id(db, user_id)
            if not user or not user.is_active:
                logger.warning(f"Refresh token para usuario inexistente o inactivo: {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Usuario no autorizado"
                )
            
            # Crear nuevo access token
            new_access_token = SecureTokenManager.create_access_token(
                subject=user_id,
                additional_claims={"refresh_used": True}
            )
            
            logger.info(f"Access token renovado para usuario {user_id}")
            
            return {
                "access_token": new_access_token,
                "token_type": "bearer",
                "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error al renovar access token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Error al renovar token de acceso"
            )
    
    @staticmethod
    def logout_user(access_token: str, refresh_token: str = None, user_id: int = None) -> bool:
        """
        Cierra sesión del usuario añadiendo tokens a blacklist Redis
        """
        try:
            success = True
            
            # Añadir access token a blacklist Redis
            if not redis_token_blacklist.add_token(access_token, user_id):
                logger.warning(f"No se pudo añadir access token a blacklist para usuario {user_id}")
                success = False
            
            # Añadir refresh token a blacklist si se proporciona
            if refresh_token:
                if not redis_token_blacklist.add_token(refresh_token, user_id):
                    logger.warning(f"No se pudo añadir refresh token a blacklist para usuario {user_id}")
                    success = False
            
            if success:
                logger.info(f"Logout exitoso para usuario {user_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error en logout para usuario {user_id}: {e}")
            return False
    
    @staticmethod
    def logout_all_sessions(user_id: int) -> bool:
        """
        Invalida todas las sesiones de un usuario usando Redis
        """
        try:
            success = redis_token_blacklist.blacklist_all_user_tokens(user_id)
            if success:
                logger.info(f"Todas las sesiones invalidadas para usuario {user_id}")
            else:
                logger.warning(f"No se pudieron invalidar todas las sesiones para usuario {user_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error al invalidar todas las sesiones para usuario {user_id}: {e}")
            return False
    
    @staticmethod
    def verify_token(token: str) -> TokenPayload:
        """
        Verifica y decodifica un token JWT con validaciones de seguridad usando Redis
        """
        try:
            # Verificar que el token no esté en blacklist Redis
            if redis_token_blacklist.is_blacklisted(token):
                logger.warning("Intento de usar token en blacklist")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token inválido",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Verificar token usando el sistema seguro
            payload = SecureTokenManager.verify_token(token, "access")
            
            # Crear TokenPayload para compatibilidad
            token_data = TokenPayload(
                sub=payload.get("sub"),
                exp=payload.get("exp"),
                iat=payload.get("iat"),
                jti=payload.get("jti")
            )
            
            # Verificar invalidación global del usuario usando Redis
            user_id = int(payload.get("sub"))
            token_issued_at = datetime.fromtimestamp(payload.get("iat", 0))
            
            if redis_token_blacklist.is_user_invalidated(user_id, token_issued_at):
                logger.warning(f"Token de usuario invalidado globalmente: {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Sesión expirada. Por favor, inicia sesión nuevamente.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            return token_data
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error inesperado al verificar token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Error al validar credenciales",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    @staticmethod
    def update_user_login(db: Session, user: User) -> None:
        """
        Actualiza los campos de último acceso y estado online
        """
        try:
            UserRepository.update_last_login(db, user)
            logger.info(f"Login actualizado para usuario {user.email}")
        except Exception as e:
            logger.error(f"Error al actualizar último login para {user.email}: {e}")
    
    @staticmethod
    def generate_password_reset_code(db: Session, email: str, reset_code: str, expires_at: datetime) -> Optional[Dict[str, Any]]:
        """
        Genera un código para restablecer contraseña con validaciones de seguridad usando Redis
        """
        try:
            user = UserRepository.get_by_email(db, email)
            
            # Siempre responder positivamente para evitar enumeración de usuarios
            if not user or not user.is_active:
                logger.warning(f"Intento de reset de contraseña para email inexistente/inactivo: {email}")
                return None
            
            # Verificar límite de intentos de reset usando Redis
            if redis_token_blacklist.is_locked_out(email, "reset", max_attempts=3):
                logger.warning(f"Límite de intentos de reset alcanzado para: {email}")
                return None
            
            # Generar código más seguro (6 dígitos numéricos)
            secure_code = f"{secrets.randbelow(1000000):06d}"
            
            # Guardar código en BD con hash para mayor seguridad
            hashed_code = create_password_hash(secure_code)
            
            user_data = {
                "reset_token": hashed_code,  # Guardar hash del código
                "reset_token_expires": expires_at
            }
            
            UserRepository.update(db, user, user_data)
            
            # Registrar intento de reset en Redis
            redis_token_blacklist.record_failed_attempt(email, "reset")
            
            logger.info(f"Código de reset generado para usuario: {email}")
            
            return {
                "email": user.email,
                "reset_code": secure_code,  # Retornar código original para envío
                "user_data": {
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name
                }
            }
            
        except Exception as e:
            logger.error(f"Error al generar código de reset para {email}: {e}")
            return None
    
    @staticmethod
    def verify_reset_code(db: Session, email: str, code: str) -> bool:
        """
        Verifica si un código de recuperación es válido con protecciones adicionales usando Redis
        """
        try:
            user = UserRepository.get_by_email(db, email)
            
            if not user or not user.is_active:
                return False
            
            # Verificar límite de intentos de verificación usando Redis
            if redis_token_blacklist.is_locked_out(email, "verification", max_attempts=5):
                logger.warning(f"Límite de verificaciones alcanzado para: {email}")
                return False
            
            # Verificar que el código no haya expirado
            if (not user.reset_token_expires or 
                user.reset_token_expires < datetime.utcnow()):
                logger.info(f"Código de reset expirado para: {email}")
                return False
            
            # Verificar código usando hash seguro
            if not user.reset_token or not verify_password(code, user.reset_token):
                redis_token_blacklist.record_failed_attempt(email, "verification")
                logger.warning(f"Código de reset incorrecto para: {email}")
                return False
            
            # Limpiar intentos fallidos tras verificación exitosa
            redis_token_blacklist.clear_failed_attempts(email, "verification")
            
            logger.info(f"Código de reset verificado exitosamente para: {email}")
            return True
            
        except Exception as e:
            logger.error(f"Error al verificar código de reset para {email}: {e}")
            return False
    
    @staticmethod
    def reset_password_with_code(db: Session, email: str, code: str, new_password: str) -> bool:
        """
        Restablece la contraseña mediante código de verificación con validaciones usando Redis
        """
        try:
            # Verificar que el código sea válido
            if not AuthService.verify_reset_code(db, email, code):
                return False
            
            user = UserRepository.get_by_email(db, email)
            
            if not user:
                return False
            
            # Validar fortaleza de la nueva contraseña
            from app.config.security import check_password_strength
            strength_check = check_password_strength(new_password)
            
            if not strength_check["is_strong"]:
                logger.warning(f"Intento de establecer contraseña débil para: {email}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La contraseña no cumple con los requisitos de seguridad"
                )
            
            # Actualizar contraseña con hash seguro
            user_data = {
                "password_hash": create_password_hash(new_password),
                "reset_token": None,
                "reset_token_expires": None,
                "password_changed_at": datetime.utcnow()  # Track password changes
            }
            
            UserRepository.update(db, user, user_data)
            
            # Invalidar todas las sesiones existentes por seguridad usando Redis
            AuthService.logout_all_sessions(user.id)
            
            # Limpiar intentos de reset en Redis
            redis_token_blacklist.clear_failed_attempts(email, "reset")
            redis_token_blacklist.clear_failed_attempts(email, "verification")
            
            logger.info(f"Contraseña restablecida exitosamente para: {email}")
            return True
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error al restablecer contraseña para {email}: {e}")
            return False
    
    # ===== MÉTODOS DE ESTADÍSTICAS Y GESTIÓN =====
    
    @staticmethod
    def get_security_stats() -> Dict[str, Any]:
        """
        Obtiene estadísticas de seguridad del sistema de autenticación
        """
        try:
            blacklist_stats = redis_token_blacklist.get_stats()
            rate_limit_stats = redis_rate_limiter.get_stats()
            
            return {
                "token_blacklist": blacklist_stats,
                "rate_limiting": rate_limit_stats,
                "redis_available": redis_token_blacklist.redis.is_available(),
                "security_features": {
                    "token_blacklist_enabled": redis_token_blacklist.enabled,
                    "rate_limiting_enabled": redis_rate_limiter.enabled,
                    "failed_attempts_tracking": True,
                    "global_user_invalidation": True,
                    "automatic_cleanup": True
                }
            }
            
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas de seguridad: {e}")
            return {"error": str(e)}
    
    @staticmethod
    def cleanup_security_data() -> Dict[str, int]:
        """
        Limpia datos de seguridad expirados (principalmente para el cache en memoria)
        Redis limpia automáticamente con TTL
        """
        try:
            # En Redis la limpieza es automática, pero podemos limpiar cache en memoria
            rate_limit_cleaned = redis_rate_limiter.cleanup_memory_cache()
            blacklist_cleaned = redis_token_blacklist.cleanup_expired_tokens()
            
            return {
                "rate_limit_entries_cleaned": rate_limit_cleaned,
                "blacklist_entries_cleaned": blacklist_cleaned,
                "automatic_redis_cleanup": True
            }
            
        except Exception as e:
            logger.error(f"Error limpiando datos de seguridad: {e}")
            return {"error": str(e)}
    
    @staticmethod
    def emergency_reset_user_security(user_id: int) -> bool:
        """
        Resetea completamente la seguridad de un usuario (uso administrativo)
        """
        try:
            # Invalidar todas las sesiones del usuario
            sessions_invalidated = AuthService.logout_all_sessions(user_id)
            
            # Limpiar rate limits (si tenemos el email del usuario)
            # Nota: Necesitaríamos el email para limpiar completamente
            
            logger.info(f"🚨 Reset de seguridad de emergencia para usuario {user_id}")
            
            return sessions_invalidated
            
        except Exception as e:
            logger.error(f"Error en reset de seguridad de emergencia para usuario {user_id}: {e}")
            return False
    
    # ===== MÉTODOS DE COMPATIBILIDAD =====
    
    @staticmethod
    def create_token(data: Dict, expires_delta: Optional[timedelta] = None) -> str:
        """
        Método de compatibilidad - usar create_tokens() para nueva funcionalidad
        """
        logger.warning("Uso de método create_token() deprecado")
        return SecureTokenManager.create_access_token(
            subject=data.get("sub", "unknown"),
            expires_delta=expires_delta
        )
    
    @staticmethod
    def reset_password(db: Session, token: str, new_password: str) -> bool:
        """
        Método de compatibilidad para reset con token
        (Método mantenido para compatibilidad con versiones anteriores)
        """
        logger.warning("Uso de método reset_password() con token deprecado")
        try:
            # Buscar usuario con este token
            user = db.query(User).filter(User.reset_token == token).first()
            
            if not user or not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Token de recuperación inválido"
                )
            
            # Verificar que el token no haya expirado
            if not user.reset_token_expires or user.reset_token_expires < datetime.utcnow():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Token de recuperación expirado"
                )
            
            # Actualizar contraseña
            user_data = {
                "password_hash": create_password_hash(new_password),
                "reset_token": None,
                "reset_token_expires": None
            }
            
            UserRepository.update(db, user, user_data)
            
            return True
            
        except Exception as e:
            logger.error(f"Error en reset_password legacy: {e}")
            return False