# app/services/common/status_service.py
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.common.workflow import Status, StatusHistory, WorkItem

class StatusService:
    """
    Servicio para gestionar estados y cambios de estado
    """
    
    @staticmethod
    def get_statuses_by_entity_type(db: Session, entity_type: str) -> List[Status]:
        """
        Obtiene todos los estados para un tipo de entidad
        
        Args:
            db: Sesión SQLAlchemy
            entity_type: Tipo de entidad ('project', 'task', etc.)
            
        Returns:
            List[Status]: Lista de estados
        """
        return db.query(Status).filter(
            Status.entity_type == entity_type
        ).order_by(Status.level, Status.order).all()
    
    @staticmethod
    def get_status_by_id(db: Session, status_id: int) -> Optional[Status]:
        """
        Obtiene un estado por su ID
        
        Args:
            db: Sesión SQLAlchemy
            status_id: ID del estado
            
        Returns:
            Optional[Status]: Estado o None si no se encuentra
        """
        return db.query(Status).filter(Status.id == status_id).first()
    
    @staticmethod
    def get_initial_status(db: Session, entity_type: str) -> Optional[Status]:
        """
        Obtiene el estado inicial para un tipo de entidad
        
        Args:
            db: Sesión SQLAlchemy
            entity_type: Tipo de entidad ('project', 'task', etc.)
            
        Returns:
            Optional[Status]: Estado inicial o None si no hay estados definidos
        """
        return db.query(Status).filter(
            Status.entity_type == entity_type,
            Status.is_initial == True
        ).first()
    
    @staticmethod
    def get_final_statuses(db: Session, entity_type: str) -> List[Status]:
        """
        Obtiene los estados finales para un tipo de entidad
        
        Args:
            db: Sesión SQLAlchemy
            entity_type: Tipo de entidad ('project', 'task', etc.)
            
        Returns:
            List[Status]: Lista de estados finales
        """
        return db.query(Status).filter(
            Status.entity_type == entity_type,
            Status.is_final == True
        ).all()
    
    @staticmethod
    def change_status(db: Session, work_item: WorkItem, new_status_id: int, 
                     changed_by_id: int = None, comment: str = None) -> StatusHistory:
        """
        Cambia el estado de un elemento de trabajo y registra el historial
        
        Args:
            db: Sesión SQLAlchemy
            work_item: Instancia de WorkItem (Project, Task, etc.)
            new_status_id: ID del nuevo estado
            changed_by_id: ID del usuario que realiza el cambio
            comment: Comentario opcional
            
        Returns:
            StatusHistory: Registro del cambio de estado
            
        Raises:
            ValueError: Si el nuevo estado no se encuentra
        """
        # Obtener el nuevo estado
        new_status = StatusService.get_status_by_id(db, new_status_id)
        if not new_status:
            raise ValueError(f"Estado no encontrado: {new_status_id}")
            
        # Crear registro de historial
        history = StatusHistory(
            entity_id=work_item.id,
            entity_type=work_item.entity_type,
            old_status_id=work_item.status_id,
            new_status_id=new_status_id,
            old_level=work_item.level,
            new_level=new_status.level,
            changed_by_id=changed_by_id,
            change_date=datetime.utcnow(),
            comment=comment
        )
        
        # Actualizar el estado del elemento
        old_status_id = work_item.status_id
        work_item.status_id = new_status_id
        work_item.level = new_status.level
        
        # Si es un estado final, establecer completed_at
        final_statuses = StatusService.get_final_statuses(db, work_item.entity_type)
        final_status_ids = [s.id for s in final_statuses]
        
        if new_status_id in final_status_ids and not work_item.completed_at:
            work_item.completed_at = datetime.utcnow()
        elif old_status_id in final_status_ids and work_item.completed_at and new_status_id not in final_status_ids:
            # Si se está moviendo de un estado final a uno no final, eliminar completed_at
            work_item.completed_at = None
        
        db.add(history)
        db.commit()
        db.refresh(history)
        
        return history
    
    @staticmethod
    def get_status_history(db: Session, entity_type: str, entity_id: int) -> List[StatusHistory]:
        """
        Obtiene el historial de cambios de estado para una entidad
        
        Args:
            db: Sesión SQLAlchemy
            entity_type: Tipo de entidad ('project', 'task', etc.)
            entity_id: ID de la entidad
            
        Returns:
            List[StatusHistory]: Historial de cambios de estado
        """
        return db.query(StatusHistory).filter(
            StatusHistory.entity_type == entity_type,
            StatusHistory.entity_id == entity_id
        ).order_by(StatusHistory.change_date.desc()).all()