# backend/app/api/v1/organization/department_types.py
from app.controllers.organization.department_type_controller import DepartmentTypeController
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status, Path, Body
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.auth.users import User
from app.schemas.organization.departments import DepartmentTypeCreate, DepartmentTypeUpdate, DepartmentTypeInDB
from app.services.organization.department_type_service import DepartmentTypeService
from app.utils.error_handler import ErrorHandler
from app.api.deps import (
    get_current_active_user,
    has_permission,
    has_any_permission
)

router = APIRouter()

@router.get("/", response_model=List[DepartmentTypeInDB])
def read_department_types(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("department_type_view"))
) -> Any:
    """
    Obtiene lista de tipos de departamentos (requiere permiso department_type_view)
    ✅ REFACTORIZADO: Usa DepartmentTypeController
    """
    return DepartmentTypeController.get_department_types_list(db, skip, limit, current_user)

@router.post("/", response_model=DepartmentTypeInDB)
def create_department_type(
    department_type_in: DepartmentTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("department_type_create"))
) -> Any:
    """
    Crea un nuevo tipo de departamento (requiere permiso department_type_create)
    ✅ REFACTORIZADO: Usa DepartmentTypeController
    """
    return DepartmentTypeController.create_department_type(db, department_type_in, current_user)

@router.get("/{type_id}", response_model=DepartmentTypeInDB)
def read_department_type(
    type_id: int = Path(..., title="ID del tipo de departamento"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("department_type_view"))
) -> Any:
    """
    Obtiene un tipo de departamento específico por ID (requiere permiso department_type_view)
    ✅ REFACTORIZADO: Usa DepartmentTypeController
    """
    return DepartmentTypeController.get_department_type_by_id(db, type_id, current_user)

@router.patch("/{type_id}", response_model=DepartmentTypeInDB)
def update_department_type(
    type_id: int = Path(..., title="ID del tipo de departamento"),
    department_type_in: DepartmentTypeUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("department_type_edit"))
) -> Any:
    """
    Actualiza un tipo de departamento existente (requiere permiso department_type_edit)
    ✅ REFACTORIZADO: Usa DepartmentTypeController
    """
    return DepartmentTypeController.update_department_type(db, type_id, department_type_in, current_user)

@router.delete("/{type_id}", response_model=DepartmentTypeInDB)
def delete_department_type(
    type_id: int = Path(..., title="ID del tipo de departamento"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("department_type_delete"))
) -> Any:
    """
    Elimina un tipo de departamento (requiere permiso department_type_delete)
    ✅ REFACTORIZADO: Usa DepartmentTypeController
    """
    return DepartmentTypeController.delete_department_type(db, type_id, current_user)