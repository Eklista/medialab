"""
Modelo de categorías de inventario
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import BaseModel


class InventoryCategory(BaseModel):
    """Categorías de inventario"""
    __tablename__ = "inventory_categories"
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    icon = Column(String(50))
    color = Column(String(7))  # Color hex
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    items = relationship("InventoryItem", back_populates="category")

    def __repr__(self):
        return f"<InventoryCategory(id={self.id}, name='{self.name}')>"
