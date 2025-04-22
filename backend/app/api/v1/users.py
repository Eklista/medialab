from typing import List, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from sqlalchemy import text, insert

from app.database import get_db
from app.models.auth.users import User, user_roles
from app.models.auth.roles import Role
from app.models.organization.areas import Area
from app.schemas.auth.users import UserCreate, UserUpdate, UserInDB, UserWithRoles
from app.services.user_service import UserService
from app.utils.error_handler import ErrorHandler
from app.utils.user_transforms import transform_user_with_roles
from app.api.deps import get_current_user, get_current_active_superuser, get_current_active_user

router = APIRouter()

@router.get("/me", response_model=UserWithRoles)
def read_current_user(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtiene el usuario actualmente autenticado
    """
    return transform_user_with_roles(current_user)

@router.patch("/me", response_model=UserInDB)
def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Actualiza información del usuario actual
    """
    try:
        updated_user = UserService.update_user(
            db=db,
            user_id=current_user.id,
            user_data=user_data.dict(exclude_unset=True)
        )
        return updated_user
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "actualizar", "usuario")

@router.get("/", response_model=List[UserWithRoles])
def read_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db)
) -> Any:
    """
    Obtiene lista de usuarios (solo para superusuarios)
    """
    try:
        users = UserService.get_users(db=db, skip=skip, limit=limit)
        return [transform_user_with_roles(user) for user in users]
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "usuarios")

@router.post("/", response_model=UserInDB, status_code=status.HTTP_201_CREATED)
def create_new_user(
    user_in: UserCreate,
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db)
) -> Any:
    """
    Crea un nuevo usuario (solo para superusuarios)
    """
    try:
        # Extraer los datos básicos de usuario
        user_data = user_in.dict(exclude={"roleId", "areaId"})
        
        # Crear el usuario
        new_user = UserService.create_user(db=db, user_data=user_data)
        
        # Si se proporcionaron roleId y areaId, asignar el rol
        if hasattr(user_in, "roleId") and hasattr(user_in, "areaId") and user_in.roleId and user_in.areaId:
            try:
                UserService.assign_role(
                    db=db,
                    user_id=new_user.id,
                    role_id=int(user_in.roleId),
                    area_id=int(user_in.areaId)
                )
            except Exception as role_error:
                # Logear el error pero continuar
                # Este enfoque sería mejorado posteriormente
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error al asignar rol: {str(role_error)}")
        
        return new_user
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "crear", "usuario")

@router.get("/{user_id}", response_model=UserWithRoles)
def read_user_by_id(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Obtiene un usuario por ID
    """
    try:
        user = UserService.get_user_by_id(db=db, user_id=user_id)
        
        # Solo superusuarios pueden ver otros usuarios
        # Verificar roles en lugar de atributo is_superuser
        is_superuser = any(role.name == "ADMIN" for role in current_user.roles)
        if user.id != current_user.id and not is_superuser:
            raise ErrorHandler.handle_permission_error()
        
        return transform_user_with_roles(user)
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "usuario")

@router.patch("/{user_id}", response_model=UserInDB)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db)
) -> Any:
    """
    Actualiza información de un usuario (solo para superusuarios)
    """
    try:
        updated_user = UserService.update_user(
            db=db,
            user_id=user_id,
            user_data=user_data.dict(exclude_unset=True)
        )
        return updated_user
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "actualizar", "usuario")

@router.delete("/{user_id}", response_model=UserInDB)
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db)
) -> Any:
    """
    Elimina un usuario (solo para superusuarios)
    """
    try:
        if user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puedes eliminar tu propio usuario"
            )
            
        deleted_user = UserService.delete_user(db=db, user_id=user_id)
        return deleted_user
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "eliminar", "usuario")

@router.post("/{user_id}/roles", status_code=status.HTTP_200_OK)
def assign_role_to_user(
    user_id: int,
    roleId: str = Body(...),
    areaId: str = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Asigna un rol a un usuario (solo para superusuarios)
    """
    try:
        # Primero obtener el usuario para poder usar full_name en la respuesta
        user = UserService.get_user_by_id(db=db, user_id=user_id)
        
        success = UserService.assign_role(
            db=db,
            user_id=user_id,
            role_id=int(roleId),
            area_id=int(areaId)
        )
        
        if success:
            return {"message": f"Rol asignado exitosamente al usuario {user.full_name}"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al asignar rol"
            )
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "asignar rol a", "usuario")