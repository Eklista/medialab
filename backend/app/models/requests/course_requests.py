# app/models/requests/course_requests.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, Time, JSON, Boolean, Index, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.base import Base

class CourseRequest(Base):
    """
    Solicitud para cursos académicos
    """
    __tablename__ = 'course_requests'
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey('requests.id'), nullable=False, unique=True)
    
    # Información del curso
    career_name = Column(String(255), nullable=False)
    course_description = Column(Text, nullable=True)
    
    # Facultad/Departamento principal
    faculty_id = Column(Integer, ForeignKey('departments.id'), nullable=False)
    
    # Configuración de recurrencia
    is_recurrent = Column(Boolean, default=False)
    recurrence_type = Column(String(50), nullable=True)  # 'daily', 'weekly', 'monthly', 'manual'
    recurrence_config = Column(JSON, nullable=True)
    
    # Relaciones
    request = relationship("Request", back_populates="course_request")
    faculty = relationship("Department")
    courses = relationship("CourseItem", back_populates="course_request", cascade="all, delete-orphan")
    
    # Relación con el curso académico (si se convierte) - sin referencia circular
    academic_courses = relationship("Course", back_populates="course_request")
    
    # Índices
    __table_args__ = (
        Index('idx_course_request_request', 'request_id'),
        Index('idx_course_request_faculty', 'faculty_id'),
    )
    
    @property
    def links(self):
        """
        Obtiene los enlaces asociados a esta solicitud de curso
        """
        from sqlalchemy.orm import object_session
        from app.models.communications.links import Link
        
        session = object_session(self)
        if not session:
            return []
        
        return session.query(Link).filter(
            Link.entity_type == 'course_request',
            Link.entity_id == self.id
        ).all()
    
    def add_link(self, session, url, platform_id=None, title=None, description=None, created_by=None):
        """
        Añade un enlace a esta solicitud de curso
        """
        from app.models.communications.links import Link
        return Link.create_for_entity(
            session, self, url, platform_id, title, description, created_by
        )
    
    def __repr__(self):
        return f"<CourseRequest(id={self.id}, career='{self.career_name}')>"


class CourseItem(Base):
    """
    Cursos individuales dentro de una solicitud de curso
    """
    __tablename__ = 'course_items'
    
    id = Column(Integer, primary_key=True, index=True)
    course_request_id = Column(Integer, ForeignKey('course_requests.id'), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Información del catedrático
    professor_id = Column(Integer, ForeignKey('professors.id'), nullable=True)  # Si ya existe en el sistema
    professor_name = Column(String(255), nullable=True)  # Si es nuevo/externo
    
    # Departamento/Facultad 
    faculty_id = Column(Integer, ForeignKey('departments.id'), nullable=True)
    
    # Duración estimada
    duration = Column(String(50), nullable=True)  # Ej: "1:30 horas"
    
    # Relaciones
    course_request = relationship("CourseRequest", back_populates="courses")
    faculty = relationship("Department")
    professor = relationship("Professor")
    recording_dates = relationship("CourseRecordingDate", back_populates="course_item", cascade="all, delete-orphan")
    
    # Índices
    __table_args__ = (
        Index('idx_course_item_request', 'course_request_id'),
        Index('idx_course_item_faculty', 'faculty_id'),
        Index('idx_course_item_professor', 'professor_id'),
    )
    
    @property
    def links(self):
        """
        Obtiene los enlaces asociados a este ítem de curso
        """
        from sqlalchemy.orm import object_session
        from app.models.communications.links import Link
        
        session = object_session(self)
        if not session:
            return []
        
        return session.query(Link).filter(
            Link.entity_type == 'course_item',
            Link.entity_id == self.id
        ).all()
    
    def add_link(self, session, url, platform_id=None, title=None, description=None, created_by=None):
        """
        Añade un enlace a este ítem de curso
        """
        from app.models.communications.links import Link
        return Link.create_for_entity(
            session, self, url, platform_id, title, description, created_by
        )
    
    def __repr__(self):
        return f"<CourseItem(id={self.id}, name='{self.name}')>"


class CourseRecordingDate(Base):
    """
    Fechas de grabación para un curso
    """
    __tablename__ = 'course_recording_dates'
    
    id = Column(Integer, primary_key=True, index=True)
    course_item_id = Column(Integer, ForeignKey('course_items.id'), nullable=False)
    recording_date = Column(Date, nullable=False)
    recording_time = Column(Time, nullable=True)
    
    # Relaciones
    course_item = relationship("CourseItem", back_populates="recording_dates")
    
    # Índices
    __table_args__ = (
        Index('idx_course_recording_dates_course', 'course_item_id'),
        UniqueConstraint('course_item_id', 'recording_date', name='uix_course_recording_date')
    )
    
    def __repr__(self):
        return f"<CourseRecordingDate(id={self.id}, date={self.recording_date})>"