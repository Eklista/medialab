# ==========================================
# app/models/inventory/categories.py
# ==========================================

from sqlalchemy import Column, String, Integer, Text, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base

class InventoryCategory(Base):
    """
    Categorías de inventario (PC, Monitor, Fuente, Batería, Memoria, etc.)
    """
    __tablename__ = 'inventory_categories'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)  # PC, Monitor, Fuente, etc.
    description = Column(Text, nullable=True)
    is_equipment = Column(Boolean, default=True)  # True para equipos, False para suministros
    is_active = Column(Boolean, default=True)
    
    # Relaciones
    equipment = relationship("Equipment", back_populates="category")
    supplies = relationship("Supply", back_populates="category")
    
    def __repr__(self):
        return f"<InventoryCategory(name='{self.name}')>"