# app/services/content_audit_service.py
from app.models.security.audit_log import AuditLog
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import json

class ContentAuditService:
    """
    Servicio para manejar auditoría de contenido multimedia
    """
    
    @staticmethod
    def log_content_action(
        db: Session,
        action: str,  # 'create', 'update', 'delete', 'publish', 'unpublish'
        content_id: str,
        user_id: int,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        details: Optional[str] = None,
        department_id: Optional[int] = None
    ):
        """
        Registra una acción en el audit log para contenido
        """
        audit_entry = AuditLog(
            action=action,
            entity_type='content',
            entity_id=content_id,
            user_id=user_id,
            old_values=old_values,
            new_values=new_values,
            details=details,
            category='content',
            department_id=department_id,
            importance=3 if action in ['publish', 'delete'] else 1
        )
        
        db.add(audit_entry)
        db.commit()
        
    @staticmethod
    def log_video_action(
        db: Session,
        action: str,
        video_id: str,
        content_id: str,
        user_id: int,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None
    ):
        """
        Registra acciones específicas de videos
        """
        audit_entry = AuditLog(
            action=f"video_{action}",
            entity_type='video',
            entity_id=video_id,
            user_id=user_id,
            old_values=old_values,
            new_values=new_values,
            details=f"Video action on content {content_id}",
            category='content',
            importance=2
        )
        
        db.add(audit_entry)
        db.commit()
        
    @staticmethod
    def log_photo_action(
        db: Session,
        action: str,
        photo_id: str,
        content_id: str,
        user_id: int,
        photo_count: Optional[int] = None
    ):
        """
        Registra acciones de fotos/galerías
        """
        details = f"Photo action on content {content_id}"
        if photo_count:
            details += f" (total photos: {photo_count})"
            
        audit_entry = AuditLog(
            action=f"photo_{action}",
            entity_type='photo',
            entity_id=photo_id,
            user_id=user_id,
            details=details,
            category='content',
            importance=1
        )
        
        db.add(audit_entry)
        db.commit()