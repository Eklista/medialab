"""
Inventory Seeder Models - Catálogos de configuración para inventario
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import Base

class InventoryType(Base):
    """
    Tipos de inventario (SEEDER)
    Catálogo de clasificaciones para diferentes tipos de inventario
    """
    __tablename__ = "inventory_types"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    code = Column(String(20), nullable=False, unique=True)
    description = Column(Text)
    icon = Column(String(50))  # Para UI
    color = Column(String(7))  # Código hexadecimal para UI
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    equipment = relationship("Equipment", back_populates="inventory_type")
    supplies = relationship("Supply", back_populates="inventory_type")
    
    def __repr__(self):
        return f"<InventoryType(name='{self.name}', code='{self.code}')>"

class SupplyDelivery(Base):
    """
    Entregas de suministros
    Registro de entregas específicas de suministros
    """
    __tablename__ = "supply_deliveries"
    
    id = Column(Integer, primary_key=True, index=True)
    supply_id = Column(Integer, ForeignKey("supplies.id"), nullable=False, index=True)
    delivery_date = Column(DateTime(timezone=True), nullable=False)
    quantity_delivered = Column(Integer, nullable=False)
    unit_cost = Column(Integer)  # En centavos
    total_cost = Column(Integer)  # En centavos
    supplier_name = Column(String(200))
    invoice_number = Column(String(100))
    notes = Column(Text)
    
    # Usuario que registra la entrega
    delivered_by_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    
    # Control de calidad
    quality_check_passed = Column(Boolean, default=True)
    quality_notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    supply = relationship("Supply", back_populates="deliveries")
    delivered_by = relationship("User", back_populates="supply_deliveries")
    
    def __repr__(self):
        return f"<SupplyDelivery(supply_id={self.supply_id}, quantity={self.quantity_delivered})>"
