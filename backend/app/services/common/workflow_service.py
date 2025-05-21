# app/services/common/workflow_service.py
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.common.workflow import WorkItem

class WorkflowService:
    """
    Servicio para manejar la lógica de flujos de trabajo y estados
    """
    
    @staticmethod
    def is_completed(work_item: WorkItem) -> bool:
        """Verifica si el ítem está completado basado en el estado"""
        return work_item.completed_at is not None
    
    @staticmethod
    def calculate_progress(db: Session, work_item: WorkItem) -> float:
        """
        Calcula el progreso de un elemento de trabajo basado en sus tareas
        """
        # Implementar lógica según el tipo de elemento
        if work_item.entity_type == 'project':
            # Calcular progreso basado en tareas
            pass
        elif work_item.entity_type == 'task':
            # Retornar progreso directo
            return work_item.progress_percentage if hasattr(work_item, 'progress_percentage') else 0
        
        return 0
    
    @staticmethod
    def can_transition_to(db: Session, work_item: WorkItem, target_status_id: int) -> bool:
        """
        Verifica si un elemento puede transicionar a un estado objetivo
        """
        # Implementar lógica de validación de transiciones
        pass