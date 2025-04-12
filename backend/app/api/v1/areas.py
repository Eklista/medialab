from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.organization.areas import Area
from app.models.auth.users import User
from app.schemas.organization.areas import AreaCreate, AreaUpdate, AreaInDB
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
    areas = db.query(Area).offset(skip).limit(limit).all()
    return areas

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
        db_area = Area(**area_in.dict())
        db.add(db_area)
        db.commit()
        db.refresh(db_area)
        return db_area
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear área: {str(e)}"
        )

@router.get("/{area_id}", response_model=AreaInDB)
def read_area(
    area_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)  # Añadido control de acceso
) -> Any:
    """
    Obtiene un área específica por ID (solo para usuarios autenticados)
    """
    area = db.query(Area).filter(Area.id == area_id).first()
    if not area:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Área no encontrada"
        )
    return area

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
        area = db.query(Area).filter(Area.id == area_id).first()
        if not area:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Área no encontrada"
            )
        
        for field, value in area_in.dict(exclude_unset=True).items():
            setattr(area, field, value)
        
        db.commit()
        db.refresh(area)
        return area
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar área: {str(e)}"
        )

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
        area = db.query(Area).filter(Area.id == area_id).first()
        if not area:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Área no encontrada"
            )
        
        db.delete(area)
        db.commit()
        return area
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar área: {str(e)}"
        )