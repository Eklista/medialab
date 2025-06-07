# ==========================================
# app/models/inventory/equipment_states.py
# ==========================================

from sqlalchemy import Column, String, Integer, Text, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base

class EquipmentState(Base):
    """
    Estados posibles para equipos (ACTIVO, ARRUINADO, REEMPLAZADO, EN_REPARACION, DADO_BAJA, etc.)
    """
    __tablename__ = 'equipment_states'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(20), nullable=False, default="#6B7280")  # Para UI
    is_operational = Column(Boolean, default=True)  # Si el equipo está operativo
    is_active = Column(Boolean, default=True)
    
    # Relaciones
    equipment = relationship("Equipment", back_populates="state")
    
    def __repr__(self):
        return f"<EquipmentState(name='{self.name}')>"