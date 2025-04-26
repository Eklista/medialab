from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.service_repository import ServiceRepository
from app.models.organization.services import Service, SubService


class ServiceService:
    """
    Servicio para gestionar lógica de negocio relacionada con servicios
    """
    
    @staticmethod
    def get_services(db: Session, skip: int = 0, limit: int = 100) -> List[Service]:
        """
        Obtiene lista de servicios con sus sub-servicios
        """
        return ServiceRepository.get_all(db, skip, limit)
    
    @staticmethod
    def get_service_by_id(db: Session, service_id: int) -> Service:
        """
        Obtiene servicio por ID, lanza excepción si no existe
        """
        service = ServiceRepository.get_by_id(db, service_id)
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Servicio no encontrado"
            )
        return service
    
    @staticmethod
    def get_service_by_name(db: Session, name: str) -> Service:
        """
        Obtiene servicio por nombre, lanza excepción si no existe
        """
        service = ServiceRepository.get_by_name(db, name)
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Servicio no encontrado"
            )
        return service
    
    @staticmethod
    def create_service(db: Session, service_data: Dict[str, Any], sub_services_data: List[Dict[str, Any]] = None) -> Service:
        """
        Crea un nuevo servicio con sus sub-servicios
        """
        # Verificar si el nombre ya existe
        existing_service = ServiceRepository.get_by_name(db, service_data["name"])
        if existing_service:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre del servicio ya está registrado"
            )
        
        return ServiceRepository.create(db, service_data, sub_services_data)
    
    @staticmethod
    def update_service(db: Session, service_id: int, service_data: Dict[str, Any]) -> Service:
        """
        Actualiza un servicio existente
        """
        service = ServiceRepository.get_by_id(db, service_id)
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Servicio no encontrado"
            )
        
        # Si se actualiza el nombre, verificar que no exista
        if "name" in service_data and service_data["name"] != service.name:
            existing_service = ServiceRepository.get_by_name(db, service_data["name"])
            if existing_service and existing_service.id != service.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El nombre del servicio ya está registrado"
                )
        
        return ServiceRepository.update(db, service, service_data)
    
    @staticmethod
    def delete_service(db: Session, service_id: int) -> Service:
        """
        Elimina un servicio y sus sub-servicios
        """
        service = ServiceRepository.get_by_id(db, service_id)
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Servicio no encontrado"
            )
        
        return ServiceRepository.delete(db, service)
    
    @staticmethod
    def add_sub_service(db: Session, service_id: int, sub_service_data: Dict[str, Any]) -> SubService:
        """
        Añade un sub-servicio a un servicio existente
        """
        # Verificar que el servicio existe
        service = ServiceRepository.get_by_id(db, service_id)
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Servicio no encontrado"
            )
        
        return ServiceRepository.add_sub_service(db, service_id, sub_service_data)
    
    @staticmethod
    def update_sub_service(db: Session, sub_service_id: int, sub_service_data: Dict[str, Any]) -> SubService:
        """
        Actualiza un sub-servicio existente
        """
        updated_sub_service = ServiceRepository.update_sub_service(db, sub_service_id, sub_service_data)
        if not updated_sub_service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sub-servicio no encontrado"
            )
        
        return updated_sub_service
    
    @staticmethod
    def delete_sub_service(db: Session, sub_service_id: int) -> bool:
        """
        Elimina un sub-servicio
        """
        result = ServiceRepository.delete_sub_service(db, sub_service_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sub-servicio no encontrado"
            )
        
        return True