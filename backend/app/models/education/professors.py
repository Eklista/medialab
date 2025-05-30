# app/models/education/professors.py
from sqlalchemy import Column, String, Integer, Text, ForeignKey, Index
from sqlalchemy.orm import relationship, validates
import re

from app.models.base import Base


class Professor(Base):
    """
    Catedráticos/Profesores - Simplemente información de contacto, no son usuarios del sistema
    """
    __tablename__ = 'professors'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    position = Column(String(255), nullable=True)  # Ej: "Profesor Titular", "Asistente", etc.
    
    # Departamento/Facultad principal
    department_id = Column(Integer, ForeignKey('departments.id'), nullable=True)
    
    # Relaciones
    department = relationship("Department")
    course_classes = relationship("CourseClass", back_populates="professor")
    
    # Índices
    __table_args__ = (
        Index('idx_professor_department', 'department_id'),
    )
    
    def __repr__(self):
        return f"<Professor(id={self.id}, name='{self.name}')>"