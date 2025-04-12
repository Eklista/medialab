from datetime import datetime, timedelta
import secrets
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.auth_service import get_user_by_email, get_password_hash
from app.models.auth.users import User
from app.schemas.auth.users import UserPasswordChange
from app.api.deps import get_current_user
from app.config.security import verify_password

router = APIRouter()

@router.post("/forgot-password")
def forgot_password(
    email: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Envía un token de recuperación de contraseña
    """
    user = get_user_by_email(db, email)
    
    # Siempre responder positivamente para evitar enumeración de usuarios
    if not user or not user.is_active:
        return {"message": "Si el correo existe, recibirás instrucciones para restablecer tu contraseña"}
    
    # Generar token de recuperación
    reset_token = secrets.token_urlsafe(32)
    reset_token_expires = datetime.utcnow() + timedelta(hours=24)
    
    # Guardar token en BD
    user.reset_token = reset_token
    user.reset_token_expires = reset_token_expires
    db.commit()
    
    # Aquí se enviaría el email (simulado por ahora)
    reset_url = f"/reset-password/{reset_token}"
    print(f"URL de recuperación para {email}: {reset_url}")
    
    return {"message": "Si el correo existe, recibirás instrucciones para restablecer tu contraseña"}

@router.post("/reset-password/{token}")
def reset_password(
    token: str,
    new_password: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Restablece la contraseña mediante token
    """
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
    user.password_hash = get_password_hash(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    
    return {"message": "Contraseña restablecida exitosamente"}

@router.post("/change-password")
def change_password(
    password_data: UserPasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Cambia la contraseña del usuario autenticado
    """
    # Verificar contraseña actual
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraseña actual incorrecta"
        )
    
    # Actualizar contraseña
    current_user.password_hash = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Contraseña actualizada exitosamente"}