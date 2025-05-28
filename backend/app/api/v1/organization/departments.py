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
    Puede filtrar por tipo de departamento con el parámetro type_id
    """
    try:
        if type_id:
            departments = DepartmentService.get_departments_by_type(db=db, type_id=type_id, skip=skip, limit=limit)
        else:
            departments = DepartmentService.get_departments_with_type(db=db, skip=skip, limit=limit)
        return departments
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "departamentos")

@router.post("/", response_model=DepartmentInDB)
def create_department(
    department_in: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("department_create"))
) -> Any:
    """
    Crea un nuevo departamento (requiere permiso department_create)
    """
    try:
        department = DepartmentService.create_department(db=db, department_data=department_in.dict())
        return department
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "crear", "departamento")

@router.get("/{department_id}", response_model=DepartmentWithType)
def read_department(
    department_id: int = Path(..., title="ID del departamento"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("department_view"))
) -> Any:
    """
    Obtiene un departamento específico por ID (requiere permiso department_view)
    """
    try:
        department = DepartmentService.get_department_by_id_with_type(db=db, department_id=department_id)
        return department
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "departamento")

@router.patch("/{department_id}", response_model=DepartmentInDB)
def update_department(
    department_id: int = Path(..., title="ID del departamento"),
    department_in: DepartmentUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("department_edit"))
) -> Any:
    """
    Actualiza un departamento existente (requiere permiso department_edit)
    """
    try:
        department = DepartmentService.update_department(
            db=db,
            department_id=department_id,
            department_data=department_in.dict(exclude_unset=True)
        )
        return department
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "actualizar", "departamento")

@router.delete("/{department_id}", response_model=DepartmentInDB)
def delete_department(
    department_id: int = Path(..., title="ID del departamento"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("department_delete"))
) -> Any:
    """
    Elimina un departamento (requiere permiso department_delete)
    """
    try:
        department = DepartmentService.delete_department(db=db, department_id=department_id)
        return department
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "eliminar", "departamento")