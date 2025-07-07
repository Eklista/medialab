"""
Modelo de suministros de inventario
Especialización de InventoryItem para suministros consumibles
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import Base


class Supply(Base):
    """
    Suministros consumibles del inventario
    Extiende la funcionalidad de InventoryItem para materiales consumibles
    """
    __tablename__ = "supplies"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Información de inventario
    current_stock = Column(Integer, default=0)
    minimum_stock = Column(Integer, default=0)  # Nivel mínimo para alertas
    maximum_stock = Column(Integer)  # Nivel máximo recomendado
    
    # Unidad de medida
    unit_of_measurement = Column(String(50))  # piezas, metros, litros, kg, etc.
    
    # Información de proveedor
    supplier_name = Column(String(200))
    supplier_contact = Column(String(200))
    supplier_catalog_number = Column(String(100))
    
    # Costo y presupuesto
    unit_cost = Column(Numeric(10, 2))  # Costo por unidad
    last_purchase_cost = Column(Numeric(10, 2))  # Último costo de compra
    budget_code = Column(String(50))  # Código presupuestario
    
    # Información de caducidad
    has_expiration_date = Column(Boolean, default=False)
    expiration_date = Column(DateTime(timezone=True))
    shelf_life_days = Column(Integer)  # Vida útil en días
    
    # Condiciones de almacenamiento
    storage_requirements = Column(Text)  # Condiciones especiales de almacenamiento
    storage_temperature = Column(String(50))  # Temperatura de almacenamiento
    
    # Estado
    is_consumable = Column(Boolean, default=True)
    is_hazardous = Column(Boolean, default=False)
    safety_notes = Column(Text)  # Notas de seguridad
    
    # Relación con el item de inventario base
    inventory_type = relationship("InventoryType", back_populates="supplies")
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False, index=True)    inventory_item = relationship("InventoryItem", back_populates="supplies")
    deliveries = relationship("InventoryType", back_populates="supply")
    
    # Fechas
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Supply(id={self.id}, current_stock={self.current_stock}, unit='{self.unit_of_measurement}')>"
