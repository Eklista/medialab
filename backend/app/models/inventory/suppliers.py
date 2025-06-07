# ==========================================
# app/models/inventory/suppliers.py
# ==========================================

from sqlalchemy import Column, String, Integer, Text, Boolean, Index, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import sqlalchemy as sa
from app.models.base import Base

class Supplier(Base):
    """
    Proveedores de equipos y suministros
    """
    __tablename__ = 'suppliers'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)  # SEGA, etc.
    contact_person = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relaciones
    equipment = relationship("Equipment", back_populates="supplier")
    equipment_lab = relationship("EquipmentLab", back_populates="supplier")
    
    # Auditoría
    deleted_at = Column(DateTime, nullable=True)
    deleted_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Índices
    __table_args__ = (
        sa.Index('idx_supplier_active', 'is_active'),
    )
    
    def __repr__(self):
        return f"<Supplier(name='{self.name}')>"
