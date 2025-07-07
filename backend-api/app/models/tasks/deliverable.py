"""
Modelo para entregables de tareas.
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from ..base import BaseModel


class Deliverable(BaseModel):
    """
    Modelo para entregables asociados a tareas.
    """
    __tablename__ = "deliverables"
    
    task_id = Column(String(36), ForeignKey("tasks.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    deliverable_type_id = Column(String(36), ForeignKey("deliverable_types.id"), nullable=False, index=True)
    deliverable_status_id = Column(String(36), ForeignKey("status_options.id"), nullable=False, index=True)
    url = Column(String(500), nullable=True)
    file_path = Column(String(500), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relaciones
    task = relationship("Task", back_populates="deliverables")    deliverable_type = relationship("DeliverableType", back_populates="deliverables")
    deliverable_status = relationship("StatusOption", foreign_keys=[deliverable_status_id], back_populates="deliverable_statuses")
    
    def __repr__(self):
        return f"<Deliverable(id={self.id}, name='{self.name}', task_id='{self.task_id}')>"
