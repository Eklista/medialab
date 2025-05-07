# app/services/service_template_service.py
from typing import List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.service_template_repository import ServiceTemplateRepository
from app.models.organization.service_templates import ServiceTemplate

class ServiceTemplateService:
    """
    Servicio para gestionar lógica de negocio relacionada con plantillas de servicios
    """
    
    @staticmethod
    def get_templates(db: Session, skip: int = 0, limit: int = 100) -> List[ServiceTemplate]:
        """
        Obtiene lista de plantillas
        """
        return ServiceTemplateRepository.get_all(db, skip, limit)
    
    @staticmethod
    def get_public_templates(db: Session, skip: int = 0, limit: int = 100) -> List[ServiceTemplate]:
        """
        Obtiene lista de plantillas públicas
        """
        return ServiceTemplateRepository.get_public_templates(db, skip, limit)
    
    @staticmethod
    def get_template_by_id(db: Session, template_id: int) -> ServiceTemplate:
        """
        Obtiene plantilla por ID, lanza excepción si no existe
        """
        template = ServiceTemplateRepository.get_by_id(db, template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plantilla no encontrada"
            )
        return template
    
    @staticmethod
    def get_template_with_services(db: Session, template_id: int) -> ServiceTemplate:
        """
        Obtiene plantilla con servicios cargados, lanza excepción si no existe
        """
        template = ServiceTemplateRepository.get_with_services(db, template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plantilla no encontrada"
            )
        return template
    
    @staticmethod
    def create_template(db: Session, template_data: Dict[str, Any]) -> ServiceTemplate:
        """
        Crea una nueva plantilla
        """
        # Verificamos si ya existe una plantilla con ese nombre
        existing_template = ServiceTemplateRepository.get_by_name(db, template_data["name"])
        if existing_template:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe una plantilla con ese nombre"
            )
        
        # Extraer service_ids antes de pasar los datos al repositorio
        service_ids = template_data.pop('service_ids', [])
        
        # Crear la plantilla
        return ServiceTemplateRepository.create(db, template_data, service_ids)
        
    @staticmethod
    def update_template(db: Session, template_id: int, template_data: Dict[str, Any]) -> ServiceTemplate:
        """
        Actualiza una plantilla existente
        """
        template = ServiceTemplateRepository.get_by_id(db, template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plantilla no encontrada"
            )
        
        # Si se actualiza el nombre, verificar que no exista
        if "name" in template_data and template_data["name"] != template.name:
            existing_template = ServiceTemplateRepository.get_by_name(db, template_data["name"])
            if existing_template and existing_template.id != template.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe una plantilla con ese nombre"
                )
        
        # Extraer service_ids si existe
        service_ids = template_data.pop('service_ids', None)
        
        return ServiceTemplateRepository.update(db, template, template_data, service_ids)
        
    @staticmethod
    def delete_template(db: Session, template_id: int) -> ServiceTemplate:
        """
        Elimina una plantilla
        """
        template = ServiceTemplateRepository.get_by_id(db, template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plantilla no encontrada"
            )
        
        return ServiceTemplateRepository.delete(db, template)