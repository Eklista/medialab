# ===== backend/app/api/v1/security/roles.py =====
"""
Solo routing y validación, lógica delegada al RoleController
"""

from typing import List, Any
from fastapi import APIRouter, Depends, status, Path, Body
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.auth.users import User
from app.schemas.security.roles import RoleCreate, RoleUpdate, RoleInDB, RoleWithPermissions
from app.controllers.security.role_controller import RoleController
from app.api.deps import has_permission

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
    Usa RoleController
    """
    return RoleController.get_roles_list(db, skip, limit, current_user)

@router.post("/", response_model=RoleInDB)
def create_role(
    role_in: RoleCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("role_create"))
) -> Any:
    """
    Crea un nuevo rol (requiere permiso role_create)
    Usa RoleController
    """
    return RoleController.create_new_role(db, role_in, current_user)

@router.get("/{role_id}", response_model=RoleWithPermissions)
def read_role(
    role_id: int = Path(..., title="ID del rol"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("role_view"))
) -> Any:
    """
    Obtiene un rol específico por ID (requiere permiso role_view)
    Usa RoleController
    """
    return RoleController.get_role_by_id(db, role_id, current_user, include_permissions=True)

@router.patch("/{role_id}", response_model=RoleInDB)
def update_role(
    role_id: int = Path(..., title="ID del rol"),
    role_in: RoleUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("role_edit"))
) -> Any:
    """
    Actualiza un rol existente (requiere permiso role_edit)
    Usa RoleController
    """
    return RoleController.update_role(db, role_id, role_in, current_user)

@router.delete("/{role_id}", response_model=RoleInDB)
def delete_role(
    role_id: int = Path(..., title="ID del rol"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("role_delete"))
) -> Any:
    """
    Elimina un rol (requiere permiso role_delete)
    Usa RoleController
    """
    return RoleController.delete_role(db, role_id, current_user)

@router.post("/{role_id}/permissions", status_code=status.HTTP_200_OK)
def assign_permissions_to_role(
    role_id: int = Path(..., title="ID del rol"),
    permission_ids: List[int] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("role_edit"))
) -> Any:
    """
    Asigna permisos a un rol (requiere permiso role_edit)
    Usa RoleController
    """
    return RoleController.assign_permissions_to_role(db, role_id, permission_ids, current_user)