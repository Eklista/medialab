from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status, Path, Body
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.auth.users import User
from app.schemas.organization.areas import AreaCreate, AreaUpdate, AreaInDB
from app.services.area_service import AreaService
from app.utils.error_handler import ErrorHandler
from app.api.deps import (
    get_current_active_user,
    has_permission,
    has_any_permission
)

router = APIRouter()

@router.get("/", response_model=List[AreaInDB])
def read_areas(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("area_view"))
) -> Any:
    """
    Obtiene lista de áreas (requiere permiso area_view)
    """
    try:
        areas = AreaService.get_areas(db=db, skip=skip, limit=limit)
        return areas
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "áreas")

@router.post("/", response_model=AreaInDB)
def create_area(
    area_in: AreaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("area_create"))
) -> Any:
    """
    Crea una nueva área (requiere permiso area_create)
    """
    try:
        area = AreaService.create_area(db=db, area_data=area_in.dict())
        return area
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "crear", "área")

@router.get("/{area_id}", response_model=AreaInDB)
def read_area(
    area_id: int = Path(..., title="ID del área"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("area_view"))
) -> Any:
    """
    Obtiene un área específica por ID (requiere permiso area_view)
    """
    try:
        area = AreaService.get_area_by_id(db=db, area_id=area_id)
        return area
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "área")

@router.patch("/{area_id}", response_model=AreaInDB)
def update_area(
    area_id: int = Path(..., title="ID del área"),
    area_in: AreaUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("area_edit"))
) -> Any:
    """
    Actualiza un área existente (requiere permiso area_edit)
    """
    try:
        area = AreaService.update_area(
            db=db,
            area_id=area_id,
            area_data=area_in.dict(exclude_unset=True)
        )
        return area
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "actualizar", "área")

@router.delete("/{area_id}", response_model=AreaInDB)
def delete_area(
    area_id: int = Path(..., title="ID del área"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("area_delete"))
) -> Any:
    """
    Elimina un área (requiere permiso area_delete)
    """
    try:
        area = AreaService.delete_area(db=db, area_id=area_id)
        return area
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "eliminar", "área")