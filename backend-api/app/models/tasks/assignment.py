"""
Modelo de asignaciones de tareas
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import Base


class TaskAssignment(Base):
    """
    Asignaciones detalladas de tareas a usuarios
    Permite múltiples asignados por tarea con roles específicos
    """
    __tablename__ = "task_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(100))  # lead, contributor, reviewer, etc.
    responsibility = Column(Text)  # Descripción específica de la responsabilidad
    effort_percentage = Column(Integer)  # Porcentaje del esfuerzo de la tarea
    
    # Estado de la asignación
    status = Column(String(50), default="assigned")  # assigned, accepted, declined, completed
    is_active = Column(Boolean, default=True)
    
    # Fechas
    assigned_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    accepted_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    # Relaciones
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False, index=True)    task = relationship("Task", back_populates="task_assignments")
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)    user = relationship("User", back_populates="task_assignments")
    
    assigned_by_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    assigned_by = relationship("User", foreign_keys=[assigned_by_id], back_populates="task_assignment_assignments")

    def __repr__(self):
        return f"<TaskAssignment(id={self.id}, task_id={self.task_id}, user_id={self.user_id}, role='{self.role}')>"
