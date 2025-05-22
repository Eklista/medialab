# app/repositories/email_template_repository.py
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.models.common.email_config import EmailTemplate

class EmailTemplateRepository:
    """
    Repositorio para operaciones de acceso a datos de plantillas de correo
    """
    
    @staticmethod
    def get_all(db: Session) -> List[EmailTemplate]:
        """
        Obtiene todas las plantillas de correo
        """
        return db.query(EmailTemplate).all()
    
    @staticmethod
    def get_by_id(db: Session, template_id: int) -> Optional[EmailTemplate]:
        """
        Obtiene una plantilla de correo por su ID
        """
        return db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    
    @staticmethod
    def get_by_code(db: Session, code: str) -> Optional[EmailTemplate]:
        """
        Obtiene una plantilla de correo por su código único
        """
        return db.query(EmailTemplate).filter(EmailTemplate.code == code).first()
    
    @staticmethod
    def get_by_category(db: Session, category: str) -> List[EmailTemplate]:
        """
        Obtiene todas las plantillas de una categoría específica
        """
        return db.query(EmailTemplate).filter(EmailTemplate.category == category).all()
    
    @staticmethod
    def create(db: Session, template_data: dict) -> EmailTemplate:
        """
        Crea una nueva plantilla de correo
        """
        db_template = EmailTemplate(**template_data)
        db.add(db_template)
        db.commit()
        db.refresh(db_template)
        return db_template
    
    @staticmethod
    def update(db: Session, template: EmailTemplate, template_data: dict) -> EmailTemplate:
        """
        Actualiza una plantilla de correo existente
        """
        for field, value in template_data.items():
            setattr(template, field, value)
        
        db.commit()
        db.refresh(template)
        return template
    
    @staticmethod
    def delete(db: Session, template: EmailTemplate) -> EmailTemplate:
        """
        Elimina una plantilla de correo
        """
        db.delete(template)
        db.commit()
        return template