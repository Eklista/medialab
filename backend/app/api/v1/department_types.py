# app/api/v1/department_types.py
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.auth.users import User
from app.schemas.organization.departments import DepartmentTypeCreate, DepartmentTypeUpdate, DepartmentTypeInDB
from app.services.department_type_service import DepartmentTypeService
from app.utils.error_handler import ErrorHandler
from app.api.deps import get_current_active_superuser, get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[DepartmentTypeInDB])
def read_department_types(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtiene lista de tipos de departamentos (solo para usuarios autenticados)
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
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Crea un nuevo tipo de departamento (solo para superusuarios)
    """
    try:
        department_type = DepartmentTypeService.create_department_type(db=db, type_data=department_type_in.dict())
        return department_type
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "crear", "tipo de departamento")

@router.get("/{type_id}", response_model=DepartmentTypeInDB)
def read_department_type(
    type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtiene un tipo de departamento específico por ID (solo para usuarios autenticados)
    """
    try:
        department_type = DepartmentTypeService.get_department_type_by_id(db=db, type_id=type_id)
        return department_type
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "tipo de departamento")

@router.patch("/{type_id}", response_model=DepartmentTypeInDB)
def update_department_type(
    type_id: int,
    department_type_in: DepartmentTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Actualiza un tipo de departamento existente (solo para superusuarios)
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
    type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Elimina un tipo de departamento (solo para superusuarios)
    """
    try:
        department_type = DepartmentTypeService.delete_department_type(db=db, type_id=type_id)
        return department_type
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "eliminar", "tipo de departamento")