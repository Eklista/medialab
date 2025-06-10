# backend/app/controllers/organization/service_controller.py
"""
Controlador para operaciones de servicios
Mueve la lógica de los endpoints sin cambiar el comportamiento
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
import logging

from app.services.organization.service_service import ServiceService
from app.schemas.organization.services import (
    ServiceCreate, ServiceUpdate, ServiceInDB,
    ServiceWithSubServices, SubServiceCreate, SubServiceUpdate, SubServiceInDB
)
from app.utils.error_handler import ErrorHandler

logger = logging.getLogger(__name__)

class ServiceController:
    """
    Controlador para servicios - mantiene la misma lógica que los endpoints
    """
    
    @staticmethod
    def get_services_list(db: Session, skip: int = 0, limit: int = 100, current_user = None) -> List[ServiceWithSubServices]:
        """
        Obtiene lista de servicios con sus sub-servicios
        """
        try:
            services = ServiceService.get_services(db=db, skip=skip, limit=limit)
            return services
        except SQLAlchemyError as e:
            raise ErrorHandler.handle_db_error(e, "obtener", "servicios")
    
    @staticmethod
    def create_service_with_subservices(db: Session, service_in: ServiceCreate, current_user) -> ServiceWithSubServices:
        """
        Crea un nuevo servicio con sus sub-servicios
        Mantiene exactamente la misma lógica del endpoint
        """
        try:
            # Separar datos del servicio y sub-servicios (lógica movida del endpoint)
            sub_services_data = [sub.dict() for sub in service_in.sub_services] if service_in.sub_services else []
            service_data = service_in.dict(exclude={"sub_services"})
            
            service = ServiceService.create_service(
                db=db,
                service_data=service_data,
                sub_services_data=sub_services_data
            )
            return service
        except SQLAlchemyError as e:
            raise ErrorHandler.handle_db_error(e, "crear", "servicio")
    
    @staticmethod
    def get_service_by_id(db: Session, service_id: int, current_user) -> ServiceWithSubServices:
        """
        Obtiene un servicio específico por ID
        """
        try:
            service = ServiceService.get_service_by_id(db=db, service_id=service_id)
            return service
        except SQLAlchemyError as e:
            raise ErrorHandler.handle_db_error(e, "obtener", "servicio")
    
    @staticmethod
    def update_service(db: Session, service_id: int, service_in: ServiceUpdate, current_user) -> ServiceWithSubServices:
        """
        Actualiza un servicio existente
        """
        try:
            service = ServiceService.update_service(
                db=db,
                service_id=service_id,
                service_data=service_in.dict(exclude_unset=True)
            )
            return service
        except SQLAlchemyError as e:
            raise ErrorHandler.handle_db_error(e, "actualizar", "servicio")
    
    @staticmethod
    def delete_service(db: Session, service_id: int, current_user) -> ServiceInDB:
        """
        Elimina un servicio y sus sub-servicios
        """
        try:
            service = ServiceService.delete_service(db=db, service_id=service_id)
            return service
        except SQLAlchemyError as e:
            raise ErrorHandler.handle_db_error(e, "eliminar", "servicio")
    
    @staticmethod
    def add_sub_service(db: Session, service_id: int, sub_service_in: SubServiceCreate, current_user) -> SubServiceInDB:
        """
        Añade un sub-servicio a un servicio existente
        """
        try:
            sub_service = ServiceService.add_sub_service(
                db=db,
                service_id=service_id,
                sub_service_data=sub_service_in.dict()
            )
            return sub_service
        except SQLAlchemyError as e:
            raise ErrorHandler.handle_db_error(e, "crear", "sub-servicio")
    
    @staticmethod
    def update_sub_service(db: Session, sub_service_id: int, sub_service_in: SubServiceUpdate, current_user) -> SubServiceInDB:
        """
        Actualiza un sub-servicio existente
        """
        try:
            sub_service = ServiceService.update_sub_service(
                db=db,
                sub_service_id=sub_service_id,
                sub_service_data=sub_service_in.dict(exclude_unset=True)
            )
            return sub_service
        except SQLAlchemyError as e:
            raise ErrorHandler.handle_db_error(e, "actualizar", "sub-servicio")
    
    @staticmethod
    def delete_sub_service(db: Session, sub_service_id: int, current_user) -> dict:
        """
        Elimina un sub-servicio
        """
        try:
            ServiceService.delete_sub_service(db=db, sub_service_id=sub_service_id)
            return {"message": "Sub-servicio eliminado exitosamente"}
        except SQLAlchemyError as e:
            raise ErrorHandler.handle_db_error(e, "eliminar", "sub-servicio")