"""
Modelo para plantillas de reportes.
"""

from sqlalchemy import Column, String, Text, Boolean, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship

from ..base import BaseModel
from enum import Enum


class ReportCategory(Enum):
    """Categorías de reporte."""
    PRODUCTIVITY = "PRODUCTIVITY"
    PROJECTS = "PROJECTS"
    USERS = "USERS"
    INVENTORY = "INVENTORY"
    FINANCIAL = "FINANCIAL"
    QUALITY = "QUALITY"
    SYSTEM = "SYSTEM"


class ReportType(Enum):
    """Tipos de reporte."""
    TABLE = "TABLE"
    CHART = "CHART"
    DASHBOARD = "DASHBOARD"
    EXPORT = "EXPORT"


class ReportTemplate(BaseModel):
    """
    Modelo para plantillas de reportes.
    """
    __tablename__ = "report_templates"
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(SQLEnum(ReportCategory), nullable=False)
    report_type = Column(SQLEnum(ReportType), nullable=False)
    data_sources = Column(JSON, nullable=False)
    query_config = Column(JSON, nullable=False)
    chart_config = Column(JSON, nullable=True)
    filters = Column(JSON, nullable=True)
    schedule_options = Column(JSON, nullable=True)
    access_roles = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_by_user_id = Column(UUID, ForeignKey("users.id")
    created_by_user = relationship("User", back_populates="created_report_templates"), nullable=False, index=True)
    
    # Relaciones
    created_by = relationship("User", back_populates="created_reports")
    generated_reports = relationship("GeneratedReport", back_populates="template", cascade="restrict")  # Previene eliminación accidental
    scheduled_reports = relationship("ScheduledReport", back_populates="template", cascade="restrict")  # Previene eliminación accidental
    
    def __repr__(self):
        return f"<ReportTemplate(id={self.id}, name='{self.name}', category='{self.category.value}')>"
