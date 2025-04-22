from typing import Generator, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.auth.users import User
from app.services.auth_service import AuthService
from app.utils.error_handler import ErrorHandler

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
        # Verificar token usando el servicio de autenticación
        token_data = AuthService.verify_token(token)
        
        # Obtener usuario con roles
        from app.repositories.user_repository import UserRepository
        user = UserRepository.get_with_roles(db, int(token_data.sub))
        
        if not user:
            raise ErrorHandler.handle_not_found_error(entity="Usuario")
            
        return user
    except Exception as e:
        raise ErrorHandler.handle_authentication_error(e)

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
        raise ErrorHandler.handle_permission_error()
        
    return current_user