"""
Modelo de registro de tiempo de tarea
"""

from sqlalchemy import Column, Integer, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import Base


class TaskTimeLog(Base):
    """Registro de tiempo trabajado en tareas"""
    __tablename__ = "task_time_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True))
    duration_minutes = Column(Integer)  # Duración en minutos
    description = Column(Text)
    is_billable = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relaciones
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False, index=True)
    task = relationship("Task", back_populates="task_time_logs")
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)    user = relationship("User", back_populates="task_time_logs")

    def __repr__(self):
        return f"<TaskTimeLog(id={self.id}, task_id={self.task_id}, duration_minutes={self.duration_minutes})>"
