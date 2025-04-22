from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.auth.users import User
from app.schemas.auth.roles import RoleCreate, RoleUpdate, RoleInDB, RoleWithPermissions
from app.services.role_service import RoleService
from app.utils.error_handler import ErrorHandler
from app.api.deps import get_current_active_superuser

router = APIRouter()

@router.get("/", response_model=List[RoleInDB])
def read_roles(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Obtiene lista de roles (solo para superusuarios)
    """
    try:
        roles = RoleService.get_roles(db=db, skip=skip, limit=limit)
        return roles
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "roles")

@router.post("/", response_model=RoleInDB)
def create_role(
    role_in: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Crea un nuevo rol (solo para superusuarios)
    """
    try:
        role = RoleService.create_role(db=db, role_data=role_in.dict())
        return role
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "crear", "rol")

@router.get("/{role_id}", response_model=RoleWithPermissions)
def read_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Obtiene un rol específico por ID (solo para superusuarios)
    """
    try:
        role = RoleService.get_role_with_permissions(db=db, role_id=role_id)
        return role
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "rol")

@router.patch("/{role_id}", response_model=RoleInDB)
def update_role(
    role_id: int,
    role_in: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Actualiza un rol existente (solo para superusuarios)
    """
    try:
        role = RoleService.update_role(
            db=db,
            role_id=role_id,
            role_data=role_in.dict(exclude_unset=True)
        )
        return role
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "actualizar", "rol")

@router.delete("/{role_id}", response_model=RoleInDB)
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Elimina un rol (solo para superusuarios)
    """
    try:
        role = RoleService.delete_role(db=db, role_id=role_id)
        return role
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "eliminar", "rol")

@router.post("/{role_id}/permissions", status_code=status.HTTP_200_OK)
def assign_permissions_to_role(
    role_id: int,
    permission_ids: List[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Asigna permisos a un rol (solo para superusuarios)
    """
    try:
        success = RoleService.assign_permissions(
            db=db,
            role_id=role_id,
            permission_ids=permission_ids
        )
        
        if success:
            return {"message": "Permisos asignados exitosamente"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al asignar permisos"
            )
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "asignar permisos a", "rol")