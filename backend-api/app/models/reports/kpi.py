"""
Modelo para KPIs (Indicadores Clave de Rendimiento).
"""

from sqlalchemy import Column, String, Text, Boolean, Decimal, ForeignKey, Enum as SQLEnum, JSON, Date, DateTime
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship

from ..base import BaseModel
from enum import Enum


class KPICategory(Enum):
    """Categorías de KPI."""
    PRODUCTIVITY = "PRODUCTIVITY"
    QUALITY = "QUALITY"
    EFFICIENCY = "EFFICIENCY"
    USAGE = "USAGE"
    SATISFACTION = "SATISFACTION"


class CalculationFrequency(Enum):
    """Frecuencia de cálculo."""
    HOURLY = "HOURLY"
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    YEARLY = "YEARLY"


class KPIDefinition(BaseModel):
    id = Column(Integer, primary_key=True, index=True)
    """
    Modelo para definiciones de KPIs.
    """
    __tablename__ = "kpi_definitions"
    
    code = Column(String(100), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(SQLEnum(KPICategory), nullable=False)
    calculation_method = Column(JSON, nullable=False)
    target_value = Column(Decimal(10, 2), nullable=True)
    unit = Column(String(50), nullable=True)
    data_source = Column(JSON, nullable=False)
    calculation_frequency = Column(SQLEnum(CalculationFrequency), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relaciones
    values = relationship("KPIValue", back_populates="kpi_definition", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<KPIDefinition(id={self.id}, code='{self.code}', name='{self.name}')>"


class KPIValue(BaseModel):
    """
    Modelo para valores de KPIs.
    """
    __tablename__ = "kpi_values"
    
    kpi_definition_id = Column(String(36), ForeignKey("kpi_definitions.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    value = Column(Decimal(10, 2), nullable=False)
    target_value = Column(Decimal(10, 2), nullable=True)
    variance = Column(Decimal(10, 2), nullable=True)
    metadata = Column(JSON, nullable=True)
    calculated_at = Column(DateTime(timezone=True), nullable=False)
    
    # Relaciones
    kpi_definition = relationship("KPIDefinition", remote_side="KPIDefinition.id", back_populates="values")
    
    def __repr__(self):
        return f"<KPIValue(id={self.id}, kpi_id='{self.kpi_definition_id}', date='{self.date}', value={self.value})>"
