"""
Modelo de dependencias entre tareas
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import Base


class TaskDependency(Base):
    """Dependencias entre tareas"""
    __tablename__ = "task_dependencies"
    
    id = Column(Integer, primary_key=True, index=True)
    dependency_type = Column(String(50), default="finish_to_start")  # Tipo de dependencia
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relaciones
    predecessor_id = Column(Integer, ForeignKey("tasks.id"), nullable=False, index=True)
    predecessor = relationship("Task", foreign_keys=[predecessor_id], back_populates="predecessor_dependencies")
    
    successor_id = Column(Integer, ForeignKey("tasks.id"), nullable=False, index=True)
    successor = relationship("Task", foreign_keys=[successor_id], back_populates="successor_dependencies")

    def __repr__(self):
        return f"<TaskDependency(id={self.id}, predecessor_id={self.predecessor_id}, successor_id={self.successor_id})>"
