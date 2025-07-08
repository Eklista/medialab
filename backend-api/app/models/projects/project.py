"""
Modelo principal de proyecto
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import BaseModel
from .enums import ProjectStatus, ProjectPriority


class Project(BaseModel):
    """Proyectos principales"""
    __tablename__ = "projects"
    name = Column(String(200), nullable=False)
    code = Column(String(20), unique=True, nullable=False)  # Código único del proyecto
    description = Column(Text)
    objectives = Column(Text)
    
    # Estado y prioridad
    status = Column(Enum(ProjectStatus), default=ProjectStatus.DRAFT)
    priority = Column(Enum(ProjectPriority), default=ProjectPriority.MEDIUM)
    
    # Fechas
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Presupuesto
    budget = Column(Numeric(12, 2))
    spent_budget = Column(Numeric(12, 2), default=0)
    
    # Relaciones
    project_type_id = Column(Integer, ForeignKey("project_types.id"), nullable=True, index=True)
    project_type = relationship("ProjectType", back_populates="projects")
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    manager = relationship("User", foreign_keys=[manager_id], back_populates="managed_projects")
    
    # Relaciones con otros modelos
    tasks = relationship("Task", back_populates="project")
    project_members = relationship("ProjectMember", back_populates="project")
    project_resources = relationship("ProjectResource", back_populates="project")
    podcasts = relationship("Podcast", back_populates="project")
    courses = relationship("Course", back_populates="project")
    project_documents = relationship("ProjectDocument", back_populates="project")
    
    # Relación con request original (si fue convertido de una solicitud)
    unit_associations = relationship("ProjectUnit", back_populates="project")
    original_request = relationship("Request", back_populates="converted_project", uselist=False)

    def __repr__(self):
        return f"<Project(id={self.id}, name='{self.name}', code='{self.code}')>"
