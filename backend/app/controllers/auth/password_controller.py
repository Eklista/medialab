# backend/app/controllers/auth/password_controller.py
"""
Versión limpia que usa PasswordService especializado
"""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import logging

from app.database import get_db
from app.models.auth.users import User
from app.api.deps import get_current_user
from app.services.auth import PasswordService, SecurityService
from app.schemas.auth.password import (
    ForgotPasswordRequest, ForgotPasswordResponse,
    VerifyCodeRequest, VerifyCodeResponse,
    ResetPasswordRequest, ResetPasswordResponse,
    ChangePasswordRequest, ChangePasswordResponse,
    PasswordStrengthRequest, PasswordStrengthResponse,
    PasswordChangeRequestResponse, PasswordPolicyResponse
)

logger = logging.getLogger(__name__)
router = APIRouter()

class PasswordController:
    """
    Controlador refactorizado para gestión de contraseñas
    Usa PasswordService para toda la lógica de negocio
    """
    
    @staticmethod
    def forgot_password(
        request: ForgotPasswordRequest,
        req: Request,
        db: Session
    ) -> ForgotPasswordResponse:
        """
        Solicita recuperación de contraseña usando PasswordService
        """
        try:
            # 1. Verificar rate limiting usando SecurityService
            rate_limit_info = SecurityService.check_rate_limit(
                req, max_requests=3, window_seconds=300, endpoint="forgot_password"
            )
            
            if not rate_limit_info.allowed:
                logger.warning(f"🚦 Rate limit excedido para forgot password")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Demasiadas solicitudes. Inténtalo más tarde.",
                    headers={"Retry-After": str(rate_limit_info.retry_after)}
                )
            
            # 2. Procesar solicitud usando PasswordService
            client_ip = req.client.host if req.client else "unknown"
            return PasswordService.request_password_reset(db, request.email, client_ip)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error en forgot_password: {e}")
            # No revelar errores internos
            return ForgotPasswordResponse(
                message="Si el correo existe, recibirás un código para restablecer tu contraseña",
                details="Solicitud procesada",
                expires_in_minutes=10,
                environment="secure"
            )
    
    @staticmethod
    def verify_code(
        request: VerifyCodeRequest,
        req: Request,
        db: Session
    ) -> VerifyCodeResponse:
        """
        Verifica código de recuperación usando PasswordService
        """
        try:
            # 1. Verificar rate limiting
            rate_limit_info = SecurityService.check_rate_limit(
                req, max_requests=5, window_seconds=300, endpoint="verify_code"
            )
            
            if not rate_limit_info.allowed:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Demasiados intentos de verificación",
                    headers={"Retry-After": str(rate_limit_info.retry_after)}
                )
            
            # 2. Verificar código usando PasswordService
            client_ip = req.client.host if req.client else "unknown"
            return PasswordService.verify_reset_code(db, request.email, request.code, client_ip)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error en verify_code: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al verificar código"
            )
    
    @staticmethod
    def reset_password(
        request: ResetPasswordRequest,
        req: Request,
        db: Session
    ) -> ResetPasswordResponse:
        """
        Restablece contraseña usando PasswordService
        """
        try:
            # 1. Verificar rate limiting
            rate_limit_info = SecurityService.check_rate_limit(
                req, max_requests=3, window_seconds=300, endpoint="reset_password"
            )
            
            if not rate_limit_info.allowed:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Demasiados intentos de reset",
                    headers={"Retry-After": str(rate_limit_info.retry_after)}
                )
            
            # 2. Restablecer contraseña usando PasswordService
            client_ip = req.client.host if req.client else "unknown"
            return PasswordService.reset_password_with_code(
                db, request.email, request.code, request.new_password, client_ip
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error en reset_password: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al restablecer contraseña"
            )
    
    @staticmethod
    def change_password(
        password_data: ChangePasswordRequest,
        req: Request,
        current_user: User,
        db: Session
    ) -> ChangePasswordResponse:
        """
        Cambia contraseña de usuario autenticado usando PasswordService
        """
        try:
            # 1. Verificar rate limiting
            rate_limit_info = SecurityService.check_rate_limit(
                req, max_requests=3, window_seconds=300, endpoint="change_password"
            )
            
            if not rate_limit_info.allowed:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Demasiados intentos de cambio",
                    headers={"Retry-After": str(rate_limit_info.retry_after)}
                )
            
            # 2. Cambiar contraseña usando PasswordService
            client_ip = req.client.host if req.client else "unknown"
            return PasswordService.change_password(
                db, current_user.id, 
                password_data.current_password, 
                password_data.new_password, 
                client_ip
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error en change_password: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al cambiar contraseña"
            )
    
    @staticmethod
    def check_password_strength(
        password_data: PasswordStrengthRequest,
        current_user: User
    ) -> PasswordStrengthResponse:
        """
        Evalúa fortaleza de contraseña usando PasswordService
        """
        try:
            return PasswordService.check_password_strength(password_data.password)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error evaluando fortaleza: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al evaluar fortaleza de contraseña"
            )
    
    @staticmethod
    def request_password_change(
        req: Request,
        current_user: User
    ) -> PasswordChangeRequestResponse:
        """
        Solicita cambio de contraseña (para flujos que requieren verificación adicional)
        """
        try:
            client_ip = req.client.host if req.client else "unknown"
            logger.info(f"📧 Solicitud de cambio de contraseña para: {current_user.email} desde IP: {client_ip}")
            
            return PasswordChangeRequestResponse(
                message="Solicitud de cambio de contraseña procesada",
                user_id=current_user.id,
                email=current_user.email,
                next_steps=[
                    "Usa el endpoint /change-password con tu contraseña actual",
                    "Asegúrate de que la nueva contraseña sea segura",
                    "Todas las demás sesiones serán cerradas automáticamente"
                ],
                security_note="Por seguridad, te recomendamos cambiar tu contraseña regularmente"
            )
            
        except Exception as e:
            logger.error(f"💥 Error en request_password_change: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al procesar solicitud de cambio de contraseña"
            )
    
    @staticmethod
    def get_password_policy(current_user: User) -> PasswordPolicyResponse:
        """
        Obtiene política de contraseñas usando PasswordService
        """
        try:
            return PasswordService.get_password_policy()
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error obteniendo política: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener política de contraseñas"
            )

# ===== ENDPOINTS USANDO EL CONTROLADOR =====

@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password_endpoint(
    request: ForgotPasswordRequest,
    req: Request,
    db: Session = Depends(get_db)
) -> Any:
    """
    🆕 Forgot password endpoint refactorizado
    """
    return PasswordController.forgot_password(request, req, db)

@router.post("/verify-code", response_model=VerifyCodeResponse)
def verify_code_endpoint(
    request: VerifyCodeRequest,
    req: Request,
    db: Session = Depends(get_db)
) -> Any:
    """
    🆕 Verify code endpoint refactorizado
    """
    return PasswordController.verify_code(request, req, db)

@router.post("/reset-password", response_model=ResetPasswordResponse)
def reset_password_endpoint(
    request: ResetPasswordRequest,
    req: Request,
    db: Session = Depends(get_db)
) -> Any:
    """
    🆕 Reset password endpoint refactorizado
    """
    return PasswordController.reset_password(request, req, db)

@router.post("/change-password", response_model=ChangePasswordResponse)
def change_password_endpoint(
    password_data: ChangePasswordRequest,
    req: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    🆕 Change password endpoint refactorizado
    """
    return PasswordController.change_password(password_data, req, current_user, db)

@router.post("/check-password-strength", response_model=PasswordStrengthResponse)
def check_password_strength_endpoint(
    password_data: PasswordStrengthRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    🆕 Check password strength endpoint refactorizado
    """
    return PasswordController.check_password_strength(password_data, current_user)

@router.post("/request-password-change", response_model=PasswordChangeRequestResponse)
def request_password_change_endpoint(
    req: Request,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    🆕 Request password change endpoint refactorizado
    """
    return PasswordController.request_password_change(req, current_user)

@router.get("/password-policy", response_model=PasswordPolicyResponse)
def get_password_policy_endpoint(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    🆕 Password policy endpoint refactorizado
    """
    return PasswordController.get_password_policy(current_user)