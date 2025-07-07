"""
Modelo de reservas de inventario
"""

from sqlalchemy import Column, Integer, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import Base


class InventoryReservation(Base):
    """Reservas de inventario"""
    __tablename__ = "inventory_reservations"
    
    id = Column(Integer, primary_key=True, index=True)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    purpose = Column(Text)
    notes = Column(Text)
    
    # Estado
    is_confirmed = Column(Boolean, default=False)
    is_cancelled = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False, index=True)    item = relationship("InventoryItem", back_populates="reservations")
    
    reserved_by_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    reserved_by = relationship("User", foreign_keys=[reserved_by_id], back_populates="inventory_reservations")
    
    approved_by_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    approved_by = relationship("User", foreign_keys=[approved_by_id], back_populates="inventory_reservation_approvals")

    def __repr__(self):
        return f"<InventoryReservation(id={self.id}, item_id={self.item_id}, reserved_by_id={self.reserved_by_id})>"
