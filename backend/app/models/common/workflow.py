# app/models/common/workflow.py
from sqlalchemy import Column, String, Integer, Text, DateTime, Boolean, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import sqlalchemy as sa

from app.models.base import Base
from app.models.common.audit_mixin import AuditMixin

class Status(Base):
    """
    Estados posibles para cualquier entidad del sistema
    Aplicable a tareas, proyectos, solicitudes, etc.
    """
    __tablename__ = 'statuses'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    level = Column(Integer, nullable=False)  # 1, 2 o 3 según el flujo de trabajo
    
    # Tipo de entidad a la que aplica este estado (tarea, proyecto, solicitud, etc.)
    entity_type = Column(String(50), nullable=False)
    
    # Clave compuesta natural para búsquedas
    __table_args__ = (
        sa.UniqueConstraint('name', 'entity_type', name='uix_status_name_entity'),
        sa.Index('idx_status_entity_type', 'entity_type'),
        sa.Index('idx_status_level', 'level')
    )
    
    # Campos para UI/UX
    color = Column(String(20), nullable=False, default="#6B7280")  # Color por defecto gris
    order = Column(Integer, default=0)  # Orden de visualización en listas
    
    # Flags de transición
    is_initial = Column(Boolean, default=False)  # ¿Es un estado inicial?
    is_final = Column(Boolean, default=False)    # ¿Es un estado final?
    
    def __repr__(self):
        return f"<Status(name='{self.name}', entity_type='{self.entity_type}', level={self.level})>"


class WorkItem(Base, AuditMixin):
    """
    Elemento de trabajo genérico (base abstracta)
    Proporciona campos comunes para tareas, proyectos, etc.
    """
    __tablename__ = 'work_items'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Tipo de entidad (tarea, proyecto, solicitud, etc.)
    entity_type = Column(String(50), nullable=False)
    
    # Relación con estado
    status_id = Column(Integer, ForeignKey("statuses.id"), nullable=False)
    status = relationship("Status")
    
    # Nivel actual (derivado del estado pero almacenado para consultas rápidas)
    level = Column(Integer, default=1)
    
    # Campos básicos para tracking
    priority_id = Column(Integer, ForeignKey("priorities.id"), nullable=True)
    priority = relationship("Priority", back_populates="work_items")
    due_date = Column(DateTime, nullable=True)
    estimated_hours = Column(Integer, nullable=True)  # Horas estimadas
    
    # Campos para entregables
    deliverable_url = Column(String(255), nullable=True)
    has_deliverable = Column(Boolean, default=False)
    
    # Campos para feedback
    feedback = Column(Text, nullable=True)
    
    # Etiquetas para categorización (separadas por comas)
    tags = Column(String(255), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Índices
    __table_args__ = (
        sa.Index('idx_work_item_status', 'status_id'),
        sa.Index('idx_work_item_priority', 'priority_id'),
        sa.Index('idx_work_item_entity_type', 'entity_type')
    )
    
    # Implementación del patrón Table-per-hierarchy con discriminador
    __mapper_args__ = {
        'polymorphic_on': entity_type,
        'polymorphic_identity': 'work_item'
    }
    
    def __repr__(self):
        return f"<WorkItem(id={self.id}, title='{self.title}', type='{self.entity_type}')>"

class StatusHistory(Base):
    """
    Historial de cambios de estado para cualquier entidad
    Permite auditoría y seguimiento de progreso
    """
    __tablename__ = 'status_history'
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Puede referirse a cualquier entidad
    entity_id = Column(Integer, nullable=False)
    entity_type = Column(String(50), nullable=False)
    
    old_status_id = Column(Integer, ForeignKey("statuses.id"), nullable=True)
    new_status_id = Column(Integer, ForeignKey("statuses.id"), nullable=False)
    
    old_level = Column(Integer, nullable=True)
    new_level = Column(Integer, nullable=False)
    
    # Quién hizo el cambio
    changed_by_id = Column(Integer, nullable=True)
    
    change_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    comment = Column(Text, nullable=True)
    
    # Relaciones
    old_status = relationship("Status", foreign_keys=[old_status_id])
    new_status = relationship("Status", foreign_keys=[new_status_id])
    
    # Índice para búsquedas rápidas por entidad
    __table_args__ = (
        sa.Index('idx_status_history_entity', 'entity_type', 'entity_id'),
        sa.Index('idx_status_history_date', 'change_date'),
        sa.Index('idx_status_history_user', 'changed_by_id')
    )
    
    def __repr__(self):
        return f"<StatusHistory(entity_type='{self.entity_type}', entity_id={self.entity_id})>"