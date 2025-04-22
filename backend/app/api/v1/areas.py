from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.auth.users import User
from app.schemas.organization.areas import AreaCreate, AreaUpdate, AreaInDB
from app.services.area_service import AreaService
from app.utils.error_handler import ErrorHandler
from app.api.deps import get_current_active_superuser, get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[AreaInDB])
def read_areas(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)  # Añadido control de acceso
) -> Any:
    """
    Obtiene lista de áreas (solo para usuarios autenticados)
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
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Crea una nueva área (solo para superusuarios)
    """
    try:
        area = AreaService.create_area(db=db, area_data=area_in.dict())
        return area
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "crear", "área")

@router.get("/{area_id}", response_model=AreaInDB)
def read_area(
    area_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)  # Añadido control de acceso
) -> Any:
    """
    Obtiene un área específica por ID (solo para usuarios autenticados)
    """
    try:
        area = AreaService.get_area_by_id(db=db, area_id=area_id)
        return area
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "área")

@router.patch("/{area_id}", response_model=AreaInDB)
def update_area(
    area_id: int,
    area_in: AreaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Actualiza un área existente (solo para superusuarios)
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
    area_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Elimina un área (solo para superusuarios)
    """
    try:
        area = AreaService.delete_area(db=db, area_id=area_id)
        return area
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "eliminar", "área")