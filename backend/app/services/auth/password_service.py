# backend/app/services/auth/password_service.py
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import secrets
import logging

from app.repositories.auth.auth_repository import AuthRepository
from app.repositories.users.user_repository import UserRepository
from app.config.security import (
    create_password_hash, verify_password, check_password_strength
)
from app.utils.token_blacklist import token_blacklist
from app.schemas.auth.password import (
    ForgotPasswordResponse, VerifyCodeResponse, ResetPasswordResponse,
    ChangePasswordResponse, PasswordStrengthResponse, PasswordPolicyResponse
)

logger = logging.getLogger(__name__)

class PasswordService:
    """
    Servicio especializado para gestión de contraseñas
    Separa toda la lógica de contraseñas del AuthService general
    """
    
    # ===== RECUPERACIÓN DE CONTRASEÑA =====
    
    @staticmethod
    def request_password_reset(db: Session, email: str, client_ip: str = "unknown") -> ForgotPasswordResponse:
        """
        Procesa solicitud de recuperación de contraseña
        """
        try:
            email = email.lower().strip()
            
            logger.info(f"🔑 Solicitud de reset de contraseña para: {email} desde IP: {client_ip}")
            
            # Verificar rate limiting usando token_blacklist
            if token_blacklist.is_locked_out(email, "reset", max_attempts=3):
                logger.warning(f"⚠️ Demasiados intentos de reset para: {email}")
                # No revelar que está bloqueado para evitar enumeración
                return ForgotPasswordResponse(
                    message="Si el correo existe, recibirás un código para restablecer tu contraseña",
                    details="Solicitud procesada",
                    expires_in_minutes=10,
                    environment="production"  # No revelar environment real
                )
            
            # Generar código numérico de 6 dígitos
            reset_code = f"{secrets.randbelow(1000000):06d}"
            expires_at = datetime.utcnow() + timedelta(minutes=10)
            
            # Obtener usuario (sin revelar si existe o no)
            user = AuthRepository.get_user_by_email_active(db, email)
            
            if user:
                # Guardar código hasheado
                hashed_code = create_password_hash(reset_code)
                success = AuthRepository.save_reset_code(db, user.id, hashed_code, expires_at)
                
                if success:
                    # Enviar email con código
                    try:
                        from app.services.communication.email_service import send_reset_code_email
                        
                        email_success = send_reset_code_email(
                            email_to=email,
                            username=user.first_name or user.username,
                            code=reset_code  # Parámetro correcto: code
                        )
                        
                        if email_success:
                            logger.info(f"✅ Código de reset enviado a: {email}")
                        else:
                            logger.error(f"❌ Error enviando email a: {email}")
                            
                    except Exception as email_error:
                        logger.error(f"💥 Error enviando email: {email_error}")
                else:
                    logger.error(f"❌ Error guardando código de reset para: {email}")
            else:
                # Usuario no existe, pero registrar intento para prevenir enumeración
                token_blacklist.record_failed_attempt(email, "reset")
                logger.info(f"🔍 Intento de reset para email inexistente: {email}")
            
            # Siempre responder positivamente para prevenir enumeración
            return ForgotPasswordResponse(
                message="Si el correo existe, recibirás un código para restablecer tu contraseña",
                details="Código enviado si el email es válido",
                expires_in_minutes=10,
                environment="secure"  # No revelar environment real
            )
            
        except Exception as e:
            logger.error(f"💥 Error en request_password_reset: {e}")
            # Incluso en errores, no revelar información
            return ForgotPasswordResponse(
                message="Si el correo existe, recibirás un código para restablecer tu contraseña",
                details="Solicitud procesada",
                expires_in_minutes=10,
                environment="secure"
            )
    
    @staticmethod
    def verify_reset_code(db: Session, email: str, code: str, client_ip: str = "unknown") -> VerifyCodeResponse:
        """
        Verifica código de recuperación de contraseña
        """
        try:
            email = email.lower().strip()
            code = code.strip()
            
            logger.info(f"🔍 Verificación de código para: {email} desde IP: {client_ip}")
            
            # Validar formato del código
            if not code or len(code) != 6 or not code.isdigit():
                logger.warning(f"❌ Código con formato inválido para: {email}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Código debe ser de 6 dígitos numéricos"
                )
            
            # Verificar rate limiting
            if token_blacklist.is_locked_out(email, "verification", max_attempts=5):
                logger.warning(f"🔒 Demasiados intentos de verificación para: {email}")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Demasiados intentos de verificación. Intenta más tarde."
                )
            
            # Obtener usuario con código de reset válido
            user = AuthRepository.get_user_by_reset_code(db, email)
            
            if not user or not user.reset_token:
                token_blacklist.record_failed_attempt(email, "verification")
                logger.warning(f"❌ No hay código de reset válido para: {email}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Código inválido o expirado"
                )
            
            # Verificar código usando hash seguro
            if not verify_password(code, user.reset_token):
                token_blacklist.record_failed_attempt(email, "verification")
                logger.warning(f"❌ Código incorrecto para: {email}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Código inválido o expirado"
                )
            
            # Limpiar intentos fallidos tras verificación exitosa
            token_blacklist.clear_failed_attempts(email, "verification")
            
            logger.info(f"✅ Código verificado correctamente para: {email}")
            
            return VerifyCodeResponse(
                valid=True,
                message="Código verificado correctamente",
                email=email,
                next_step="reset_password"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error en verify_reset_code: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al verificar código"
            )
    
    @staticmethod
    def reset_password_with_code(db: Session, email: str, code: str, new_password: str, client_ip: str = "unknown") -> ResetPasswordResponse:
        """
        Restablece contraseña usando código de verificación
        """
        try:
            email = email.lower().strip()
            code = code.strip()
            
            logger.info(f"🔄 Restablecimiento de contraseña para: {email} desde IP: {client_ip}")
            
            # Validaciones básicas
            if not code or len(code) != 6 or not code.isdigit():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Código debe ser de 6 dígitos numéricos"
                )
            
            if not new_password or len(new_password) < 8:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La contraseña debe tener al menos 8 caracteres"
                )
            
            # Verificar fortaleza de la nueva contraseña
            strength_check = check_password_strength(new_password)
            if not strength_check["is_strong"]:
                logger.warning(f"⚠️ Contraseña débil para usuario: {email}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"La contraseña no cumple con los requisitos de seguridad: {', '.join(strength_check['feedback'])}"
                )
            
            # Verificar código una vez más
            user = AuthRepository.get_user_by_reset_code(db, email)
            
            if not user or not user.reset_token or not verify_password(code, user.reset_token):
                logger.warning(f"❌ Código inválido en reset para: {email}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Código inválido o expirado"
                )
            
            # Actualizar contraseña con tracking
            password_hash = create_password_hash(new_password)
            success = AuthRepository.update_password_with_tracking(db, user.id, password_hash)
            
            if not success:
                logger.error(f"❌ Error actualizando contraseña para: {email}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error al actualizar contraseña"
                )
            
            # Invalidar todas las sesiones del usuario por seguridad
            try:
                token_blacklist.blacklist_all_user_tokens(user.id)
                logger.info(f"🔐 Sesiones invalidadas para usuario: {email}")
            except Exception as invalidation_error:
                logger.warning(f"⚠️ No se pudieron invalidar todas las sesiones: {invalidation_error}")
            
            # Limpiar intentos fallidos
            token_blacklist.clear_failed_attempts(email, "reset")
            token_blacklist.clear_failed_attempts(email, "verification")
            
            # Log de auditoría (usar nueva sesión para evitar conflictos)
            try:
                from app.database import get_db
                audit_db = next(get_db())
                try:
                    AuthRepository.log_security_event(
                        db=audit_db,
                        user_id=user.id,
                        event_type="password_reset_success",
                        details={"email": email, "method": "code_verification"},
                        ip_address=client_ip
                    )
                finally:
                    audit_db.close()
            except Exception as log_error:
                logger.warning(f"⚠️ Error en log de auditoría (no crítico): {log_error}")
            
            logger.info(f"✅ Contraseña restablecida exitosamente para: {email}")
            
            return ResetPasswordResponse(
                message="Contraseña restablecida exitosamente",
                email=email,
                success=True,
                next_step="login",
                security_note="Todas las sesiones activas han sido cerradas por seguridad"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error en reset_password_with_code: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al restablecer contraseña"
            )
    
    # ===== CAMBIO DE CONTRASEÑA AUTENTICADO =====
    
    @staticmethod
    def change_password(db: Session, user_id: int, current_password: str, new_password: str, client_ip: str = "unknown") -> ChangePasswordResponse:
        """
        Cambia contraseña de usuario autenticado
        """
        try:
            user = UserRepository.get_by_id(db, user_id)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Usuario no encontrado"
                )
            
            logger.info(f"🔐 Cambio de contraseña para usuario: {user.email} desde IP: {client_ip}")
            
            # Validaciones
            if not current_password:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Contraseña actual es requerida"
                )
            
            if not new_password:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Nueva contraseña es requerida"
                )
            
            if current_password == new_password:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La nueva contraseña debe ser diferente a la actual"
                )
            
            # Verificar contraseña actual
            if not verify_password(current_password, user.password_hash):
                logger.warning(f"❌ Contraseña actual incorrecta para: {user.email}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Contraseña actual incorrecta"
                )
            
            # Validar fortaleza de nueva contraseña
            strength_check = check_password_strength(new_password)
            if not strength_check["is_strong"]:
                logger.warning(f"⚠️ Nueva contraseña débil para usuario: {user.email}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"La contraseña no cumple con los requisitos de seguridad: {', '.join(strength_check['feedback'])}"
                )
            
            # Actualizar contraseña
            password_hash = create_password_hash(new_password)
            success = AuthRepository.update_password_with_tracking(db, user.id, password_hash)
            
            if not success:
                logger.error(f"❌ Error actualizando contraseña para: {user.email}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error al actualizar contraseña"
                )
            
            # Invalidar otras sesiones por seguridad
            sessions_invalidated = False
            try:
                sessions_invalidated = token_blacklist.blacklist_all_user_tokens(user.id)
                logger.info(f"🔐 Sesiones invalidadas después de cambio de contraseña para: {user.email}")
            except Exception as e:
                logger.warning(f"⚠️ No se pudieron invalidar todas las sesiones: {e}")
            
            # Log de auditoría (usar nueva sesión para evitar conflictos)
            try:
                from app.database import get_db
                audit_db = next(get_db())
                try:
                    AuthRepository.log_security_event(
                        db=audit_db,
                        user_id=user.id,
                        event_type="password_change_success",
                        details={"method": "authenticated_change"},
                        ip_address=client_ip
                    )
                finally:
                    audit_db.close()
            except Exception as log_error:
                logger.warning(f"⚠️ Error en log de auditoría (no crítico): {log_error}")
            
            logger.info(f"✅ Contraseña cambiada exitosamente para usuario: {user.email}")
            
            return ChangePasswordResponse(
                message="Contraseña actualizada exitosamente",
                user_id=user.id,
                email=user.email,
                success=True,
                security_actions={
                    "password_updated": True,
                    "sessions_invalidated": sessions_invalidated,
                    "strength_validated": True
                },
                recommendation="Tu nueva contraseña es segura. Todas las demás sesiones han sido cerradas."
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error en change_password: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al cambiar contraseña"
            )
    
    # ===== VALIDACIÓN Y POLÍTICAS =====
    
    @staticmethod
    def check_password_strength(password: str) -> PasswordStrengthResponse:
        """
        Evalúa la fortaleza de una contraseña
        """
        try:
            if not password:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Contraseña es requerida"
                )
            
            strength_check = check_password_strength(password)
            
            return PasswordStrengthResponse(
                password_length=len(password),
                score=strength_check["score"],
                strength=strength_check["strength"],
                is_strong=strength_check["is_strong"],
                feedback=strength_check["feedback"],
                recommendations={
                    "min_length": 8,
                    "requires": [
                        "Al menos una letra mayúscula",
                        "Al menos una letra minúscula",
                        "Al menos un número",
                        "Al menos un símbolo especial"
                    ]
                }
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error evaluando fortaleza de contraseña: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al evaluar fortaleza de contraseña"
            )
    
    @staticmethod
    def get_password_policy() -> PasswordPolicyResponse:
        """
        Obtiene las políticas de contraseña del sistema
        """
        try:
            return PasswordPolicyResponse(
                policy={
                    "min_length": 8,
                    "max_length": 128,
                    "require_uppercase": True,
                    "require_lowercase": True,
                    "require_numbers": True,
                    "require_special_chars": True,
                    "forbidden_patterns": [
                        "No puede ser igual al email",
                        "No puede contener el nombre de usuario",
                        "No puede ser una contraseña común",
                        "No puede ser igual a la contraseña anterior"
                    ]
                },
                strength_levels={
                    "muy_débil": {"score": "0-1", "color": "#d32f2f"},
                    "débil": {"score": "2", "color": "#f57c00"},
                    "media": {"score": "3", "color": "#fbc02d"},
                    "fuerte": {"score": "4", "color": "#689f38"},
                    "muy_fuerte": {"score": "5", "color": "#388e3c"}
                },
                recommendations=[
                    "Usa una combinación de letras mayúsculas y minúsculas",
                    "Incluye números y símbolos especiales",
                    "Evita información personal (nombres, fechas, etc.)",
                    "Usa una frase o combinación memorable pero única",
                    "Considera usar un gestor de contraseñas"
                ],
                security_features={
                    "password_hashing": "bcrypt con salt",
                    "session_invalidation": "Automática al cambiar contraseña",
                    "attempt_limiting": "Protección contra fuerza bruta",
                    "secure_reset": "Códigos temporales con expiración"
                }
            )
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo política de contraseñas: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener política de contraseñas"
            )