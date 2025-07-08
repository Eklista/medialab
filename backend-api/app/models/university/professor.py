"""
Modelo para profesores de la universidad.
"""

from sqlalchemy import Column, String, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship

from ..base import BaseModel


class Professor(BaseModel):
    """
    Modelo para profesores de la universidad.
    """
    __tablename__ = "professors"
    name = Column(String(255), nullable=False)
    title = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relaciones
    units = relationship("ProfessorUnit", back_populates="professor")  # Previene eliminación accidental
    
    def __repr__(self):
        return f"<Professor(id={self.id}, name='{self.name}', title='{self.title}')>"


class ProfessorUnit(BaseModel):
    """
    Modelo para la relación entre profesores y unidades.
    """
    __tablename__ = "professor_units"
    professor_id = Column(String(36), ForeignKey("professors.id"), nullable=False, index=True)
    unit_id = Column(String(36), ForeignKey("units.id"), nullable=False, index=True)
    role_in_unit = Column(String(255), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relaciones
    professor = relationship("Professor", back_populates="units")
    unit = relationship("Unit", back_populates="professors")
    
    def __repr__(self):
        return f"<ProfessorUnit(id={self.id}, professor_id='{self.professor_id}', unit_id='{self.unit_id}')>"
