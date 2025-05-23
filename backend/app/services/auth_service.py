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
from app.utils.token_blacklist import token_blacklist

logger = logging.getLogger(__name__)

class AuthService:
    """
    Servicio fortificado para gestionar autenticación y tokens
    Incluye protecciones contra ataques de fuerza bruta, replay y session hijacking
    """
    
    # Cache para intentos de login fallidos (en producción usar Redis)
    _failed_attempts = {}
    _lockout_time = {}
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """
        Autentica un usuario con protección contra ataques de fuerza bruta
        """
        # Verificar si la IP/usuario está bloqueado
        if AuthService._is_locked_out(email):
            logger.warning(f"Intento de login en cuenta bloqueada: {email}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Demasiados intentos fallidos. Inténtalo más tarde."
            )
        
        user = UserRepository.get_by_email(db, email)
        
        if not user:
            # Registrar intento fallido para prevenir enumeración
            AuthService._record_failed_attempt(email)
            logger.warning(f"Intento de login con email inexistente: {email}")
            return None
        
        if not verify_password(password, user.password_hash):
            # Registrar intento fallido
            AuthService._record_failed_attempt(email)
            logger.warning(f"Intento de login con contraseña incorrecta para: {email}")
            return None
        
        # Limpiar intentos fallidos después de login exitoso
        AuthService._clear_failed_attempts(email)
        
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
        """
        try:
            # Verificar que el refresh token no esté en blacklist
            if token_blacklist.is_blacklisted(refresh_token):
                logger.warning("Intento de usar refresh token en blacklist")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token de refresh inválido"
                )
            
            # Verificar y decodificar refresh token
            payload = SecureTokenManager.verify_token(refresh_token, "refresh")
            user_id = int(payload.get("sub"))
            token_issued_at = datetime.fromtimestamp(payload.get("iat", 0))
            
            # Verificar que el usuario no haya sido invalidado globalmente
            if token_blacklist.is_user_invalidated(user_id, token_issued_at):
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
        Cierra sesión del usuario añadiendo tokens a blacklist
        """
        try:
            success = True
            
            # Añadir access token a blacklist
            if not token_blacklist.add_token(access_token, user_id):
                logger.warning(f"No se pudo añadir access token a blacklist para usuario {user_id}")
                success = False
            
            # Añadir refresh token a blacklist si se proporciona
            if refresh_token:
                if not token_blacklist.add_token(refresh_token, user_id):
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
        Invalida todas las sesiones de un usuario (logout global)
        """
        try:
            success = token_blacklist.blacklist_all_user_tokens(user_id)
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
        Verifica y decodifica un token JWT con validaciones de seguridad completas
        """
        try:
            # Verificar que el token no esté en blacklist
            if token_blacklist.is_blacklisted(token):
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
            
            # Verificar invalidación global del usuario
            user_id = int(payload.get("sub"))
            token_issued_at = datetime.fromtimestamp(payload.get("iat", 0))
            
            if token_blacklist.is_user_invalidated(user_id, token_issued_at):
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
        Genera un código para restablecer contraseña con validaciones de seguridad
        """
        try:
            user = UserRepository.get_by_email(db, email)
            
            # Siempre responder positivamente para evitar enumeración de usuarios
            if not user or not user.is_active:
                logger.warning(f"Intento de reset de contraseña para email inexistente/inactivo: {email}")
                return None
            
            # Verificar límite de intentos de reset
            if AuthService._is_reset_locked_out(email):
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
            
            # Registrar intento de reset
            AuthService._record_reset_attempt(email)
            
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
        Verifica si un código de recuperación es válido con protecciones adicionales
        """
        try:
            user = UserRepository.get_by_email(db, email)
            
            if not user or not user.is_active:
                return False
            
            # Verificar límite de intentos de verificación
            if AuthService._is_verification_locked_out(email):
                logger.warning(f"Límite de verificaciones alcanzado para: {email}")
                return False
            
            # Verificar que el código no haya expirado
            if (not user.reset_token_expires or 
                user.reset_token_expires < datetime.utcnow()):
                logger.info(f"Código de reset expirado para: {email}")
                return False
            
            # Verificar código usando hash seguro
            if not user.reset_token or not verify_password(code, user.reset_token):
                AuthService._record_verification_attempt(email)
                logger.warning(f"Código de reset incorrecto para: {email}")
                return False
            
            # Limpiar intentos fallidos tras verificación exitosa
            AuthService._clear_verification_attempts(email)
            
            logger.info(f"Código de reset verificado exitosamente para: {email}")
            return True
            
        except Exception as e:
            logger.error(f"Error al verificar código de reset para {email}: {e}")
            return False
    
    @staticmethod
    def reset_password_with_code(db: Session, email: str, code: str, new_password: str) -> bool:
        """
        Restablece la contraseña mediante código de verificación con validaciones
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
            
            # Invalidar todas las sesiones existentes por seguridad
            AuthService.logout_all_sessions(user.id)
            
            # Limpiar intentos de reset
            AuthService._clear_reset_attempts(email)
            
            logger.info(f"Contraseña restablecida exitosamente para: {email}")
            return True
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error al restablecer contraseña para {email}: {e}")
            return False
    
    # Métodos privados para manejo de límites de intentos
    @staticmethod
    def _is_locked_out(identifier: str) -> bool:
        """Verifica si un usuario/IP está bloqueado por intentos fallidos"""
        current_time = datetime.utcnow()
        
        # Verificar si está en período de bloqueo
        if identifier in AuthService._lockout_time:
            lockout_until = AuthService._lockout_time[identifier]
            if current_time < lockout_until:
                return True
            else:
                # Período de bloqueo expirado, limpiar
                del AuthService._lockout_time[identifier]
                if identifier in AuthService._failed_attempts:
                    del AuthService._failed_attempts[identifier]
        
        return False
    
    @staticmethod
    def _record_failed_attempt(identifier: str):
        """Registra un intento fallido de login"""
        current_time = datetime.utcnow()
        
        if identifier not in AuthService._failed_attempts:
            AuthService._failed_attempts[identifier] = []
        
        # Limpiar intentos antiguos (ventana de 15 minutos)
        cutoff_time = current_time - timedelta(minutes=15)
        AuthService._failed_attempts[identifier] = [
            attempt for attempt in AuthService._failed_attempts[identifier]
            if attempt > cutoff_time
        ]
        
        # Agregar nuevo intento
        AuthService._failed_attempts[identifier].append(current_time)
        
        # Verificar si se alcanzó el límite
        if len(AuthService._failed_attempts[identifier]) >= 5:
            # Bloquear por 30 minutos
            AuthService._lockout_time[identifier] = current_time + timedelta(minutes=30)
            logger.warning(f"Usuario/IP bloqueado por intentos fallidos: {identifier}")
    
    @staticmethod
    def _clear_failed_attempts(identifier: str):
        """Limpia los intentos fallidos después de login exitoso"""
        if identifier in AuthService._failed_attempts:
            del AuthService._failed_attempts[identifier]
        if identifier in AuthService._lockout_time:
            del AuthService._lockout_time[identifier]
    
    @staticmethod
    def _is_reset_locked_out(email: str) -> bool:
        """Verifica límite de intentos de reset de contraseña"""
        # Implementación similar a _is_locked_out pero para resets
        return False  # Simplificado por ahora
    
    @staticmethod
    def _record_reset_attempt(email: str):
        """Registra intento de reset"""
        pass  # Simplificado por ahora
    
    @staticmethod
    def _clear_reset_attempts(email: str):
        """Limpia intentos de reset"""
        pass  # Simplificado por ahora
    
    @staticmethod
    def _is_verification_locked_out(email: str) -> bool:
        """Verifica límite de intentos de verificación de código"""
        return False  # Simplificado por ahora
    
    @staticmethod
    def _record_verification_attempt(email: str):
        """Registra intento de verificación"""
        pass  # Simplificado por ahora
    
    @staticmethod
    def _clear_verification_attempts(email: str):
        """Limpia intentos de verificación"""
        pass  # Simplificado por ahora
    
    # Método de compatibilidad mantenido
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