"""
Modelo de comentarios de tarea
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import BaseModel


class TaskComment(BaseModel):
    """Comentarios en tareas"""
    __tablename__ = "task_comments"
    content = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)  # Si es comentario interno del equipo
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False, index=True)
    task = relationship("Task", back_populates="task_comments")
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    author = relationship("User", back_populates="task_comments")

    def __repr__(self):
        return f"<TaskComment(id={self.id}, task_id={self.task_id}, author_id={self.author_id})>"
