from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status, Path, Body
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.auth.users import User
from app.schemas.auth.roles import RoleCreate, RoleUpdate, RoleInDB, RoleWithPermissions
from app.services.role_service import RoleService
from app.utils.error_handler import ErrorHandler
from app.api.deps import (
    get_current_active_user,
    has_permission,
    has_any_permission
)

router = APIRouter()

@router.get("/", response_model=List[RoleInDB])
def read_roles(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("role_view"))
) -> Any:
    """
    Obtiene lista de roles (requiere permiso role_view)
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
    current_user: User = Depends(has_permission("role_create"))
) -> Any:
    """
    Crea un nuevo rol (requiere permiso role_create)
    """
    try:
        role = RoleService.create_role(db=db, role_data=role_in.dict())
        return role
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "crear", "rol")

@router.get("/{role_id}", response_model=RoleWithPermissions)
def read_role(
    role_id: int = Path(..., title="ID del rol"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("role_view"))
) -> Any:
    """
    Obtiene un rol específico por ID (requiere permiso role_view)
    """
    try:
        # Obtener el rol con permisos desde el servicio
        role_db = RoleService.get_role_with_permissions(db=db, role_id=role_id)
        
        role_response = {
            "id": role_db.id,
            "name": role_db.name,
            "description": role_db.description,
            "permissions": [permission.name for permission in role_db.permissions] if role_db.permissions else []
        }
        
        return role_response
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "rol")

@router.patch("/{role_id}", response_model=RoleInDB)
def update_role(
    role_id: int = Path(..., title="ID del rol"),
    role_in: RoleUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("role_edit"))
) -> Any:
    """
    Actualiza un rol existente (requiere permiso role_edit)
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
    role_id: int = Path(..., title="ID del rol"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("role_delete"))
) -> Any:
    """
    Elimina un rol (requiere permiso role_delete)
    """
    try:
        role = RoleService.delete_role(db=db, role_id=role_id)
        return role
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "eliminar", "rol")

@router.post("/{role_id}/permissions", status_code=status.HTTP_200_OK)
def assign_permissions_to_role(
    role_id: int = Path(..., title="ID del rol"),
    permission_ids: List[int] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("role_edit"))
) -> Any:
    """
    Asigna permisos a un rol (requiere permiso role_edit)
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