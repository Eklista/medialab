"""
Modelo de plantillas de proyecto
"""

from sqlalchemy import Column, String, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB

from ..base import Base


class ProjectTemplate(Base):
    """
    Templates for common types of projects
    Helps standardize project creation
    """
    __tablename__ = "project_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    service_type_id = Column(Integer, ForeignKey("service_types.id"), nullable=False, index=True)
    
    # Template data (JSON structure with default values)
    template_data = Column(JSON)  # JSON string with default values for project fields
    default_tasks = Column(JSON)  # JSON string with tasks to create automatically
    
    # Usage
    usage_count = Column(Integer, default=0)
    
    # Fechas
    created_at = Column(Integer, nullable=False)
    updated_at = Column(Integer, nullable=False)
    
    # Relationships    service_type = relationship("ServiceType", back_populates="project_templates")
    requests = relationship("Request", back_populates="template")

    def __repr__(self):
        return f"<ProjectTemplate(id={self.id}, name='{self.name}')>"
