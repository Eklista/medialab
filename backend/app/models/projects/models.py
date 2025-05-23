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

    # Relación con usuario institucional 
    institutional_user_id = Column(Integer, ForeignKey('institutional_users.id'), nullable=True)
    
    # Relación con solicitud - especificando foreign_keys explícitamente
    request_id = Column(Integer, ForeignKey('requests.id'), nullable=True)
    
    # Relaciones corregidas
    activity_type = relationship("ActivityType")
    department = relationship("Department")
    
    tasks = relationship(
        "Task",
        back_populates="project",
        foreign_keys="[Task.project_id]"
    )
    
    institutional_user = relationship(
        "InstitutionalUser", 
        back_populates="projects"
    )
    
    originating_request = relationship(
        "Request",
        back_populates="project",
        foreign_keys=[request_id]
    )
    
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
    
    # Clasificación
    activity_type_id = Column(Integer, ForeignKey('activity_types.id'), nullable=True)
    
    # Descripción
    activity_entity_type = Column(String(50), nullable=True)
    activity_entity_id = Column(Integer, nullable=True)
    
    # Asignación
    assignee_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Fechas específicas
    start_date = Column(DateTime, nullable=True)
    
    # Progreso
    progress_percentage = Column(Integer, default=0)
    
    # Relaciones corregidas
    project = relationship(
        "Project", 
        back_populates="tasks",
        foreign_keys=[project_id]
    )
    
    activity_type = relationship("ActivityType")
    
    assignee = relationship(
        "User", 
        back_populates="assigned_tasks", 
        foreign_keys=[assignee_id]
    )
    
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
    
    def __repr__(self):
        return f"<Task(id={self.id}, title='{self.title}', project_id={self.project_id})>"