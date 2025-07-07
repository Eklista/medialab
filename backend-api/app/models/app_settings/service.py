"""
Modelos para categorías y tipos de servicios.
"""

from sqlalchemy import Column, String, Text, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from ..base import BaseModel


class ServiceCategory(BaseModel):
    id = Column(Integer, primary_key=True, index=True)
    """
    Modelo para categorías de servicios.
    """
    __tablename__ = "service_categories"
    
    code = Column(String(100), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(50), nullable=True)
    icon = Column(String(100), nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relaciones
    service_types = relationship("ServiceType", back_populates="category", cascade="restrict")  # Previene eliminación accidental
    
    def __repr__(self):
        return f"<ServiceCategory(id={self.id}, code='{self.code}', name='{self.name}')>"


class ServiceType(BaseModel):
    """
    Modelo para tipos de servicios.
    """
    __tablename__ = "service_types"
    
    category_id = Column(String(36), ForeignKey("service_categories.id"), nullable=False, index=True)
    code = Column(String(100), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(50), nullable=True)
    icon = Column(String(100), nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relaciones
    category = relationship("ServiceCategory", back_populates="service_types")
    
    def __repr__(self):
        return f"<ServiceType(id={self.id}, code='{self.code}', name='{self.name}')>"


class DurationType(BaseModel):
    id = Column(Integer, primary_key=True, index=True)
    """
    Modelo para tipos de duración.
    """
    __tablename__ = "duration_types"
    
    code = Column(String(100), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    months_duration = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    def __repr__(self):
        return f"<DurationType(id={self.id}, code='{self.code}', name='{self.name}', months={self.months_duration})>"
