# app/api/v1/auth/login.py
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.services.auth_service import authenticate_user, create_tokens, update_user_login
from app.schemas.auth.token import Token
from app.schemas.auth.users import PasswordVerify
from app.models.auth.users import User
from app.config.security import verify_password
from app.api.deps import get_current_user


# Definir esquema para verificación de contraseña
class PasswordVerify(BaseModel):
    password: str

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    Obtiene un token de acceso mediante OAuth2 password flow
    """
    user = authenticate_user(db, form_data.username, form_data.password)
   
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
   
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )
   
    # Actualizar último acceso
    update_user_login(db, user)
   
    # Generar tokens
    tokens = create_tokens(user.id)
   
    return tokens

@router.post("/verify-password")
def verify_password_endpoint(
    password_data: PasswordVerify,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Verifica si la contraseña del usuario es correcta
    """
    is_valid = verify_password(password_data.password, current_user.password_hash)
   
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraseña incorrecta"
        )
   
    return {"valid": True}