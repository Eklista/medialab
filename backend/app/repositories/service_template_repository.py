# app/repositories/service_template_repository.py
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError

from app.models.organization.service_templates import ServiceTemplate
from app.models.organization.services import Service

class ServiceTemplateRepository:
    """
    Repositorio para operaciones de acceso a datos de plantillas de servicios
    """
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[ServiceTemplate]:
        """
        Obtiene todas las plantillas de servicios
        """
        return db.query(ServiceTemplate).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_public_templates(db: Session, skip: int = 0, limit: int = 100) -> List[ServiceTemplate]:
        """
        Obtiene todas las plantillas de servicios públicas
        """
        return db.query(ServiceTemplate).filter(ServiceTemplate.is_public == True).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, template_id: int) -> Optional[ServiceTemplate]:
        """
        Obtiene una plantilla por su ID
        """
        return db.query(ServiceTemplate).filter(ServiceTemplate.id == template_id).first()
    
    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[ServiceTemplate]:
        """
        Obtiene una plantilla por su nombre
        """
        return db.query(ServiceTemplate).filter(ServiceTemplate.name == name).first()
    
    @staticmethod
    def get_with_services(db: Session, template_id: int) -> Optional[ServiceTemplate]:
        """
        Obtiene una plantilla con sus servicios asociados
        """
        return db.query(ServiceTemplate).options(joinedload(ServiceTemplate.services)).filter(ServiceTemplate.id == template_id).first()
    
    @staticmethod
    def create(db: Session, template_data: dict, service_ids: List[int] = None) -> ServiceTemplate:
        """
        Crea una nueva plantilla con sus servicios asociados
        """
        # Extraer service_ids si existe
        service_ids_data = service_ids or template_data.pop('service_ids', [])
        
        # Crear plantilla
        template = ServiceTemplate(**template_data)
        db.add(template)
        db.flush()  # Para obtener el ID asignado
        
        # Asignar servicios
        if service_ids_data:
            services = db.query(Service).filter(Service.id.in_(service_ids_data)).all()
            template.services = services
        
        db.commit()
        db.refresh(template)
        return template
    
    @staticmethod
    def update(db: Session, template: ServiceTemplate, template_data: dict, service_ids: List[int] = None) -> ServiceTemplate:
        """
        Actualiza una plantilla existente
        """
        # Actualizar campos de la plantilla
        for field, value in template_data.items():
            if field != 'service_ids':
                setattr(template, field, value)
        
        # Actualizar servicios si se proporcionan
        if service_ids is not None:
            services = db.query(Service).filter(Service.id.in_(service_ids)).all()
            template.services = services
        
        db.commit()
        db.refresh(template)
        return template
    
    @staticmethod
    def delete(db: Session, template: ServiceTemplate) -> ServiceTemplate:
        """
        Elimina una plantilla
        """
        db.delete(template)
        db.commit()
        return template