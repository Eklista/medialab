"""
University Extended Models - Carreras y clases específicas
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import Base

class Career(Base):
    """
    Carreras universitarias
    Programas académicos específicos de la universidad
    """
    __tablename__ = "careers"
    
    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculties.id"), nullable=False, index=True)
    
    # Información básica
    name = Column(String(300), nullable=False)
    code = Column(String(20), nullable=False, unique=True)
    description = Column(Text)
    
    # Detalles académicos
    duration_semesters = Column(Integer)
    total_credits = Column(Integer)
    degree_type = Column(String(100))  # 'bachelor', 'master', 'phd', 'technician'
    
    # Modalidad
    modality = Column(String(50))  # 'presencial', 'virtual', 'mixta'
    language = Column(String(50), default='español')
    
    # Información adicional
    admission_requirements = Column(Text)
    career_profile = Column(Text)
    occupational_field = Column(Text)
    
    # Control
    is_active = Column(Boolean, default=True)
    accepts_new_students = Column(Boolean, default=True)
    
    # SEO y web
    slug = Column(String(300), unique=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    faculty = relationship("Faculty", back_populates="careers")
    classes = relationship("Class", back_populates="career")
    students = relationship("Student", back_populates="career")
    
    def __repr__(self):
        return f"<Career(name='{self.name}', code='{self.code}')>"

class Class(Base):
    id = Column(Integer, primary_key=True, index=True)
    """
    Clases específicas
    Clases individuales dentro de cursos y carreras
    """
    __tablename__ = "classes"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    career_id = Column(Integer, ForeignKey("careers.id"), nullable=True, index=True)  # Puede ser específica de carrera
    
    # Información de la clase
    name = Column(String(300), nullable=False)
    class_number = Column(String(20))  # Número o código de la clase
    description = Column(Text)
    
    # Programación
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, default=90)
    classroom = Column(String(100))
    
    # Tipo de clase
    class_type = Column(String(50))  # 'lecture', 'lab', 'seminar', 'workshop', 'exam'
    is_mandatory = Column(Boolean, default=True)
    
    # Contenido y recursos
    topics_covered = Column(Text)
    required_materials = Column(Text)
    preparation_notes = Column(Text)
    
    # Instructor
    instructor_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    guest_instructor = Column(String(200))  # Para instructores externos
    
    # Estado
    status = Column(String(50), default='scheduled')  # 'scheduled', 'in_progress', 'completed', 'cancelled'
    
    # Asistencia y evaluación
    attendance_required = Column(Boolean, default=True)
    has_evaluation = Column(Boolean, default=False)
    evaluation_weight = Column(Integer, default=0)  # Peso en la nota final
    
    # Recursos digitales
    meeting_url = Column(String(500))  # Para clases virtuales
    recording_url = Column(String(500))
    presentation_url = Column(String(500))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    course = relationship("Course", back_populates="classes")
    career = relationship("Career", back_populates="classes")    instructor = relationship("User", back_populates="career_instructions")
    
    def __repr__(self):
        return f"<Class(name='{self.name}', date='{self.scheduled_date}', type='{self.class_type}')>"
