"""
Modelo de archivos adjuntos de tarea
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import BaseModel


class TaskAttachment(BaseModel):
    """Archivos adjuntos a tareas"""
    __tablename__ = "task_attachments"
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255))
    file_path = Column(String(500))
    file_type = Column(String(50))
    file_size = Column(Integer)
    description = Column(Text)
    uploaded_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relaciones
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False, index=True)
    task = relationship("Task", back_populates="task_attachments")
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    uploaded_by = relationship("User", back_populates="uploaded_attachments")

    def __repr__(self):
        return f"<TaskAttachment(id={self.id}, filename='{self.filename}', task_id={self.task_id})>"
