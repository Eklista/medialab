# ==========================================
# app/models/inventory/assignments.py
# ==========================================

from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Index, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import sqlalchemy as sa
from app.models.base import Base

class ComponentAssignment(Base):
    """
    Asignaciones especiales de componentes por persona (baterías, memorias, etc.)
    """
    __tablename__ = 'component_assignments'
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Usuario asignado
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Categoría del componente
    category_id = Column(Integer, ForeignKey('inventory_categories.id'), nullable=False)
    
    # Cantidad asignada
    cantidad_asignada = Column(Integer, nullable=False, default=0)
    
    # Fechas
    fecha_asignacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_actualizacion = Column(DateTime, onupdate=datetime.utcnow)
    
    # Observaciones
    observaciones = Column(Text, nullable=True)
    
    # Auditoría
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Relaciones
    user = relationship("User", foreign_keys=[user_id])
    category = relationship("InventoryCategory")
    created_by = relationship("User", foreign_keys=[created_by_id])
    updated_by = relationship("User", foreign_keys=[updated_by_id])
    
    # Índices
    __table_args__ = (
        sa.Index('idx_component_assignment_user', 'user_id'),
        sa.Index('idx_component_assignment_category', 'category_id'),
        sa.UniqueConstraint('user_id', 'category_id', name='uix_user_category_assignment')
    )
    
    def __repr__(self):
        return f"<ComponentAssignment(user_id={self.user_id}, category_id={self.category_id}, cantidad={self.cantidad_asignada})>"