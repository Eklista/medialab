from typing import List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.organization.area_repository import AreaRepository
from app.models.organization.areas import Area


class AreaService:
    """
    Servicio para gestionar lógica de negocio relacionada con áreas
    """
    
    @staticmethod
    def get_areas(db: Session, skip: int = 0, limit: int = 100) -> List[Area]:
        """
        Obtiene lista de áreas
        """
        return AreaRepository.get_all(db, skip, limit)
    
    @staticmethod
    def get_area_by_id(db: Session, area_id: int) -> Area:
        """
        Obtiene área por ID, lanza excepción si no existe
        """
        area = AreaRepository.get_by_id(db, area_id)
        if not area:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Área no encontrada"
            )
        return area
    
    @staticmethod
    def get_area_by_name(db: Session, name: str) -> Area:
        """
        Obtiene área por nombre, lanza excepción si no existe
        """
        area = AreaRepository.get_by_name(db, name)
        if not area:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Área no encontrada"
            )
        return area
    
    @staticmethod
    def create_area(db: Session, area_data: Dict[str, Any]) -> Area:
        """
        Crea una nueva área
        """
        # Verificar si el nombre ya existe
        existing_area = AreaRepository.get_by_name(db, area_data["name"])
        if existing_area:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre del área ya está registrado"
            )
        
        return AreaRepository.create(db, area_data)
    
    @staticmethod
    def update_area(db: Session, area_id: int, area_data: Dict[str, Any]) -> Area:
        """
        Actualiza un área existente
        """
        area = AreaRepository.get_by_id(db, area_id)
        if not area:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Área no encontrada"
            )
        
        # Si se actualiza el nombre, verificar que no exista
        if "name" in area_data and area_data["name"] != area.name:
            existing_area = AreaRepository.get_by_name(db, area_data["name"])
            if existing_area and existing_area.id != area.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El nombre del área ya está registrado"
                )
        
        return AreaRepository.update(db, area, area_data)
    
    @staticmethod
    def delete_area(db: Session, area_id: int) -> Area:
        """
        Elimina un área
        """
        area = AreaRepository.get_by_id(db, area_id)
        if not area:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Área no encontrada"
            )
        
        return AreaRepository.delete(db, area)