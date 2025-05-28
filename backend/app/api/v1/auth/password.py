# backend/app/api/v1/auth/password.py
"""
Módulo de autenticación - Password API
"""

from typing import Any
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.auth.users import User
from app.api.deps import get_current_user
from app.controllers.auth.password_controller import PasswordController
from app.schemas.auth.password import (
    ForgotPasswordRequest, VerifyCodeRequest, ResetPasswordRequest,
    ChangePasswordRequest, PasswordStrengthRequest
)
from app.config.settings import ENVIRONMENT

router = APIRouter()

@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    req: Request,
    db: Session = Depends(get_db)
) -> Any:
    """
    Envía código de recuperación - REFACTORIZADO
    """
    result = PasswordController.forgot_password(request, req, db)
    
    # Mantener formato original para compatibilidad
    return {
        "message": result.message,
        "details": result.details,
        "expires_in_minutes": result.expires_in_minutes,
        "environment": result.environment
    }

@router.post("/verify-code")
def verify_reset_code(
    request: VerifyCodeRequest,
    req: Request,
    db: Session = Depends(get_db)
) -> Any:
    """
    Verifica código de recuperación - REFACTORIZADO
    """
    result = PasswordController.verify_code(request, req, db)
    
    return {
        "valid": result.valid,
        "message": result.message,
        "email": result.email,
        "next_step": result.next_step
    }

@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    req: Request,
    db: Session = Depends(get_db)
) -> Any:
    """
    Restablece contraseña - REFACTORIZADO
    """
    result = PasswordController.reset_password(request, req, db)
    
    return {
        "message": result.message,
        "email": result.email,
        "success": result.success,
        "next_step": result.next_step,
        "security_note": result.security_note
    }

@router.post("/change-password")
def change_password(
    password_data: ChangePasswordRequest,
    req: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Cambia contraseña autenticado - REFACTORIZADO
    """
    result = PasswordController.change_password(password_data, req, current_user, db)
    
    return {
        "message": result.message,
        "user_id": result.user_id,
        "email": result.email,
        "success": result.success,
        "security_actions": result.security_actions,
        "recommendation": result.recommendation
    }

@router.post("/check-password-strength")
def check_password_strength_endpoint(
    password_data: PasswordStrengthRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Evalúa fortaleza de contraseña - REFACTORIZADO
    """
    result = PasswordController.check_password_strength(password_data, current_user)
    
    return {
        "password_length": result.password_length,
        "score": result.score,
        "strength": result.strength,
        "is_strong": result.is_strong,
        "feedback": result.feedback,
        "recommendations": result.recommendations
    }

@router.post("/request-password-change")
def request_password_change(
    req: Request,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Solicita cambio de contraseña - REFACTORIZADO
    """
    result = PasswordController.request_password_change(req, current_user)
    
    return {
        "message": result.message,
        "user_id": result.user_id,
        "email": result.email,
        "next_steps": result.next_steps,
        "security_note": result.security_note
    }

@router.get("/password-policy")
def get_password_policy(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Política de contraseñas - REFACTORIZADO
    """
    result = PasswordController.get_password_policy(current_user)
    
    return {
        "policy": result.policy,
        "strength_levels": result.strength_levels,
        "recommendations": result.recommendations,
        "security_features": result.security_features
    }