# backend/app/api/v1/auth/login.py
"""
Módulo de autenticación - Login API
"""

from typing import Any
from fastapi import APIRouter, Depends, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.auth.users import User
from app.controllers.auth.login_controller import LoginController
from app.schemas.auth.login import (
    LoginRequest, LoginResponse, RefreshTokenResponse,
    LogoutResponse, LogoutAllResponse, TokenValidationResponse,
    PasswordVerifyRequest, PasswordVerifyResponse
)
from app.config.settings import ACCESS_TOKEN_EXPIRE_MINUTES, ENVIRONMENT

router = APIRouter()

@router.post("/login", response_model=dict)
def login_access_token(
    request: Request,
    response: Response, 
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    Login con cookies httpOnly - REFACTORIZADO
    Mantiene compatibilidad con OAuth2PasswordRequestForm
    """
    # Convertir form_data a LoginRequest para el controller
    login_data = LoginRequest(
        username=form_data.username,
        password=form_data.password
    )
    
    # Delegar al controller
    result = LoginController.login(request, response, login_data, db)
    
    # Mantener formato de respuesta original para compatibilidad
    return {
        "message": result.message,
        "user_id": result.user_id,
        "expires_in": result.expires_in,
        "environment": result.environment
    }

@router.post("/refresh")
def refresh_access_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
) -> Any:
    """
    Renueva access token - REFACTORIZADO
    """
    result = LoginController.refresh_token(request, response, db)
    
    # Mantener formato original
    return {
        "message": result.message,
        "expires_in": result.expires_in
    }

@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Logout con limpieza - REFACTORIZADO
    """
    result = LoginController.logout(request, response, current_user)
    
    return {
        "message": result.message,
        "user": result.user,
        "tokens_blacklisted": result.tokens_blacklisted
    }

@router.post("/logout-all")
def logout_all_sessions(
    response: Response,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Cierra todas las sesiones - REFACTORIZADO
    """
    result = LoginController.logout_all(response, current_user)
    
    return {
        "message": result.message,
        "user": result.user,
        "global_logout": result.global_logout,
        "cookies_cleared": result.cookies_cleared
    }

@router.get("/me")
def get_current_user_info(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Información del usuario actual - SIN CAMBIOS
    """
    try:
        from app.utils.user_transforms import transform_user_with_roles
        return transform_user_with_roles(current_user)
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error al obtener información del usuario {current_user.email}: {e}")
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener información del usuario"
        )

@router.post("/validate-token")
def validate_token(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Valida token actual - REFACTORIZADO
    """
    result = LoginController.validate_token(current_user)
    
    return {
        "valid": result.valid,
        "user_id": result.user_id,
        "email": result.email,
        "expires_in": result.expires_in,
        "environment": result.environment
    }

@router.post("/verify-password")
def verify_current_password(
    password_data: PasswordVerifyRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Verifica contraseña actual - REFACTORIZADO
    """
    result = LoginController.verify_password(password_data, current_user)
    
    return {
        "valid": result.valid,
        "message": result.message
    }

@router.get("/security/status")
def get_security_status(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Estado de seguridad del sistema - MEJORADO
    """
    try:
        from app.services.auth import SecurityService
        
        # Usar el nuevo SecurityService
        security_status = SecurityService.get_system_security_status(current_user.id)
        
        return {
            "user_id": security_status.user_id,
            "environment": security_status.environment,
            "security_features": security_status.security_features,
            "session_info": security_status.session_info,
            "system_health": security_status.system_health
        }
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"💥 Error obteniendo estado de seguridad: {e}")
        
        # Fallback al método original
        from app.services.auth_service import AuthService
        from app.utils.token_blacklist import token_blacklist
        from app.config.settings import COOKIE_SECURE
        
        try:
            security_stats = AuthService.get_security_stats()
            
            return {
                "user_id": current_user.id,
                "environment": ENVIRONMENT,
                "security_features": {
                    "httponly_cookies": True,
                    "secure_cookies": COOKIE_SECURE,
                    "token_blacklist": token_blacklist.enabled,
                    "rate_limiting": security_stats.get("rate_limiting", {}).get("enabled", False),
                    "hybrid_blacklist": True,
                    "jwe_encryption": True
                },
                "session_info": {
                    "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                    "refresh_expires_in": 7 * 24 * 60 * 60,
                    "secure_transport": COOKIE_SECURE
                },
                "system_health": {
                    "redis_available": security_stats.get("token_blacklist", {}).get("redis_available", False),
                    "blacklist_operational": token_blacklist.enabled
                }
            }
        except Exception as fallback_error:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener estado de seguridad"
            )