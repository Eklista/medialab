# app/repositories/service_template_repository.py
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError

from app.models.organization.service_templates import ServiceTemplate
from app.models.organization.services import Service, SubService

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
    def get_all_with_relations(db: Session, skip: int = 0, limit: int = 100) -> List[ServiceTemplate]:
        """
        Obtiene todas las plantillas con todas sus relaciones cargadas
        """
        return db.query(ServiceTemplate)\
            .options(joinedload(ServiceTemplate.services).joinedload(Service.sub_services))\
            .options(joinedload(ServiceTemplate.subservices))\
            .offset(skip).limit(limit).all()

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
        Obtiene una plantilla con sus servicios y subservicios asociados
        """
        return db.query(ServiceTemplate)\
            .options(joinedload(ServiceTemplate.services))\
            .options(joinedload(ServiceTemplate.subservices))\
            .filter(ServiceTemplate.id == template_id)\
            .first()
    
    @staticmethod
    def create(db: Session, template_data: dict, service_ids: List[int] = None, 
            subservice_ids: List[int] = None) -> ServiceTemplate:
        """
        Crea una nueva plantilla con sus servicios y subservicios asociados
        """
        try:
            # Extraer service_ids si existe
            service_ids_data = service_ids or template_data.pop('service_ids', [])
            
            # Extraer subservice_ids si existe
            subservice_ids_data = subservice_ids or template_data.pop('subservice_ids', [])
            
            print(f"Repository: creating template with data: {template_data}")
            print(f"Repository: service_ids = {service_ids_data}")
            print(f"Repository: subservice_ids = {subservice_ids_data}")
            
            # Crear plantilla
            template = ServiceTemplate(**template_data)
            db.add(template)
            db.flush()  # Para obtener el ID asignado
            
            # Asignar servicios
            if service_ids_data:
                services = db.query(Service).filter(Service.id.in_(service_ids_data)).all()
                template.services = services
            
            # Asignar subservicios
            if subservice_ids_data:
                print(f"Finding subservices with IDs: {subservice_ids_data}")
                from app.models.organization.services import SubService  # Asegúrate de importar SubService
                subservices = db.query(SubService).filter(SubService.id.in_(subservice_ids_data)).all()
                print(f"Found subservices: {[s.id for s in subservices]}")
                template.subservices = subservices
            
            db.commit()
            db.refresh(template)
            return template
        except Exception as e:
            db.rollback()
            print(f"Error in repository create: {str(e)}")
            import traceback
            print(traceback.format_exc())
            raise
    
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