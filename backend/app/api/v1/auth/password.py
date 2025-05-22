from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import random
from datetime import datetime, timedelta

from app.database import get_db
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.services.email_service import send_reset_code_email
from app.models.auth.users import User
from app.schemas.auth.users import UserPasswordChange, EmailSchema, ResetPasswordSchema, PasswordChangeRequest, ForgotPasswordRequest, VerifyCodeRequest, ResetPasswordRequest
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Envía un código de recuperación de contraseña
    """
    email = request.email
    
    # Generar un código numérico de 6 dígitos
    reset_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    expires_at = datetime.utcnow() + timedelta(minutes=5)  # 5 minutos de validez
    
    result = AuthService.generate_password_reset_code(db, email, reset_code, expires_at)
    
    if result:
        # Enviar el correo con el código
        try:
            user_data = result.get('user_data', {})
            username = user_data.get('username', email.split('@')[0])
            send_reset_code_email(email, username, reset_code)
        except Exception as e:
            # Loguear el error pero no fallar para evitar enumeración de usuarios
            print(f"Error al enviar email a {email}: {str(e)}")
    
    # Siempre responder positivamente
    return {"message": "Si el correo existe, recibirás un código para restablecer tu contraseña"}

@router.post("/verify-code")
def verify_reset_code(
    request: VerifyCodeRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Verifica si el código de recuperación es válido
    """
    email = request.email
    code = request.code
    
    is_valid = AuthService.verify_reset_code(db, email, code)
    
    if is_valid:
        return {"valid": True, "message": "Código verificado correctamente"}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido o expirado"
        )

@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Restablece la contraseña mediante código de verificación
    """
    email = request.email
    code = request.code
    new_password = request.new_password
    
    # Verificar el código una vez más para mayor seguridad
    is_valid = AuthService.verify_reset_code(db, email, code)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido o expirado"
        )
    
    # Restablecer la contraseña
    result = AuthService.reset_password_with_code(db, email, code, new_password)
    
    if result:
        return {"message": "Contraseña restablecida exitosamente"}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al restablecer la contraseña"
        )

@router.post("/change-password")
def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Cambia la contraseña del usuario autenticado
    """
    result = UserService.change_password(
        db=db, 
        user_id=current_user.id,
        current_password=password_data.current_password,
        new_password=password_data.new_password
    )
    
    if result:
        return {"message": "Contraseña actualizada exitosamente"}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al cambiar la contraseña"
        )