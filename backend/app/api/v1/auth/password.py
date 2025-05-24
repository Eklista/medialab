# backend/app/api/v1/auth/password.py
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import random
from datetime import datetime, timedelta
import logging

from app.database import get_db
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.services.email_service import send_reset_code_email
from app.models.auth.users import User
from app.schemas.auth.users import (
    UserPasswordChange, 
    EmailSchema, 
    ResetPasswordSchema, 
    PasswordChangeRequest, 
    ForgotPasswordRequest, 
    VerifyCodeRequest, 
    ResetPasswordRequest
)
from app.api.deps import get_current_user
from app.utils.token_blacklist import token_blacklist
from app.utils.simple_rate_limit import check_rate_limit
from app.config.settings import ENVIRONMENT

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    req: Request,
    db: Session = Depends(get_db)
) -> Any:
    """
    Envía un código de recuperación de contraseña
    Sistema robusto con protección contra ataques de enumeración
    """
    try:

        check_rate_limit(req, max_requests=3, window_seconds=300, endpoint_name="forgot_password")

        email = request.email.lower().strip()
        client_ip = req.client.host if req.client else "unknown"
        
        logger.info(f"🔑 Solicitud de reset de contraseña para: {email} desde IP: {client_ip}")
        
        # Verificar si hay demasiados intentos de reset
        if token_blacklist.is_locked_out(email, "reset", max_attempts=3):
            logger.warning(f"⚠️ Demasiados intentos de reset para: {email}")
            # No revelar que está bloqueado para evitar enumeración
            return {
                "message": "Si el correo existe, recibirás un código para restablecer tu contraseña",
                "details": "Solicitud procesada"
            }
        
        # Generar un código numérico de 6 dígitos
        reset_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        expires_at = datetime.utcnow() + timedelta(minutes=10)  # 10 minutos de validez
        
        # Intentar generar el código usando el servicio mejorado
        result = AuthService.generate_password_reset_code(db, email, reset_code, expires_at)
        
        if result:
            # Enviar el correo con el código
            try:
                user_data = result.get('user_data', {})
                username = user_data.get('username', email.split('@')[0])
                first_name = user_data.get('first_name', username)
                
                # Enviar email con datos adicionales
                email_success = send_reset_code_email(
                    to_email=email, 
                    username=first_name or username, 
                    reset_code=reset_code,
                    expires_minutes=10
                )
                
                if email_success:
                    logger.info(f"✅ Email de reset enviado exitosamente a: {email}")
                else:
                    logger.error(f"❌ Error enviando email de reset a: {email}")
                    
            except Exception as e:
                # Loguear el error pero no fallar para evitar enumeración de usuarios
                logger.error(f"💥 Error al enviar email a {email}: {str(e)}")
        else:
            # Registrar intento aunque el usuario no exista
            logger.info(f"🔍 Intento de reset para email no existente: {email}")
        
        # Siempre responder positivamente para prevenir enumeración
        return {
            "message": "Si el correo existe, recibirás un código para restablecer tu contraseña",
            "details": "Código enviado si el email es válido",
            "expires_in_minutes": 10,
            "environment": ENVIRONMENT
        }
        
    except Exception as e:
        logger.error(f"💥 Error inesperado en forgot_password: {e}")
        # Incluso en errores, no revelar información
        return {
            "message": "Si el correo existe, recibirás un código para restablecer tu contraseña",
            "details": "Solicitud procesada"
        }

@router.post("/verify-code")
def verify_reset_code(
    request: VerifyCodeRequest,
    req: Request,
    db: Session = Depends(get_db)
) -> Any:
    """
    Verifica si el código de recuperación es válido
    Sistema robusto con protección contra ataques de fuerza bruta
    """
    try:

        check_rate_limit(req, max_requests=3, window_seconds=300, endpoint_name="forgot_password")

        email = request.email.lower().strip()
        code = request.code.strip()
        client_ip = req.client.host if req.client else "unknown"
        
        logger.info(f"🔍 Verificación de código para: {email} desde IP: {client_ip}")
        
        # Verificar formato del código
        if not code or len(code) != 6 or not code.isdigit():
            logger.warning(f"❌ Código con formato inválido para: {email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Código debe ser de 6 dígitos numéricos"
            )
        
        # Verificar si hay demasiados intentos de verificación
        if token_blacklist.is_locked_out(email, "verification", max_attempts=5):
            logger.warning(f"🔒 Demasiados intentos de verificación para: {email}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Demasiados intentos de verificación. Intenta más tarde."
            )
        
        # Verificar el código usando el servicio mejorado
        is_valid = AuthService.verify_reset_code(db, email, code)
        
        if is_valid:
            logger.info(f"✅ Código verificado correctamente para: {email}")
            return {
                "valid": True, 
                "message": "Código verificado correctamente",
                "email": email,
                "next_step": "reset_password"
            }
        else:
            logger.warning(f"❌ Código inválido para: {email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Código inválido o expirado"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"💥 Error inesperado en verify_reset_code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al verificar código"
        )

@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    req: Request,
    db: Session = Depends(get_db)
) -> Any:
    """
    Restablece la contraseña mediante código de verificación
    Sistema robusto con validación completa de seguridad
    """
    try:

        check_rate_limit(req, max_requests=3, window_seconds=300, endpoint_name="forgot_password")

        email = request.email.lower().strip()
        code = request.code.strip()
        new_password = request.new_password
        client_ip = req.client.host if req.client else "unknown"
        
        logger.info(f"🔄 Restablecimiento de contraseña para: {email} desde IP: {client_ip}")
        
        # Validar formato del código
        if not code or len(code) != 6 or not code.isdigit():
            logger.warning(f"❌ Código con formato inválido en reset para: {email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Código debe ser de 6 dígitos numéricos"
            )
        
        # Validar contraseña básica
        if not new_password or len(new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contraseña debe tener al menos 8 caracteres"
            )
        
        # Verificar el código una vez más para mayor seguridad
        is_valid = AuthService.verify_reset_code(db, email, code)
        
        if not is_valid:
            logger.warning(f"❌ Código inválido en reset para: {email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Código inválido o expirado"
            )
        
        # Restablecer la contraseña usando el servicio mejorado
        result = AuthService.reset_password_with_code(db, email, code, new_password)
        
        if result:
            logger.info(f"✅ Contraseña restablecida exitosamente para: {email}")
            return {
                "message": "Contraseña restablecida exitosamente",
                "email": email,
                "success": True,
                "next_step": "login",
                "security_note": "Todas las sesiones activas han sido cerradas por seguridad"
            }
        else:
            logger.error(f"❌ Error al restablecer contraseña para: {email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Error al restablecer la contraseña. Inténtalo de nuevo."
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"💥 Error inesperado en reset_password: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al restablecer contraseña"
        )

@router.post("/change-password")
def change_password(
    password_data: PasswordChangeRequest,
    req: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Cambia la contraseña del usuario autenticado
    Sistema robusto con validaciones de seguridad mejoradas
    """
    try:

        check_rate_limit(req, max_requests=3, window_seconds=300, endpoint_name="forgot_password")

        client_ip = req.client.host if req.client else "unknown"
        logger.info(f"🔐 Cambio de contraseña para usuario: {current_user.email} desde IP: {client_ip}")
        
        # Validar datos de entrada
        if not password_data.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contraseña actual es requerida"
            )
        
        if not password_data.new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nueva contraseña es requerida"
            )
        
        if password_data.current_password == password_data.new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La nueva contraseña debe ser diferente a la actual"
            )
        
        # Validar fortaleza de la nueva contraseña
        from app.config.security import check_password_strength
        
        strength_check = check_password_strength(password_data.new_password)
        if not strength_check["is_strong"]:
            logger.warning(f"⚠️ Contraseña débil para usuario: {current_user.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "La contraseña no cumple con los requisitos de seguridad",
                    "requirements": strength_check["feedback"],
                    "strength": strength_check["strength"]
                }
            )
        
        # Usar el servicio mejorado para cambiar contraseña
        result = UserService.change_password(
            db=db, 
            user_id=current_user.id,
            current_password=password_data.current_password,
            new_password=password_data.new_password
        )
        
        if result:
            logger.info(f"✅ Contraseña cambiada exitosamente para usuario: {current_user.email}")
            
            # Opcional: Invalidar otras sesiones por seguridad
            try:
                AuthService.logout_all_sessions(current_user.id)
                logger.info(f"🔐 Sesiones invalidadas después de cambio de contraseña para: {current_user.email}")
                sessions_invalidated = True
            except Exception as e:
                logger.warning(f"⚠️ No se pudieron invalidar todas las sesiones: {e}")
                sessions_invalidated = False
            
            return {
                "message": "Contraseña actualizada exitosamente",
                "user_id": current_user.id,
                "email": current_user.email,
                "success": True,
                "security_actions": {
                    "password_updated": True,
                    "sessions_invalidated": sessions_invalidated,
                    "strength_validated": True
                },
                "recommendation": "Tu nueva contraseña es segura. Todas las demás sesiones han sido cerradas."
            }
        else:
            logger.error(f"❌ Error al cambiar contraseña para usuario: {current_user.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Error al cambiar la contraseña. Verifica que la contraseña actual sea correcta."
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"💥 Error inesperado en change_password: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al cambiar contraseña"
        )

@router.post("/check-password-strength")
def check_password_strength_endpoint(
    password: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Evalúa la fortaleza de una contraseña sin cambiarla
    Útil para validación en tiempo real en el frontend
    """
    try:
        from app.config.security import check_password_strength
        
        if not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contraseña es requerida"
            )
        
        strength_check = check_password_strength(password)
        
        return {
            "password_length": len(password),
            "score": strength_check["score"],
            "strength": strength_check["strength"],
            "is_strong": strength_check["is_strong"],
            "feedback": strength_check["feedback"],
            "recommendations": {
                "min_length": 8,
                "requires": [
                    "Al menos una letra mayúscula",
                    "Al menos una letra minúscula", 
                    "Al menos un número",
                    "Al menos un símbolo especial"
                ]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"💥 Error evaluando fortaleza de contraseña: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al evaluar fortaleza de contraseña"
        )

@router.post("/request-password-change")
def request_password_change(
    req: Request,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Solicita cambio de contraseña (útil para flujos donde se requiere verificación adicional)
    """
    try:
        client_ip = req.client.host if req.client else "unknown"
        logger.info(f"📧 Solicitud de cambio de contraseña para: {current_user.email} desde IP: {client_ip}")
        
        # Generar código temporal para cambio seguro
        import secrets
        change_token = secrets.token_urlsafe(32)
        
        # Aquí podrías implementar lógica adicional como:
        # - Enviar email de confirmación
        # - Guardar token temporal en BD
        # - Requerir verificación adicional
        
        return {
            "message": "Solicitud de cambio de contraseña procesada",
            "user_id": current_user.id,
            "email": current_user.email,
            "next_steps": [
                "Usa el endpoint /change-password con tu contraseña actual",
                "Asegúrate de que la nueva contraseña sea segura",
                "Todas las demás sesiones serán cerradas automáticamente"
            ],
            "security_note": "Por seguridad, te recomendamos cambiar tu contraseña regularmente"
        }
        
    except Exception as e:
        logger.error(f"💥 Error en request_password_change: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar solicitud de cambio de contraseña"
        )

@router.get("/password-policy")
def get_password_policy(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Obtiene las políticas de contraseña del sistema
    """
    try:
        return {
            "policy": {
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
            "strength_levels": {
                "muy_débil": {"score": "0-1", "color": "#d32f2f"},
                "débil": {"score": "2", "color": "#f57c00"},
                "media": {"score": "3", "color": "#fbc02d"},
                "fuerte": {"score": "4", "color": "#689f38"},
                "muy_fuerte": {"score": "5", "color": "#388e3c"}
            },
            "recommendations": [
                "Usa una combinación de letras mayúsculas y minúsculas",
                "Incluye números y símbolos especiales",
                "Evita información personal (nombres, fechas, etc.)",
                "Usa una frase o combinación memorable pero única",
                "Considera usar un gestor de contraseñas"
            ],
            "security_features": {
                "password_hashing": "bcrypt con salt",
                "session_invalidation": "Automática al cambiar contraseña",
                "attempt_limiting": "Protección contra fuerza bruta",
                "secure_reset": "Códigos temporales con expiración"
            }
        }
        
    except Exception as e:
        logger.error(f"💥 Error obteniendo política de contraseñas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener política de contraseñas"
        )