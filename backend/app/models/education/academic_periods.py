# app/models/education/academic_periods.py
from sqlalchemy import Column, String, Integer, Date, Boolean, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class AcademicPeriod(Base):
    """
    Períodos académicos/ciclos (ej: 2025-01)
    """
    __tablename__ = 'academic_periods'
   
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False)  # Ej: "2025-01"
    name = Column(String(100), nullable=False)  # Ej: "Primer Semestre 2025"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
   
    # Relaciones
    careers = relationship("Career", back_populates="academic_period")
   
    # Índices
    __table_args__ = (
        Index('idx_academic_period_code', 'code'),
        Index('idx_academic_period_active', 'is_active')
    )
   
    def __repr__(self):
        return f"<AcademicPeriod(code='{self.code}', name='{self.name}')>"