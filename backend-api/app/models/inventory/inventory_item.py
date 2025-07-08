"""
Modelo principal de item de inventario
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import BaseModel
from .enums import InventoryItemStatus


class InventoryItem(BaseModel):
    """Items de inventario"""
    __tablename__ = "inventory_items"
    name = Column(String(200), nullable=False)
    description = Column(Text)
    brand = Column(String(100))
    model = Column(String(100))
    serial_number = Column(String(100), unique=True)
    barcode = Column(String(100), unique=True)
    
    # Estado y ubicación
    status = Column(Enum(InventoryItemStatus), default=InventoryItemStatus.AVAILABLE)
    location = Column(String(200))  # Ubicación física
    
    # Información financiera
    purchase_price = Column(Numeric(10, 2))
    current_value = Column(Numeric(10, 2))
    purchase_date = Column(DateTime(timezone=True))
    warranty_expiry = Column(DateTime(timezone=True))
    
    # Información técnica
    specifications = Column(JSON)  # JSON con especificaciones técnicas
    manual_url = Column(String(500))  # URL del manual
    
    # Fechas
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    category_id = Column(Integer, ForeignKey("inventory_categories.id"), index=True, nullable=False)
    category = relationship("InventoryCategory", back_populates="items")
    assigned_to_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    assigned_to = relationship("User", back_populates="assigned_inventory_items")
    
    # Relaciones con otros modelos
    inventory_movements = relationship("InventoryMovement", back_populates="item")
    maintenance_records = relationship("MaintenanceRecord", back_populates="item")
    project_resources = relationship("ProjectResource", back_populates="inventory_item")
    supplies = relationship("Supply", back_populates="inventory_item")
    equipment = relationship("Equipment", back_populates="inventory_item")
    reservations = relationship("InventoryReservation", back_populates="item")

    def __repr__(self):
        return f"<InventoryItem(id={self.id}, name='{self.name}', serial_number='{self.serial_number}')>"
