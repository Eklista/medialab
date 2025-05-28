from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status, Path, Body
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.auth.users import User
from app.schemas.organization.departments import DepartmentTypeCreate, DepartmentTypeUpdate, DepartmentTypeInDB
from app.services.department_type_service import DepartmentTypeService
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
    """
    try:
        department_types = DepartmentTypeService.get_department_types(db=db, skip=skip, limit=limit)
        return department_types
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "tipos de departamentos")

@router.post("/", response_model=DepartmentTypeInDB)
def create_department_type(
    department_type_in: DepartmentTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("department_type_create"))
) -> Any:
    """
    Crea un nuevo tipo de departamento (requiere permiso department_type_create)
    """
    try:
        department_type = DepartmentTypeService.create_department_type(db=db, type_data=department_type_in.dict())
        return department_type
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "crear", "tipo de departamento")

@router.get("/{type_id}", response_model=DepartmentTypeInDB)
def read_department_type(
    type_id: int = Path(..., title="ID del tipo de departamento"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("department_type_view"))
) -> Any:
    """
    Obtiene un tipo de departamento específico por ID (requiere permiso department_type_view)
    """
    try:
        department_type = DepartmentTypeService.get_department_type_by_id(db=db, type_id=type_id)
        return department_type
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "tipo de departamento")

@router.patch("/{type_id}", response_model=DepartmentTypeInDB)
def update_department_type(
    type_id: int = Path(..., title="ID del tipo de departamento"),
    department_type_in: DepartmentTypeUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("department_type_edit"))
) -> Any:
    """
    Actualiza un tipo de departamento existente (requiere permiso department_type_edit)
    """
    try:
        department_type = DepartmentTypeService.update_department_type(
            db=db,
            type_id=type_id,
            type_data=department_type_in.dict(exclude_unset=True)
        )
        return department_type
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "actualizar", "tipo de departamento")

@router.delete("/{type_id}", response_model=DepartmentTypeInDB)
def delete_department_type(
    type_id: int = Path(..., title="ID del tipo de departamento"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("department_type_delete"))
) -> Any:
    """
    Elimina un tipo de departamento (requiere permiso department_type_delete)
    """
    try:
        department_type = DepartmentTypeService.delete_department_type(db=db, type_id=type_id)
        return department_type
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "eliminar", "tipo de departamento")