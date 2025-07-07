"""
Modelo de unidades universitarias
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import Base


class Unit(Base):
    """
    Unidades universitarias (facultades, departamentos, centros, etc.)
    """
    __tablename__ = "units"
    
    id = Column(Integer, primary_key=True, index=True)
    unit_type_id = Column(Integer, ForeignKey("unit_types.id"), nullable=False, index=True)
    parent_unit_id = Column(Integer, ForeignKey("units.id"), nullable=True, index=True)
    
    # Información básica
    name = Column(String(255), nullable=False)
    abbreviation = Column(String(20))
    dean_director = Column(String(200))  # Decano o director
    extension = Column(String(20))  # Extensión telefónica
    email = Column(String(255))
    location = Column(String(200))  # Ubicación física
    description = Column(Text)
    
    # Estado
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relaciones
    unit_type = relationship("UnitType", back_populates="units")
    parent_unit = relationship("Unit", remote_side=[id], backref="child_units", back_populates="child_units")
    
    # Relaciones con otros modelos
    requests = relationship("Request", back_populates="unit")

    def __repr__(self):
        return f"<Unit(id={self.id}, name='{self.name}', abbreviation='{self.abbreviation}')>"


class UnitType(Base):
    """
    Tipos de unidades universitarias (Facultad, Departamento, Centro, etc.)
    SEEDER table
    """
    __tablename__ = "unit_types"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    color = Column(String(7))  # Color representativo hex
    icon = Column(String(50))  # Icono representativo
    hierarchy_level = Column(Integer)  # Nivel jerárquico
    
    # Estado
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relaciones
    professors = relationship("Professor", back_populates="unit")
    child_units = relationship("Unit", back_populates="parent_unit", remote_side="Unit.id")
    project_associations = relationship("ProjectUnit", back_populates="unit")
    units = relationship("Unit", back_populates="unit_type")

    def __repr__(self):
        return f"<UnitType(id={self.id}, code='{self.code}', name='{self.name}')>"
