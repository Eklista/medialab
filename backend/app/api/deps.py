from typing import Generator, Optional, List, Callable
from fastapi import Depends, HTTPException, status, Security
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

def has_permission(required_permission: str) -> Callable:
    """
    Verifica si el usuario tiene un permiso específico
    """
    def _has_permission(current_user: User = Security(get_current_active_user)) -> User:
        # Obtener todos los permisos del usuario a través de sus roles
        user_permissions = []
        for role in current_user.roles:
            for permission in role.permissions:
                user_permissions.append(permission.name)
        
        # Verificar si el usuario tiene el permiso requerido o es ADMIN
        is_admin = any(role.name == "ADMIN" for role in current_user.roles)
        
        if required_permission not in user_permissions and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permiso requerido: {required_permission}"
            )
        
        return current_user
    
    return _has_permission

def has_any_permission(permissions: List[str]) -> Callable:
    """
    Verifica si el usuario tiene al menos uno de los permisos especificados
    """
    def _has_any_permission(current_user: User = Security(get_current_active_user)) -> User:
        # Obtener todos los permisos del usuario a través de sus roles
        user_permissions = []
        for role in current_user.roles:
            for permission in role.permissions:
                user_permissions.append(permission.name)
        
        # Verificar si el usuario tiene al menos uno de los permisos requeridos o es ADMIN
        is_admin = any(role.name == "ADMIN" for role in current_user.roles)
        
        if not any(perm in user_permissions for perm in permissions) and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requiere uno de estos permisos: {', '.join(permissions)}"
            )
        
        return current_user
    
    return _has_any_permission

def has_all_permissions(permissions: List[str]) -> Callable:
    """
    Verifica si el usuario tiene todos los permisos especificados
    """
    def _has_all_permissions(current_user: User = Security(get_current_active_user)) -> User:
        # Obtener todos los permisos del usuario a través de sus roles
        user_permissions = []
        for role in current_user.roles:
            for permission in role.permissions:
                user_permissions.append(permission.name)
        
        # Verificar si el usuario tiene todos los permisos requeridos o es ADMIN
        is_admin = any(role.name == "ADMIN" for role in current_user.roles)
        
        if not all(perm in user_permissions for perm in permissions) and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requieren todos estos permisos: {', '.join(permissions)}"
            )
        
        return current_user
    
    return _has_all_permissions

def is_self_or_has_permission(user_id_param: str, required_permission: str) -> Callable:
    """
    Permite acceso si es el propio usuario o tiene un permiso específico
    """
    def _is_self_or_has_permission(
        current_user: User = Security(get_current_active_user),
        user_id: int = None
    ) -> User:
        # Verificar si es el propio usuario
        if user_id and current_user.id == user_id:
            return current_user
        
        # Si no es el propio usuario, verificar permiso
        user_permissions = []
        for role in current_user.roles:
            for permission in role.permissions:
                user_permissions.append(permission.name)
        
        # Verificar si el usuario tiene el permiso requerido o es ADMIN
        is_admin = any(role.name == "ADMIN" for role in current_user.roles)
        
        if required_permission not in user_permissions and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permiso requerido para modificar otros usuarios: {required_permission}"
            )
        
        return current_user
    
    return _is_self_or_has_permission