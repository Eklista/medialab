"""
Modelo de proyectos tipo curso
Especialización de Project para cursos educativos
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import Base


class Course(Base):
    """
    Proyectos específicos para cursos educativos
    Extiende la funcionalidad de Project para cursos
    """
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Información académica
    course_code = Column(String(20), unique=True)  # Código del curso
    credit_hours = Column(Integer)  # Horas crédito
    academic_level = Column(String(50))  # undergraduate, graduate, professional
    
    # Modalidad
    delivery_mode = Column(String(50))  # presencial, virtual, híbrido
    language = Column(String(20), default="es")  # Idioma del curso
    
    # Capacidad y participantes
    max_participants = Column(Integer)
    min_participants = Column(Integer)
    current_participants = Column(Integer, default=0)
    
    # Horarios
    schedule_days = Column(String(20))  # L-M-V, S, etc.
    schedule_time = Column(String(50))  # 08:00-10:00
    total_sessions = Column(Integer)  # Total de sesiones
    session_duration_hours = Column(Integer)  # Duración por sesión
    
    # Contenido
    syllabus = Column(Text)  # Programa del curso
    learning_objectives = Column(Text)  # Objetivos de aprendizaje
    prerequisites = Column(Text)  # Prerrequisitos
    evaluation_methods = Column(Text)  # Métodos de evaluación
    
    # Recursos
    required_materials = Column(Text)  # Materiales requeridos
    recommended_readings = Column(Text)  # Lecturas recomendadas
    
    # Estado del curso
    is_certified = Column(Boolean, default=False)  # Si otorga certificación
    certification_entity = Column(String(200))  # Entidad que certifica
    
    # Relación con el proyecto base
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)    project = relationship("Project", back_populates="courses")
    
    # Relaciones adicionales
    classes = relationship("Career", back_populates="course", remote_side="Career.id")
    instructor_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    instructor = relationship("User", foreign_keys=[instructor_id], back_populates="instructed_courses")
    
    # Fechas
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Course(id={self.id}, course_code='{self.course_code}', project_id={self.project_id})>"
