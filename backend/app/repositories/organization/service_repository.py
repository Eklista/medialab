from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError

from app.models.organization.services import Service, SubService


class ServiceRepository:
    """
    Repositorio para operaciones de acceso a datos de servicios
    """
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Service]:
        """
        Obtiene todos los servicios con sus sub-servicios
        """
        return db.query(Service).options(joinedload(Service.sub_services)).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, service_id: int) -> Optional[Service]:
        """
        Obtiene un servicio por su ID, junto con sus sub-servicios
        """
        return db.query(Service).options(joinedload(Service.sub_services)).filter(Service.id == service_id).first()
    
    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Service]:
        """
        Obtiene un servicio por su nombre
        """
        return db.query(Service).filter(Service.name == name).first()
    
    @staticmethod
    def create(db: Session, service_data: dict, sub_services_data: List[dict] = None) -> Service:
        """
        Crea un nuevo servicio con sus sub-servicios
        """
        # Crear el servicio
        db_service = Service(**service_data)
        db.add(db_service)
        db.flush()  # Para obtener el ID asignado
        
        # Crear sub-servicios si se proporcionan
        if sub_services_data:
            for sub_service_data in sub_services_data:
                db_sub_service = SubService(**sub_service_data, service_id=db_service.id)
                db.add(db_sub_service)
        
        db.commit()
        db.refresh(db_service)
        return db_service
    
    @staticmethod
    def update(db: Session, service: Service, service_data: dict) -> Service:
        """
        Actualiza un servicio existente
        """
        for field, value in service_data.items():
            setattr(service, field, value)
        
        db.commit()
        db.refresh(service)
        return service
    
    @staticmethod
    def delete(db: Session, service: Service) -> Service:
        """
        Elimina un servicio
        """
        db.delete(service)
        db.commit()
        return service
    
    @staticmethod
    def add_sub_service(db: Session, service_id: int, sub_service_data: dict) -> SubService:
        """
        Añade un sub-servicio a un servicio existente
        """
        db_sub_service = SubService(**sub_service_data, service_id=service_id)
        db.add(db_sub_service)
        db.commit()
        db.refresh(db_sub_service)
        return db_sub_service
    
    @staticmethod
    def update_sub_service(db: Session, sub_service_id: int, sub_service_data: dict) -> Optional[SubService]:
        """
        Actualiza un sub-servicio existente
        """
        db_sub_service = db.query(SubService).filter(SubService.id == sub_service_id).first()
        if not db_sub_service:
            return None
            
        for field, value in sub_service_data.items():
            setattr(db_sub_service, field, value)
            
        db.commit()
        db.refresh(db_sub_service)
        return db_sub_service
    
    @staticmethod
    def delete_sub_service(db: Session, sub_service_id: int) -> bool:
        """
        Elimina un sub-servicio
        """
        db_sub_service = db.query(SubService).filter(SubService.id == sub_service_id).first()
        if not db_sub_service:
            return False
            
        db.delete(db_sub_service)
        db.commit()
        return True