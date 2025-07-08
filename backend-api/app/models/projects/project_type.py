"""
Modelo de tipos de proyecto
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import BaseModel


class ProjectType(BaseModel):
    """Tipos de proyecto"""
    __tablename__ = "project_types"
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    color = Column(String(7))  # Color hex
    icon = Column(String(50))  # Icono
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    projects = relationship("Project", back_populates="project_type")

    def __repr__(self):
        return f"<ProjectType(id={self.id}, name='{self.name}')>"
