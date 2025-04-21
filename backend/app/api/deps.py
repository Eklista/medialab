from typing import Generator, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.auth.users import User
from app.config.settings import SECRET_KEY, ALGORITHM
from app.schemas.auth.token import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"/api/v1/auth/login"
)

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    Valida el token y retorna el usuario actual
    """
    try:
        payload = jwt.decode(
            token, SECRET_KEY, algorithms=[ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Eager loading de roles para evitar consultas adicionales
    user = db.query(User).options(joinedload(User.roles)).filter(User.id == int(token_data.sub)).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Valida que el usuario actual esté activo
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )
    return current_user

def get_current_active_superuser(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Valida que el usuario actual sea superusuario
    """
    # Verificar si el usuario tiene el rol de superusuario
    is_superuser = any(role.name == "ADMIN" for role in current_user.roles)
    
    if not is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permisos insuficientes"
        )
    return current_user