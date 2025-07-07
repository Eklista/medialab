"""
Modelo de movimientos de inventario
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import Base


class InventoryMovement(Base):
    """Movimientos de inventario"""
    __tablename__ = "inventory_movements"
    
    id = Column(Integer, primary_key=True, index=True)
    movement_type = Column(String(50))  # check_out, check_in, transfer, etc.
    quantity = Column(Integer, default=1)
    notes = Column(Text)
    
    # Fechas
    movement_date = Column(DateTime(timezone=True), default=datetime.utcnow)
    expected_return_date = Column(DateTime(timezone=True))
    actual_return_date = Column(DateTime(timezone=True))
    
    # Relaciones
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False, index=True)
    item = relationship("InventoryItem", back_populates="inventory_movements")
    
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)  # Usuario que realiza el movimiento
    user = relationship("User", foreign_keys=[user_id], back_populates="inventory_movements")
    
    assigned_to_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)  # Usuario al que se asigna
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], back_populates="inventory_assignments")
    
    processed_by_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)  # Quien procesa el movimiento
    processed_by = relationship("User", foreign_keys=[processed_by_id], back_populates="inventory_processing")

    def __repr__(self):
        return f"<InventoryMovement(id={self.id}, movement_type='{self.movement_type}', item_id={self.item_id})>"
