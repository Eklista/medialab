# app/models/education/academic.py
from sqlalchemy import Column, String, Integer, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import Base
import sqlalchemy as sa

class Faculty(Base):
    """
    Facultades (agrupaciones de carreras)
    """
    __tablename__ = 'faculties'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    abbreviation = Column(String(20), nullable=True)
    description = Column(Text, nullable=True)
    
    # Campos para UI
    color = Column(String(20), nullable=True)
    logo_url = Column(String(255), nullable=True)
    
    # Relaciones
    careers = relationship("Career", back_populates="faculty")
    
    def __repr__(self):
        return f"<Faculty(name='{self.name}')>"


class Career(Base):
    """
    Carreras académicas
    """
    __tablename__ = 'careers'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), nullable=True)  # Código de carrera
    description = Column(Text, nullable=True)
    
    # Relación con facultad
    faculty_id = Column(Integer, ForeignKey('faculties.id'), nullable=False)
    faculty = relationship("Faculty", back_populates="careers")
    
    # Relaciones
    courses = relationship("Course", back_populates="career")
    
    # Restricciones
    __table_args__ = (
        UniqueConstraint('name', 'faculty_id', name='uix_career_name_faculty'),
    )
    
    def __repr__(self):
        return f"<Career(name='{self.name}')>"


class Course(Base):
    """
    Cursos académicos
    """
    __tablename__ = 'courses'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    
    # Relación con carrera
    career_id = Column(Integer, ForeignKey('careers.id'), nullable=False)
    career = relationship("Career", back_populates="courses")
    
    # Metadatos
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Relaciones
    classes = relationship("CourseClass", back_populates="course")
    
    # Estado
    status_id = Column(Integer, ForeignKey('statuses.id'), nullable=True)
    
    # Restricciones
    __table_args__ = (
        UniqueConstraint('code', 'career_id', name='uix_course_code_career'),
    )
    
    def __repr__(self):
        return f"<Course(name='{self.name}', career_id={self.career_id})>"


class CourseClass(Base):
    """
    Clases/sesiones de un curso
    """
    __tablename__ = 'course_classes'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    class_number = Column(Integer, nullable=True)
    
    # Relación con curso
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=False)
    course = relationship("Course", back_populates="classes")
    
    # Fechas
    scheduled_date = Column(DateTime, nullable=True)
    recording_date = Column(DateTime, nullable=True)
    
    # Estado
    status_id = Column(Integer, ForeignKey('statuses.id'), nullable=True)
    
    def __repr__(self):
        return f"<CourseClass(title='{self.title}', course_id={self.course_id})>"