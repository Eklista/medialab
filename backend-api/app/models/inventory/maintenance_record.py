"""
Modelo de registros de mantenimiento
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import BaseModel


class MaintenanceRecord(BaseModel):
    """Registros de mantenimiento"""
    __tablename__ = "maintenance_records"
    maintenance_type = Column(String(50))  # preventive, corrective, calibration
    description = Column(Text, nullable=False)
    cost = Column(Numeric(10, 2))
    
    # Fechas
    scheduled_date = Column(DateTime(timezone=True))
    completed_date = Column(DateTime(timezone=True))
    next_maintenance_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relaciones
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False, index=True)
    item = relationship("InventoryItem", back_populates="maintenance_records")
    performed_by_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    performed_by = relationship("User", back_populates="maintenance_records")

    def __repr__(self):
        return f"<MaintenanceRecord(id={self.id}, maintenance_type='{self.maintenance_type}', item_id={self.item_id})>"
