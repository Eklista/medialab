# app/models/projects/models.py
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship, validates
from datetime import datetime
import sqlalchemy as sa

from app.models.base import Base
from app.models.common.workflow import WorkItem

class Project(WorkItem):
    """
    Proyectos de trabajo
    """
    __tablename__ = 'projects'
    
    id = Column(Integer, ForeignKey('work_items.id'), primary_key=True)
    code = Column(String(20), unique=True, nullable=True)  # Código de proyecto
    
    # Clasificación
    activity_type_id = Column(Integer, ForeignKey('activity_types.id'), nullable=False)
    
    # Fechas específicas
    start_date = Column(DateTime, nullable=True)
    
    # Cliente
    client_id = Column(Integer, nullable=True)
    department_id = Column(Integer, ForeignKey('departments.id'), nullable=True)
    
    # Flags
    is_recurrent = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Relaciones
    activity_type = relationship("ActivityType")
    department = relationship("Department")
    tasks = relationship("Task", back_populates="project")
    
    # Relación con solicitud (si proviene de una)
    request_id = Column(Integer, ForeignKey('requests.id'), nullable=True)
    originating_request = relationship("Request", foreign_keys=[request_id], back_populates="project")
    
    # Configuración del mapper
    __mapper_args__ = {
        'polymorphic_identity': 'project',
    }
    
    # Índices
    __table_args__ = (
        sa.Index('idx_project_code', 'code'),
        sa.Index('idx_project_activity_type', 'activity_type_id'),
        sa.Index('idx_project_department', 'department_id'),
        sa.Index('idx_project_client', 'client_id'),
        sa.Index('idx_project_is_active', 'is_active'),
        sa.Index('idx_project_request', 'request_id')
    )
    
    @validates('code')
    def validate_code(self, key, code):
        if code and not code.strip():
            raise ValueError("El código del proyecto no puede estar vacío")
        return code
    
    @property
    def links(self):
        """
        Obtiene los enlaces asociados a este proyecto
        """
        from sqlalchemy.orm import object_session
        from app.models.communications.links import Link
        
        session = object_session(self)
        if not session:
            return []
        
        return session.query(Link).filter(
            Link.entity_type == 'project',
            Link.entity_id == self.id
        ).all()
    
    @property
    def all_links(self):
        """
        Obtiene todos los enlaces asociados a este proyecto y sus tareas
        """
        from sqlalchemy.orm import object_session
        from app.models.communications.links import Link
        
        session = object_session(self)
        if not session:
            return []
        
        # Enlaces directos del proyecto
        project_links = session.query(Link).filter(
            Link.entity_type == 'project',
            Link.entity_id == self.id
        ).all()
        
        # Enlaces de todas las tareas del proyecto
        task_ids = [task.id for task in self.tasks]
        task_links = [] if not task_ids else session.query(Link).filter(
            Link.entity_type == 'task',
            Link.entity_id.in_(task_ids)
        ).all()
        
        return project_links + task_links
    
    def add_link(self, session, url, platform_id=None, title=None, description=None, created_by=None):
        """
        Añade un enlace a este proyecto
        
        Args:
            session: Sesión SQLAlchemy
            url: URL del enlace
            platform_id: ID de la plataforma (opcional)
            title: Título del enlace (opcional)
            description: Descripción del enlace (opcional)
            created_by: ID del usuario que crea el enlace (opcional)
            
        Returns:
            Link: Instancia del enlace creado
        """
        from app.models.communications.links import Link
        return Link.create_for_entity(
            session, self, url, platform_id, title, description, created_by
        )
    
    def __repr__(self):
        return f"<Project(id={self.id}, title='{self.title}', code='{self.code}')>"


class Task(WorkItem):
    """
    Tareas de un proyecto
    """
    __tablename__ = 'tasks'
    
    id = Column(Integer, ForeignKey('work_items.id'), primary_key=True)
    
    # Relación con proyecto
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=False)
    project = relationship("Project", back_populates="tasks")
    
    # Clasificación
    activity_type_id = Column(Integer, ForeignKey('activity_types.id'), nullable=True)
    activity_type = relationship("ActivityType")
    
    # Asignación
    assignee_id = Column(Integer, nullable=True)
    
    # Fechas específicas
    start_date = Column(DateTime, nullable=True)
    
    # Progreso
    progress_percentage = Column(Integer, default=0)
    
    # Configuración del mapper
    __mapper_args__ = {
        'polymorphic_identity': 'task',
    }
    
    # Índices
    __table_args__ = (
        sa.Index('idx_task_project', 'project_id'),
        sa.Index('idx_task_activity_type', 'activity_type_id'),
        sa.Index('idx_task_assignee', 'assignee_id')
    )
    
    @validates('progress_percentage')
    def validate_progress(self, key, value):
        if value < 0 or value > 100:
            raise ValueError("El porcentaje de progreso debe estar entre 0 y 100")
        return value
    
    @property
    def links(self):
        """
        Obtiene los enlaces asociados a esta tarea
        """
        from sqlalchemy.orm import object_session
        from app.models.communications.links import Link
        
        session = object_session(self)
        if not session:
            return []
        
        return session.query(Link).filter(
            Link.entity_type == 'task',
            Link.entity_id == self.id
        ).all()
    
    def add_link(self, session, url, platform_id=None, title=None, description=None, created_by=None):
        """
        Añade un enlace a esta tarea
        
        Args:
            session: Sesión SQLAlchemy
            url: URL del enlace
            platform_id: ID de la plataforma (opcional)
            title: Título del enlace (opcional)
            description: Descripción del enlace (opcional)
            created_by: ID del usuario que crea el enlace (opcional)
            
        Returns:
            Link: Instancia del enlace creado
        """
        from app.models.communications.links import Link
        return Link.create_for_entity(
            session, self, url, platform_id, title, description, created_by
        )
    
    def __repr__(self):
        return f"<Task(id={self.id}, title='{self.title}', project_id={self.project_id})>"