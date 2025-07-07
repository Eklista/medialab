"""
Project Extended Models - Relaciones proyecto-unidades y equipos-tareas
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import Base

class ProjectUnit(Base):
    """
    Relación proyecto-unidades
    Tabla intermedia para asociar proyectos con unidades universitarias
    """
    __tablename__ = "project_units"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    
    # Tipo de relación
    relationship_type = Column(String(50), default='participant')  # 'lead', 'participant', 'collaborator'
    
    # Detalles de la participación
    role_description = Column(Text)
    responsibilities = Column(Text)
    
    # Recursos asignados
    budget_allocated = Column(Integer)  # En centavos
    personnel_count = Column(Integer)
    
    # Fechas de participación
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    
    # Estado
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    project = relationship("Project", back_populates="unit_associations")
    unit = relationship("Unit", back_populates="project_associations")
    
    # Constraint único
    __table_args__ = (
        UniqueConstraint('project_id', 'unit_id', name='unique_project_unit'),
    )
    
    def __repr__(self):
        return f"<ProjectUnit(project_id={self.project_id}, unit_id={self.unit_id}, type='{self.relationship_type}')>"

class TaskEquipment(Base):
    """
    Relación tarea-equipos
    Equipos específicos asignados a tareas
    """
    __tablename__ = "task_equipments"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False, index=True)
    equipment_id = Column(Integer, ForeignKey("equipments.id"), nullable=False, index=True)
    
    # Detalles de la asignación
    quantity_required = Column(Integer, default=1)
    purpose = Column(Text)
    
    # Fechas de uso
    assigned_date = Column(DateTime(timezone=True), default=datetime.utcnow)
    expected_return_date = Column(DateTime(timezone=True))
    actual_return_date = Column(DateTime(timezone=True))
    
    # Estado del equipo durante la asignación
    condition_on_assignment = Column(String(50))  # 'excellent', 'good', 'fair', 'needs_maintenance'
    condition_on_return = Column(String(50))
    
    # Responsable de la asignación
    assigned_by_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    
    # Notas y observaciones
    assignment_notes = Column(Text)
    return_notes = Column(Text)
    
    # Estado
    status = Column(String(50), default='assigned')  # 'assigned', 'in_use', 'returned', 'overdue'
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    task = relationship("Task", back_populates="equipment_assignments")
    equipment = relationship("Equipment", back_populates="task_assignments")
    assigned_by = relationship("User", back_populates="equipment_assignments")
    
    def __repr__(self):
        return f"<TaskEquipment(task_id={self.task_id}, equipment_id={self.equipment_id}, status='{self.status}')>"
