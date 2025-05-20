# app/services/common/audit_service.py
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.security.audit_log import AuditLog

class AuditService:
    """
    Servicio para gestionar logs de auditoría
    """
    
    @staticmethod
    def log_activity(
        db: Session,
        action: str,  # 'create', 'update', 'delete', 'login', etc.
        entity: Any,
        user_id: Optional[int] = None,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[str] = None,
        category: Optional[str] = None,
        importance: Optional[int] = None,
        department_id: Optional[int] = None,
        related_users: Optional[Dict[str, Any]] = None,
        visibility: Optional[str] = None,
        batch_id: Optional[str] = None
    ) -> AuditLog:
        """
        Registra una actividad en el log de auditoría
        
        Args:
            db: Sesión SQLAlchemy
            action: Tipo de acción
            entity: Entidad afectada
            user_id: ID del usuario que realiza la acción
            old_values: Valores antiguos en caso de update
            new_values: Valores nuevos en caso de create/update
            ip_address: Dirección IP
            user_agent: User agent del navegador
            details: Detalles adicionales
            category: Categoría ('content', 'user', 'system', 'workflow')
            importance: Importancia (1-5)
            department_id: ID del departamento relacionado
            related_users: IDs de usuarios relacionados
            visibility: Visibilidad ('dashboard', 'report', 'system')
            batch_id: ID de lote para operaciones relacionadas
            
        Returns:
            AuditLog: Entrada de log creada
        """
        entity_type = entity.__tablename__ if hasattr(entity, '__tablename__') else None
        entity_id = entity.id if hasattr(entity, 'id') else None
        
        log_entry = AuditLog(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            user_id=user_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
            timestamp=datetime.utcnow(),
            details=details,
            category=category or 'system',
            visibility=visibility or 'all',
            importance=importance or 1,
            department_id=department_id,
            related_users=related_users,
            batch_id=batch_id
        )
        
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        
        return log_entry
    
    @staticmethod
    def log_status_change(
        db: Session,
        entity_type: str,
        entity_id: int,
        user_id: int,
        old_status_id: int,
        new_status_id: int,
        old_level: Optional[int] = None,
        new_level: Optional[int] = None
    ) -> AuditLog:
        """
        Registra un cambio de estado en la auditoría
        
        Args:
            db: Sesión SQLAlchemy
            entity_type: Tipo de entidad
            entity_id: ID de la entidad
            user_id: ID del usuario que realiza el cambio
            old_status_id: ID del estado anterior
            new_status_id: ID del nuevo estado
            old_level: Nivel anterior
            new_level: Nuevo nivel
            
        Returns:
            AuditLog: Entrada de log creada
        """
        return AuditService.log_activity(
            db=db,
            action='status_change',
            entity={
                '__tablename__': entity_type,
                'id': entity_id
            },
            user_id=user_id,
            old_values={'status_id': old_status_id, 'level': old_level},
            new_values={'status_id': new_status_id, 'level': new_level},
            action_type='status_change',
            importance=3  # Mayor importancia para cambios de estado
        )
    
    @staticmethod
    def get_audit_logs_for_entity(db: Session, entity_type: str, entity_id: int) -> list:
        """
        Obtiene todos los logs de auditoría para una entidad específica
        
        Args:
            db: Sesión SQLAlchemy
            entity_type: Tipo de entidad
            entity_id: ID de la entidad
            
        Returns:
            list: Lista de logs de auditoría
        """
        return db.query(AuditLog).filter(
            AuditLog.entity_type == entity_type,
            AuditLog.entity_id == entity_id
        ).order_by(AuditLog.timestamp.desc()).all()
    
    @staticmethod
    def get_audit_logs_by_user(db: Session, user_id: int) -> list:
        """
        Obtiene todos los logs de auditoría realizados por un usuario
        
        Args:
            db: Sesión SQLAlchemy
            user_id: ID del usuario
            
        Returns:
            list: Lista de logs de auditoría
        """
        return db.query(AuditLog).filter(
            AuditLog.user_id == user_id
        ).order_by(AuditLog.timestamp.desc()).all()