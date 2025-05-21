# app/services/common/attachment_service.py
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.common.attachments import Attachment
from app.services.common.validation_service import ValidationService

class AttachmentService:
    """
    Servicio para gestionar archivos adjuntos
    """
    
    @staticmethod
    def get_entity_attachments(db: Session, entity_type: str, entity_id: int) -> List[Attachment]:
        """
        Obtiene todos los adjuntos para una entidad específica
        
        Args:
            db: Sesión SQLAlchemy
            entity_type: Tipo de entidad ('project', 'podcast', 'course', etc.)
            entity_id: ID de la entidad
            
        Returns:
            List[Attachment]: Lista de adjuntos
        """
        return db.query(Attachment).filter(
            Attachment.entity_type == entity_type,
            Attachment.entity_id == entity_id,
            Attachment.deleted_at == None
        ).all()
    
    @staticmethod
    def get_attachment_by_id(db: Session, attachment_id: int) -> Optional[Attachment]:
        """
        Obtiene un adjunto por su ID
        
        Args:
            db: Sesión SQLAlchemy
            attachment_id: ID del adjunto
            
        Returns:
            Optional[Attachment]: Adjunto o None si no se encuentra
        """
        return db.query(Attachment).filter(
            Attachment.id == attachment_id,
            Attachment.deleted_at == None
        ).first()
    
    @staticmethod
    def create_attachment(
        db: Session, 
        filename: str,
        original_filename: str,
        file_path: str,
        mime_type: str,
        file_size: int,
        entity_type: str,
        entity_id: int,
        description: str = None,
        uploaded_by: int = None
    ) -> Attachment:
        """
        Crea un nuevo adjunto
        
        Args:
            db: Sesión SQLAlchemy
            filename: Nombre del archivo en el sistema
            original_filename: Nombre original del archivo
            file_path: Ruta al archivo
            mime_type: Tipo MIME
            file_size: Tamaño en bytes
            entity_type: Tipo de entidad
            entity_id: ID de la entidad
            description: Descripción opcional
            uploaded_by: ID del usuario que sube el archivo
            
        Returns:
            Attachment: Adjunto creado
            
        Raises:
            ValueError: Si los datos no son válidos
        """
        # Validar datos
        valid, error = ValidationService.validate_file_size(file_size)
        if not valid:
            raise ValueError(error)
            
        valid, error = ValidationService.validate_mime_type(mime_type)
        if not valid:
            raise ValueError(error)
        
        # Crear adjunto
        attachment = Attachment(
            filename=filename,
            original_filename=original_filename,
            file_path=file_path,
            mime_type=mime_type,
            file_size=file_size,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            uploaded_by=uploaded_by,
            uploaded_at=datetime.utcnow()
        )
        
        db.add(attachment)
        db.commit()
        db.refresh(attachment)
        
        return attachment
    
    @staticmethod
    def update_attachment(db: Session, attachment_id: int, data: Dict[str, Any]) -> Optional[Attachment]:
        """
        Actualiza un adjunto existente
        
        Args:
            db: Sesión SQLAlchemy
            attachment_id: ID del adjunto
            data: Datos a actualizar
            
        Returns:
            Optional[Attachment]: Adjunto actualizado o None si no se encuentra
        """
        attachment = AttachmentService.get_attachment_by_id(db, attachment_id)
        if not attachment:
            return None
            
        for field, value in data.items():
            if field in ['description', 'updated_by_id']:
                setattr(attachment, field, value)
                
        db.commit()
        db.refresh(attachment)
        
        return attachment
    
    @staticmethod
    def delete_attachment(db: Session, attachment_id: int, deleted_by_id: int = None) -> bool:
        """
        Marca un adjunto como eliminado
        
        Args:
            db: Sesión SQLAlchemy
            attachment_id: ID del adjunto
            deleted_by_id: ID del usuario que elimina
            
        Returns:
            bool: True si se marcó como eliminado, False si no se encuentra
        """
        attachment = AttachmentService.get_attachment_by_id(db, attachment_id)
        if not attachment:
            return False
            
        attachment.deleted_at = datetime.utcnow()
        attachment.deleted_by_id = deleted_by_id
        
        db.commit()
        
        return True
    
    @staticmethod
    def is_image(mime_type: str) -> bool:
        """
        Verifica si un tipo MIME corresponde a una imagen
        
        Args:
            mime_type: Tipo MIME
            
        Returns:
            bool: True si es una imagen
        """
        return mime_type.startswith('image/')
    
    @staticmethod
    def is_document(mime_type: str) -> bool:
        """
        Verifica si un tipo MIME corresponde a un documento
        
        Args:
            mime_type: Tipo MIME
            
        Returns:
            bool: True si es un documento
        """
        document_types = [
            'application/pdf', 
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain'
        ]
        return mime_type in document_types

    @staticmethod
    def validate_file_size(size: int) -> int:
        """
        Valida que el tamaño del archivo sea válido
        """
        if size <= 0:
            raise ValueError("El tamaño del archivo debe ser mayor que cero")
        return size

    @staticmethod
    def validate_mime_type(mime: str) -> str:
        """
        Valida que el formato MIME sea válido
        """
        if not mime or not re.match(r'^[a-z]+/[a-z0-9\.\-\+]+$', mime):
            raise ValueError("Formato MIME inválido")
        return mime