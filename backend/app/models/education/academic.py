# app/models/education/academic.py
from sqlalchemy import Column, String, Integer, Text, ForeignKey, UniqueConstraint, DateTime, Boolean, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import sqlalchemy as sa

from app.models.base import Base

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
    
    # Restricciones e índices
    __table_args__ = (
        UniqueConstraint('name', 'faculty_id', name='uix_career_name_faculty'),
        sa.Index('idx_career_faculty', 'faculty_id'),
        sa.Index('idx_career_code', 'code')
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
    
    # Relación con solicitud de curso (si proviene de una)
    course_request_id = Column(Integer, ForeignKey('course_requests.id'), nullable=True)
    course_request = relationship("CourseRequest", back_populates="academic_courses")
    
    # Relaciones
    classes = relationship("CourseClass", back_populates="course")
    
    # Estado
    status_id = Column(Integer, ForeignKey('statuses.id'), nullable=True)
    status = relationship("Status")
    
    # Restricciones e índices
    __table_args__ = (
        UniqueConstraint('code', 'career_id', name='uix_course_code_career'),
        sa.Index('idx_course_career', 'career_id'),
        sa.Index('idx_course_status', 'status_id'),
        sa.Index('idx_course_is_active', 'is_active'),
        sa.Index('idx_course_request', 'course_request_id')
    )
    
    @property
    def links(self):
        """
        Obtiene los enlaces asociados a este curso
        """
        from sqlalchemy.orm import object_session
        from app.models.communications.links import Link
        
        session = object_session(self)
        if not session:
            return []
        
        return session.query(Link).filter(
            Link.entity_type == 'course',
            Link.entity_id == self.id
        ).all()
    
    @property
    def all_links(self):
        """
        Obtiene todos los enlaces asociados a este curso y sus clases
        """
        from sqlalchemy.orm import object_session
        from app.models.communications.links import Link
        
        session = object_session(self)
        if not session:
            return []
        
        # Enlaces directos del curso
        course_links = session.query(Link).filter(
            Link.entity_type == 'course',
            Link.entity_id == self.id
        ).all()
        
        # Enlaces de todas las clases
        class_ids = [cls.id for cls in self.classes]
        class_links = [] if not class_ids else session.query(Link).filter(
            Link.entity_type == 'course_class',
            Link.entity_id.in_(class_ids)
        ).all()
        
        return course_links + class_links
    
    def add_link(self, session, url, platform_id=None, title=None, description=None, created_by=None):
        """
        Añade un enlace a este curso
        """
        from app.models.communications.links import Link
        return Link.create_for_entity(
            session, self, url, platform_id, title, description, created_by
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
    
    # Relación con profesor
    professor_id = Column(Integer, ForeignKey('professors.id'), nullable=True)
    professor = relationship("Professor")
    
    # Relación con solicitud de curso (para trazabilidad)
    course_item_id = Column(Integer, ForeignKey('course_items.id'), nullable=True)
    
    # Fechas
    scheduled_date = Column(DateTime, nullable=True)
    recording_date = Column(DateTime, nullable=True)
    
    # Estado
    status_id = Column(Integer, ForeignKey('statuses.id'), nullable=True)
    status = relationship("Status")
    
    # Índices
    __table_args__ = (
        sa.Index('idx_course_class_course', 'course_id'),
        sa.Index('idx_course_class_status', 'status_id'),
        sa.Index('idx_course_class_scheduled', 'scheduled_date'),
        sa.Index('idx_course_class_professor', 'professor_id'),
        sa.Index('idx_course_class_item', 'course_item_id')
    )
    
    @property
    def links(self):
        """
        Obtiene los enlaces asociados a esta clase
        """
        from sqlalchemy.orm import object_session
        from app.models.communications.links import Link
        
        session = object_session(self)
        if not session:
            return []
        
        return session.query(Link).filter(
            Link.entity_type == 'course_class',
            Link.entity_id == self.id
        ).all()
    
    def add_link(self, session, url, platform_id=None, title=None, description=None, created_by=None):
        """
        Añade un enlace a esta clase
        """
        from app.models.communications.links import Link
        return Link.create_for_entity(
            session, self, url, platform_id, title, description, created_by
        )
    
    def __repr__(self):
        return f"<CourseClass(title='{self.title}', course_id={self.course_id})>"