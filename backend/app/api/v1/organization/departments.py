# backend/app/api/v1/organization/departments.py
from app.controllers.organization.department_controller import DepartmentController
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, Query, status, Path, Body
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.auth.users import User
from app.schemas.organization.departments import DepartmentCreate, DepartmentUpdate, DepartmentInDB, DepartmentWithType
from app.services.organization.department_service import DepartmentService
from app.utils.error_handler import ErrorHandler
from app.api.deps import (
    get_current_active_user,
    has_permission,
    has_any_permission
)

router = APIRouter()

@router.get("/", response_model=List[DepartmentWithType])
def read_departments(
    skip: int = 0,
    limit: int = 100,
    type_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("department_view"))
) -> Any:
    """
    Obtiene lista de departamentos (requiere permiso department_view)
    ✅ REFACTORIZADO: Usa DepartmentController
    """
    return DepartmentController.get_departments_list(db, skip, limit, type_id, current_user)

@router.post("/", response_model=DepartmentInDB)
def create_department(
    department_in: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("department_create"))
) -> Any:
    """
    Crea un nuevo departamento (requiere permiso department_create)
    ✅ REFACTORIZADO: Usa DepartmentController
    """
    return DepartmentController.create_department(db, department_in, current_user)

@router.get("/{department_id}", response_model=DepartmentWithType)
def read_department(
    department_id: int = Path(..., title="ID del departamento"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("department_view"))
) -> Any:
    """
    Obtiene un departamento específico por ID (requiere permiso department_view)
    ✅ REFACTORIZADO: Usa DepartmentController
    """
    return DepartmentController.get_department_by_id(db, department_id, current_user)

@router.patch("/{department_id}", response_model=DepartmentInDB)
def update_department(
    department_id: int = Path(..., title="ID del departamento"),
    department_in: DepartmentUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("department_edit"))
) -> Any:
    """
    Actualiza un departamento existente (requiere permiso department_edit)
    ✅ REFACTORIZADO: Usa DepartmentController
    """
    return DepartmentController.update_department(db, department_id, department_in, current_user)

@router.delete("/{department_id}", response_model=DepartmentInDB)
def delete_department(
    department_id: int = Path(..., title="ID del departamento"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("department_delete"))
) -> Any:
    """
    Elimina un departamento (requiere permiso department_delete)
    ✅ REFACTORIZADO: Usa DepartmentController
    """
    return DepartmentController.delete_department(db, department_id, current_user)