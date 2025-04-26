from sqlalchemy import Column, String, Integer, Text, Enum
from sqlalchemy.orm import relationship

from app.models.base import Base

import enum

class DepartmentType(enum.Enum):
    """Tipo de departamento o unidad académica"""
    FACULTY = "faculty"
    DEPARTMENT = "department"

class Department(Base):
    """
    Modelo para departamentos y unidades académicas
    """
    __tablename__ = 'departments'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    abbreviation = Column(String(20), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    type = Column(Enum(DepartmentType), nullable=False, default=DepartmentType.DEPARTMENT)
    
    def __repr__(self):
        return f"<Department(id={self.id}, name='{self.name}', type='{self.type}')>"