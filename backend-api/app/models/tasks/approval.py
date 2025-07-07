"""
Modelo para aprobaciones de tareas.
"""

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from ..base import BaseModel


class TaskApproval(BaseModel):
    """
    Modelo para aprobaciones de tareas en diferentes niveles.
    """
    __tablename__ = "task_approvals"
    
    task_id = Column(String(36), ForeignKey("tasks.id"), nullable=False, index=True)
    level = Column(Integer, nullable=False)
    approval_status_id = Column(String(36), ForeignKey("status_options.id"), nullable=False, index=True)
    reviewer_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    feedback = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relaciones
    task = relationship("Task", back_populates="approvals")
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="task_approvals")
    approval_status = relationship("StatusOption", foreign_keys=[approval_status_id], back_populates="task_approval_statuses")
    
    def __repr__(self):
        return f"<TaskApproval(id={self.id}, task_id='{self.task_id}', level={self.level})>"
