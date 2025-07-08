"""
Modelo para enlaces de tareas.
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from ..base import BaseModel


class TaskLink(BaseModel):
    """
    Modelo para enlaces asociados a tareas.
    """
    __tablename__ = "task_links"
    task_id = Column(String(36), ForeignKey("tasks.id"), nullable=False, index=True)
    link_platform_id = Column(String(36), ForeignKey("link_platforms.id"), nullable=False, index=True)
    link_status_id = Column(String(36), ForeignKey("status_options.id"), nullable=False, index=True)
    url = Column(Text, nullable=False)
    title = Column(String(255), nullable=True)
    
    # Relaciones
    task = relationship("Task", back_populates="links")
    link_platform = relationship("LinkPlatform", back_populates="task_links")
    link_status = relationship("StatusOption", foreign_keys=[link_status_id], back_populates="task_link_statuses")
    
    def __repr__(self):
        return f"<TaskLink(id={self.id}, task_id='{self.task_id}', title='{self.title}')>"
