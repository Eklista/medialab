"""
Modelo de equipos de inventario
Especialización de InventoryItem para equipos
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import BaseModel


class Equipment(BaseModel):
    """
    Equipos específicos del inventario
    Extiende la funcionalidad de InventoryItem para equipos
    """
    __tablename__ = "equipments"    # Información técnica específica
    power_consumption = Column(String(50))  # Consumo eléctrico
    dimensions = Column(String(100))  # Dimensiones físicas
    weight = Column(Numeric(8, 2))  # Peso en kg
    operating_temperature = Column(String(50))  # Temperatura de operación
    
    # Conectividad y compatibilidad
    connectivity_options = Column(JSON)  # JSON con opciones de conectividad
    software_requirements = Column(Text)  # Requerimientos de software
    compatible_accessories = Column(JSON)  # JSON con accesorios compatibles
    
    # Estado operativo
    is_portable = Column(Boolean, default=False)
    requires_calibration = Column(Boolean, default=False)
    calibration_frequency_days = Column(Integer)  # Frecuencia de calibración en días
    last_calibration_date = Column(DateTime(timezone=True))
    next_calibration_date = Column(DateTime(timezone=True))
    
    # Relación con el item de inventario base
    inventory_type = relationship("InventoryType", back_populates="equipment")
    task_assignments = relationship("ProjectUnit", back_populates="equipment")
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False, index=True)
    inventory_item = relationship("InventoryItem", back_populates="equipment")
    
    # Fechas
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Equipment(id={self.id}, inventory_item_id={self.inventory_item_id})>"
