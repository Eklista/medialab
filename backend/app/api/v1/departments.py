# app/api/v1/departments.py
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.auth.users import User
from app.schemas.organization.departments import DepartmentCreate, DepartmentUpdate, DepartmentInDB, DepartmentWithType
from app.services.department_service import DepartmentService
from app.utils.error_handler import ErrorHandler
from app.api.deps import get_current_active_superuser, get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[DepartmentWithType])
def read_departments(
    skip: int = 0,
    limit: int = 100,
    type_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtiene lista de departamentos (solo para usuarios autenticados)
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
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Crea un nuevo departamento (solo para superusuarios)
    """
    try:
        department = DepartmentService.create_department(db=db, department_data=department_in.dict())
        return department
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "crear", "departamento")

@router.get("/{department_id}", response_model=DepartmentWithType)
def read_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtiene un departamento específico por ID (solo para usuarios autenticados)
    """
    try:
        department = DepartmentService.get_department_by_id_with_type(db=db, department_id=department_id)
        return department
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "departamento")

@router.patch("/{department_id}", response_model=DepartmentInDB)
def update_department(
    department_id: int,
    department_in: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Actualiza un departamento existente (solo para superusuarios)
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
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Elimina un departamento (solo para superusuarios)
    """
    try:
        department = DepartmentService.delete_department(db=db, department_id=department_id)
        return department
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "eliminar", "departamento")