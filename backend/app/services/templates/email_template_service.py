# app/services/email_template_service.py
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.common.email_config import EmailTemplate
from app.repositories.templates.email_template_repository import EmailTemplateRepository
from app.exceptions import ResourceNotFoundException

class EmailTemplateService:
    """
    Servicio para gestionar plantillas de correo electrónico
    """
    
    @staticmethod
    def get_email_templates(db: Session) -> List[Dict[str, Any]]:
        """
        Obtiene todas las plantillas de correo
        """
        templates = EmailTemplateRepository.get_all(db)
        return [EmailTemplateService.template_to_dict(template) for template in templates]
    
    @staticmethod
    def get_template_by_id(db: Session, template_id: int) -> Dict[str, Any]:
        """
        Obtiene una plantilla por su ID
        """
        template = EmailTemplateRepository.get_by_id(db, template_id)
        if not template:
            raise ResourceNotFoundException(f"Plantilla de correo con ID {template_id} no encontrada")
        
        return EmailTemplateService.template_to_dict(template)
    
    @staticmethod
    def get_template_by_code(db: Session, code: str) -> Dict[str, Any]:
        """
        Obtiene una plantilla por su código
        """
        template = EmailTemplateRepository.get_by_code(db, code)
        if not template:
            raise ResourceNotFoundException(f"Plantilla de correo con código '{code}' no encontrada")
        
        return EmailTemplateService.template_to_dict(template)
    
    @staticmethod
    def create_template(db: Session, template_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Crea una nueva plantilla de correo
        """
        # Verificar si ya existe una plantilla con el mismo código
        existing_template = EmailTemplateRepository.get_by_code(db, template_data["code"])
        if existing_template:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe una plantilla con el código '{template_data['code']}'"
            )
        
        template = EmailTemplateRepository.create(db, template_data)
        return EmailTemplateService.template_to_dict(template)
    
    @staticmethod
    def update_template(db: Session, template_id: int, template_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Actualiza una plantilla existente
        """
        template = EmailTemplateRepository.get_by_id(db, template_id)
        if not template:
            raise ResourceNotFoundException(f"Plantilla de correo con ID {template_id} no encontrada")
        
        # Si se está actualizando el código, verificar que no exista otro con ese código
        if "code" in template_data and template_data["code"] != template.code:
            existing_template = EmailTemplateRepository.get_by_code(db, template_data["code"])
            if existing_template:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ya existe una plantilla con el código '{template_data['code']}'"
                )
        
        updated_template = EmailTemplateRepository.update(db, template, template_data)
        return EmailTemplateService.template_to_dict(updated_template)
    
    @staticmethod
    def delete_template(db: Session, template_id: int) -> Dict[str, Any]:
        """
        Elimina una plantilla de correo
        """
        template = EmailTemplateRepository.get_by_id(db, template_id)
        if not template:
            raise ResourceNotFoundException(f"Plantilla de correo con ID {template_id} no encontrada")
        
        deleted_template = EmailTemplateRepository.delete(db, template)
        return EmailTemplateService.template_to_dict(deleted_template)
    
    @staticmethod
    def render_template(db: Session, code: str, context: Dict[str, Any]) -> str:
        """
        Renderiza una plantilla con el contexto proporcionado
        """
        template = EmailTemplateRepository.get_by_code(db, code)
        if not template:
            raise ResourceNotFoundException(f"Plantilla de correo con código '{code}' no encontrada")
        
        try:
            # Usar Jinja2 para renderizar la plantilla con el contexto
            from jinja2 import Template
            jinja_template = Template(template.body_html)
            return jinja_template.render(**context)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al renderizar la plantilla: {str(e)}"
            )
    
    @staticmethod
    def template_to_dict(template: EmailTemplate) -> Dict[str, Any]:
        """
        Convierte un objeto EmailTemplate a un diccionario
        """
        return {
            "id": template.id,
            "code": template.code,
            "name": template.name,
            "subject": template.subject,
            "body_html": template.body_html,
            "description": template.description,
            "available_variables": template.available_variables,
            "category": template.category,
            "is_active": template.is_active
        }

    @staticmethod
    def get_templates_by_category(db: Session, category: str) -> List[Dict[str, Any]]:
        """
        Obtiene todas las plantillas de una categoría específica
        """
        templates = EmailTemplateRepository.get_by_category(db, category)
        return [EmailTemplateService.template_to_dict(template) for template in templates]