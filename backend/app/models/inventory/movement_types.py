# ==========================================
# app/models/inventory/movement_types.py
# ==========================================

from sqlalchemy import Column, String, Integer, Text, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base

class MovementType(Base):
    """
    Tipos de movimiento para suministros (ENTRADA, SALIDA, AJUSTE, TRANSFERENCIA, etc.)
    """
    __tablename__ = 'movement_types'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    affects_stock = Column(Integer, default=0)  # 1 aumenta, -1 disminuye, 0 neutral
    is_active = Column(Boolean, default=True)
    
    # Relaciones
    movements = relationship("SupplyMovement", back_populates="movement_type")
    
    def __repr__(self):
        return f"<MovementType(name='{self.name}')>"