"""
Modelo para reportes generados.
"""

from sqlalchemy import Column, String, Integer, BigInteger, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship

from ..base import BaseModel
from enum import Enum


class GenerationType(Enum):
    """Tipos de generación."""
    MANUAL = "MANUAL"
    SCHEDULED = "SCHEDULED"
    API = "API"


class GenerationStatus(Enum):
    """Estados de generación."""
    QUEUED = "QUEUED"
    GENERATING = "GENERATING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    EXPIRED = "EXPIRED"


class GeneratedReport(BaseModel):
    """
    Modelo para reportes generados.
    """
    __tablename__ = "generated_reports"
    
    template_id = Column(String(36), ForeignKey("report_templates.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    generated_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    generation_type = Column(SQLEnum(GenerationType), nullable=False)
    parameters = Column(JSON, nullable=True)
    date_range = Column(JSON, nullable=True)
    status = Column(SQLEnum(GenerationStatus), default=GenerationStatus.QUEUED, nullable=False)
    file_path = Column(String(500), nullable=True)
    file_size = Column(BigInteger, nullable=True)
    generation_time_ms = Column(Integer, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    download_count = Column(Integer, default=0, nullable=False)
    last_downloaded_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relaciones
    template = relationship("ReportTemplate", back_populates="generated_reports")    generated_by = relationship("User", back_populates="generated_reports")
    
    def __repr__(self):
        return f"<GeneratedReport(id={self.id}, name='{self.name}', status='{self.status.value}')>"
