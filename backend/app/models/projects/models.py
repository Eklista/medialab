# app/models/projects/models.py
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class Request(Base):
    """
    Solicitudes de trabajo/servicios
    """
    __tablename__ = 'requests'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Clasificación
    activity_type_id = Column(Integer, ForeignKey('activity_types.id'), nullable=False)
    priority_id = Column(Integer, ForeignKey('priorities.id'), nullable=True)
    
    # Fechas
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    desired_date = Column(DateTime, nullable=True)
    
    # Solicitante
    requester_id = Column(Integer, nullable=False)
    department_id = Column(Integer, ForeignKey('departments.id'), nullable=True)
    
    # Estado
    status_id = Column(Integer, ForeignKey('statuses.id'), nullable=False)
    level = Column(Integer, default=1)  # Nivel del workflow
    
    # Relaciones
    activity_type = relationship("ActivityType")
    priority = relationship("Priority")
    status = relationship("Status")
    department = relationship("Department")
    
    # Relación con proyecto (si se ha convertido)
    converted_to_project_id = Column(Integer, ForeignKey('projects.id'), nullable=True)
    project = relationship("Project", foreign_keys=[converted_to_project_id], back_populates="originating_request")
    
    def __repr__(self):
        return f"<Request(id={self.id}, title='{self.title}')>"


class Project(Base):
    """
    Proyectos de trabajo
    """
    __tablename__ = 'projects'
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=True)  # Código de proyecto
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Clasificación
    activity_type_id = Column(Integer, ForeignKey('activity_types.id'), nullable=False)
    priority_id = Column(Integer, ForeignKey('priorities.id'), nullable=True)
    
    # Fechas
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    start_date = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Cliente
    client_id = Column(Integer, nullable=True)
    department_id = Column(Integer, ForeignKey('departments.id'), nullable=True)
    
    # Estado
    status_id = Column(Integer, ForeignKey('statuses.id'), nullable=False)
    level = Column(Integer, default=1)  # Nivel del workflow
    
    # Flags
    is_recurrent = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Relaciones
    activity_type = relationship("ActivityType")
    priority = relationship("Priority")
    status = relationship("Status")
    department = relationship("Department")
    tasks = relationship("Task", back_populates="project")
    
    # Relación con solicitud (si proviene de una)
    request_id = Column(Integer, ForeignKey('requests.id'), nullable=True)
    originating_request = relationship("Request", foreign_keys=[request_id], back_populates="project")
    
    def __repr__(self):
        return f"<Project(id={self.id}, title='{self.title}')>"


class Task(Base):
    """
    Tareas de un proyecto
    """
    __tablename__ = 'tasks'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Relación con proyecto
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=False)
    project = relationship("Project", back_populates="tasks")
    
    # Clasificación
    activity_type_id = Column(Integer, ForeignKey('activity_types.id'), nullable=True)
    priority_id = Column(Integer, ForeignKey('priorities.id'), nullable=True)
    
    # Asignación
    assignee_id = Column(Integer, nullable=True)
    
    # Fechas
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    start_date = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Progreso
    estimated_hours = Column(Integer, nullable=True)
    progress_percentage = Column(Integer, default=0)
    
    # Estado
    status_id = Column(Integer, ForeignKey('statuses.id'), nullable=False)
    level = Column(Integer, default=1)  # Nivel del workflow
    
    # Campos para entregables
    deliverable_url = Column(String(255), nullable=True)
    has_deliverable = Column(Boolean, default=False)
    
    # Relaciones
    activity_type = relationship("ActivityType")
    priority = relationship("Priority")
    status = relationship("Status")
    
    def __repr__(self):
        return f"<Task(id={self.id}, title='{self.title}', project_id={self.project_id})>"