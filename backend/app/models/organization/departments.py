# app/models/organization/departments.py
from sqlalchemy import Column, String, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base

class DepartmentType(Base):
    """
    Modelo para tipos de departamentos o unidades académicas
    """
    __tablename__ = 'department_types'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    
    # Relación inversa
    departments = relationship("Department", back_populates="type")
    
    def __repr__(self):
        return f"<DepartmentType(id={self.id}, name='{self.name}')>"

class Department(Base):
    """
    Modelo para departamentos y unidades académicas
    """
    __tablename__ = 'departments'
   
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    abbreviation = Column(String(20), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    type_id = Column(Integer, ForeignKey("department_types.id"), nullable=False)
    
    # Relación al tipo de departamento
    type = relationship("DepartmentType", back_populates="departments")
   
    def __repr__(self):
        return f"<Department(id={self.id}, name='{self.name}')>"