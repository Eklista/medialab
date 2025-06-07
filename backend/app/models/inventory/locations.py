# ==========================================
# app/models/inventory/locations.py
# ==========================================

from sqlalchemy import Column, String, Integer, Text, Boolean, Index
from sqlalchemy.orm import relationship
import sqlalchemy as sa
from app.models.base import Base

class InventoryLocation(Base):
    """
    Ubicaciones del inventario
    """
    __tablename__ = 'inventory_locations'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)  # DIRECCION, LABORATORIO, MEDIALAB, EN_CASA
    description = Column(Text, nullable=True)
    is_external = Column(Boolean, default=False)  # True para "EN_CASA"
    is_active = Column(Boolean, default=True)
    
    # Relaciones
    equipment = relationship("Equipment", back_populates="location")
    supplies = relationship("Supply", back_populates="location")
    
    # Índices
    __table_args__ = (
        sa.Index('idx_inventory_location_active', 'is_active'),
        sa.Index('idx_inventory_location_external', 'is_external')
    )
    
    def __repr__(self):
        return f"<InventoryLocation(name='{self.name}')>"