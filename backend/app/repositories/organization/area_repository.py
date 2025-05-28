from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.models.organization.areas import Area


class AreaRepository:
    """
    Repositorio para operaciones de acceso a datos de áreas
    """
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Area]:
        """
        Obtiene todas las áreas con paginación
        """
        return db.query(Area).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, area_id: int) -> Optional[Area]:
        """
        Obtiene un área por su ID
        """
        return db.query(Area).filter(Area.id == area_id).first()
    
    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Area]:
        """
        Obtiene un área por su nombre
        """
        return db.query(Area).filter(Area.name == name).first()
    
    @staticmethod
    def create(db: Session, area_data: dict) -> Area:
        """
        Crea una nueva área en la base de datos
        """
        db_area = Area(**area_data)
        db.add(db_area)
        db.commit()
        db.refresh(db_area)
        return db_area
    
    @staticmethod
    def update(db: Session, area: Area, area_data: dict) -> Area:
        """
        Actualiza un área existente
        """
        for field, value in area_data.items():
            setattr(area, field, value)
        
        db.commit()
        db.refresh(area)
        return area
    
    @staticmethod
    def delete(db: Session, area: Area) -> Area:
        """
        Elimina un área
        """
        db.delete(area)
        db.commit()
        return area