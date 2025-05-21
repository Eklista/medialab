# app/services/projects/project_service.py
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session, joinedload

from app.models.projects.models import Project
from app.services.common.link_service import LinkService
from app.services.common.comment_service import CommentService
from app.services.projects.task_service import TaskService

class ProjectService:
    """
    Servicio para gestionar proyectos
    """
    
    @staticmethod
    def get_all_projects(db: Session, skip: int = 0, limit: int = 100, 
                        department_id: Optional[int] = None,
                        is_active: Optional[bool] = True) -> List[Project]:
        """
        Obtiene todos los proyectos con filtros opcionales
        """
        query = db.query(Project).filter(Project.deleted_at == None)
        
        if department_id is not None:
            query = query.filter(Project.department_id == department_id)
            
        if is_active is not None:
            query = query.filter(Project.is_active == is_active)
            
        return query.order_by(Project.created_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_project_by_id(db: Session, project_id: int, with_tasks: bool = False) -> Optional[Project]:
        """
        Obtiene un proyecto por su ID
        """
        query = db.query(Project).filter(
            Project.id == project_id,
            Project.deleted_at == None
        )
        
        if with_tasks:
            query = query.options(joinedload(Project.tasks))
            
        return query.first()
    
    @staticmethod
    def get_project_by_code(db: Session, code: str) -> Optional[Project]:
        """
        Obtiene un proyecto por su código
        """
        return db.query(Project).filter(
            Project.code == code,
            Project.deleted_at == None
        ).first()

    @staticmethod
    def validate_code(code: str) -> str:
        """
        Valida que el código del proyecto sea válido
        """
        if code and not code.strip():
            raise ValueError("El código del proyecto no puede estar vacío")
        return code
    
    @staticmethod
    def create_project(db: Session, project_data: Dict[str, Any]) -> Project:
        """
        Crea un nuevo proyecto
        """
        project = Project(**project_data)
        
        db.add(project)
        db.commit()
        db.refresh(project)
        
        return project
    
    @staticmethod
    def update_project(db: Session, project_id: int, project_data: Dict[str, Any]) -> Optional[Project]:
        """
        Actualiza un proyecto existente
        """
        project = ProjectService.get_project_by_id(db, project_id)
        if not project:
            return None
            
        for key, value in project_data.items():
            setattr(project, key, value)
            
        db.commit()
        db.refresh(project)
        
        return project
    
    @staticmethod
    def delete_project(db: Session, project_id: int, deleted_by_id: Optional[int] = None) -> bool:
        """
        Marca un proyecto como eliminado
        """
        project = ProjectService.get_project_by_id(db, project_id)
        if not project:
            return False
            
        project.deleted_at = datetime.utcnow()
        project.deleted_by_id = deleted_by_id
        
        db.commit()
        
        return True
    
    @staticmethod
    def get_all_project_tasks(db: Session, project_id: int) -> List:
        """
        Obtiene todas las tareas de un proyecto
        """
        from app.models.projects.models import Task
        
        return db.query(Task).filter(
            Task.project_id == project_id,
            Task.deleted_at == None
        ).all()
    
    @staticmethod
    def get_project_comments(db: Session, project_id: int) -> List:
        """
        Obtiene comentarios de un proyecto
        """
        project = ProjectService.get_project_by_id(db, project_id)
        if not project:
            return []
            
        return CommentService.get_entity_comments(db, project)
    
    @staticmethod
    def get_project_links(db: Session, project_id: int) -> List:
        """
        Obtiene enlaces de un proyecto
        """
        project = ProjectService.get_project_by_id(db, project_id)
        if not project:
            return []
            
        return LinkService.get_entity_links(db, project)