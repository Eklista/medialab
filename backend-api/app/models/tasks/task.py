"""
Modelo principal de tarea
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import BaseModel
from .enums import TaskStatus, TaskPriority, TaskType


class Task(BaseModel):
    """Tareas del sistema"""
    __tablename__ = "tasks"
    title = Column(String(200), nullable=False)
    description = Column(Text)
    task_type = Column(Enum(TaskType), default=TaskType.OTHER)
    status = Column(Enum(TaskStatus), default=TaskStatus.TODO)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM)
    
    # Fechas
    due_date = Column(DateTime(timezone=True))
    start_date = Column(DateTime(timezone=True))
    completed_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Estimación y seguimiento
    estimated_hours = Column(Integer)  # Horas estimadas
    actual_hours = Column(Integer)     # Horas reales
    progress_percentage = Column(Integer, default=0)  # Porcentaje de avance
    
    # Relaciones
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True)
    project = relationship("Project", back_populates="tasks")
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], back_populates="assigned_tasks")
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    created_by = relationship("User", foreign_keys=[created_by_id], back_populates="created_tasks")
    parent_task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True, index=True)  # Para subtareas
    parent_task = relationship("Task", remote_side=[id], back_populates="subtasks")
    
    # Relaciones con otros modelos
    task_comments = relationship("TaskComment", back_populates="task")
    task_attachments = relationship("TaskAttachment", back_populates="task")
    task_time_logs = relationship("TaskTimeLog", back_populates="task")
    deliverables = relationship("Deliverable", back_populates="task")
    approvals = relationship("TaskApproval", back_populates="task")
    subtasks = relationship("Task", back_populates="parent_task")
    task_assignments = relationship("TaskAssignment", back_populates="task")
    predecessor_dependencies = relationship("TaskDependency", back_populates="predecessor")
    successor_dependencies = relationship("TaskDependency", back_populates="successor")
    equipment_assignments = relationship("ProjectUnit", back_populates="task")
    links = relationship("TaskLink", back_populates="task")

    def __repr__(self):
        return f"<Task(id={self.id}, title='{self.title}', status='{self.status}')>"
