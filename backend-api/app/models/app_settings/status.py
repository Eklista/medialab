"""
Modelos para estados y opciones del sistema.
"""

from sqlalchemy import Column, String, Text, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from ..base import BaseModel


class StatusType(BaseModel):
    """
    Modelo para tipos de estado.
    """
    __tablename__ = "status_types"
    code = Column(String(100), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Relaciones
    status_options = relationship("StatusOption", back_populates="status_type")  # Previene eliminación accidental
    
    def __repr__(self):
        return f"<StatusType(id={self.id}, code='{self.code}', name='{self.name}')>"


class StatusOption(BaseModel):
    """
    Modelo para opciones de estado.
    """
    __tablename__ = "status_options"
    status_type_id = Column(Integer, ForeignKey("status_types.id"), nullable=False, index=True)
    code = Column(String(100), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    level = Column(Integer, nullable=False)
    color = Column(String(50), nullable=True)
    icon = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    
    # Relaciones
    status_type = relationship("StatusType", back_populates="status_options")
    
    def __repr__(self):
        return f"<StatusOption(id={self.id}, code='{self.code}', name='{self.name}')>"


class PriorityOption(BaseModel):
    """
    Modelo para opciones de prioridad.
    """
    __tablename__ = "priority_options"
    code = Column(String(100), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    level = Column(Integer, nullable=False)
    color = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    
    def __repr__(self):
        return f"<PriorityOption(id={self.id}, code='{self.code}', name='{self.name}', level={self.level})>"
