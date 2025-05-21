# app/services/projects/task_service.py
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.projects.models import Task
from app.models.base import Base

class TaskService:
    """
    Servicio para gestionar tareas de proyectos
    """
    
    @staticmethod
    def get_tasks_for_activity(db: Session, entity: Base, entity_type: str = None) -> List[Task]:
        """
        Obtiene las tareas asociadas a una actividad específica
        
        Args:
            db: Sesión SQLAlchemy
            entity: Instancia de la entidad (RecurrentEvent, SingleEvent, etc.)
            entity_type: Tipo de entidad (opcional, se deriva del nombre de la tabla)
            
        Returns:
            List[Task]: Lista de tareas asociadas
        """
        if not entity_type:
            entity_type = entity.__tablename__
            if entity_type.endswith('s'):
                entity_type = entity_type[:-1]
                
        return db.query(Task).filter(
            Task.activity_entity_type == entity_type,
            Task.activity_entity_id == entity.id
        ).all()
    
    @staticmethod
    def get_tasks_for_project(db: Session, project_id: int) -> List[Task]:
        """
        Obtiene todas las tareas de un proyecto
        
        Args:
            db: Sesión SQLAlchemy
            project_id: ID del proyecto
            
        Returns:
            List[Task]: Lista de tareas del proyecto
        """
        return db.query(Task).filter(Task.project_id == project_id).all()
    
    @staticmethod
    def get_tasks_by_assignee(db: Session, assignee_id: int) -> List[Task]:
        """
        Obtiene todas las tareas asignadas a un usuario
        
        Args:
            db: Sesión SQLAlchemy
            assignee_id: ID del usuario asignado
            
        Returns:
            List[Task]: Lista de tareas asignadas
        """
        return db.query(Task).filter(Task.assignee_id == assignee_id).all()

    @staticmethod
    def validate_progress(value: int) -> int:
        """
        Valida que el porcentaje de progreso esté entre 0 y 100
        """
        if value < 0 or value > 100:
            raise ValueError("El porcentaje de progreso debe estar entre 0 y 100")
        return value