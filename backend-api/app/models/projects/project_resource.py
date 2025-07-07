"""
Modelo de recursos de proyecto
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import Base


class ProjectResource(Base):
    """Recursos asignados a proyectos"""
    __tablename__ = "project_resources"
    
    id = Column(Integer, primary_key=True, index=True)
    resource_type = Column(String(50))  # equipment, space, material, etc.
    quantity = Column(Integer, default=1)
    assigned_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    returned_at = Column(DateTime(timezone=True))
    notes = Column(Text)
    
    # Relaciones
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    project = relationship("Project", back_populates="project_resources")
    
    # Esto apuntará al item de inventario específico
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), index=True, nullable=False)
    inventory_item = relationship("InventoryItem", back_populates="project_resources")

    def __repr__(self):
        return f"<ProjectResource(id={self.id}, project_id={self.project_id}, resource_type='{self.resource_type}')>"
