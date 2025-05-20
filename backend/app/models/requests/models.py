# app/models/requests/models.py
from sqlalchemy import (Column, String, Integer, Text, Boolean, DateTime, ForeignKey, 
                        Index, JSON, Enum, func, Date)
from sqlalchemy.orm import relationship, validates
from datetime import datetime, date, time

from app.models.base import Base
from app.models.common.workflow import WorkItem
from app.models.common.entity_mixin import EntityMixin

class Request(WorkItem, EntityMixin):
    """
    Solicitudes de trabajo/servicios - Punto de entrada para todas las solicitudes
    """
    __tablename__ = 'requests'
    
    id = Column(Integer, ForeignKey('work_items.id'), primary_key=True)
    
    # Tipo de actividad solicitada
    activity_type = Column(String(50), nullable=False)  # 'single', 'recurrent', 'podcast', 'course'
    
    # Datos del solicitante
    requester_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    department_id = Column(Integer, ForeignKey('departments.id'), nullable=True)
    contact_info = Column(JSON, nullable=True)  # Para almacenar email, teléfono, etc.
    
    # Fechas
    request_date = Column(Date, nullable=False, default=func.current_date())
    desired_date = Column(DateTime, nullable=True)  # Fecha deseada para la actividad
    
    # Ubicación
    location_type = Column(String(50), nullable=True)  # 'university', 'external', 'virtual'
    location_details = Column(JSON, nullable=True)
    
    # Estado del procesamiento
    is_processed = Column(Boolean, default=False)  # Indica si la solicitud ya fue procesada/convertida
    processing_notes = Column(Text, nullable=True)  # Notas sobre el procesamiento

    # Auditoría
    deleted_at = Column(DateTime, nullable=True)
    deleted_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)

    # Relaciones
    requester = relationship("User", foreign_keys=[requester_id])
    department = relationship("Department")

    # Relación con el usuario institucional (si aplica)
    requester_institutional_id = Column(Integer, ForeignKey('institutional_users.id'), nullable=True)
    institutional_requester = relationship("InstitutionalUser", back_populates="requests")
    
    # Relaciones con tipos específicos
    single_event = relationship("SingleEvent", back_populates="request", uselist=False, cascade="all, delete-orphan")
    recurrent_event = relationship("RecurrentEvent", back_populates="request", uselist=False, cascade="all, delete-orphan")
    podcast_request = relationship("PodcastRequest", back_populates="request", uselist=False, cascade="all, delete-orphan")
    course_request = relationship("CourseRequest", back_populates="request", uselist=False, cascade="all, delete-orphan")
    
    # Relaciones con servicios seleccionados
    services = relationship("Service", secondary="request_services", viewonly=True)
    sub_services = relationship("SubService", secondary="request_sub_services", viewonly=True)
    
    # Relación con proyecto (cuando se convierte) - sin referencia circular
    project = relationship("Project", back_populates="originating_request", uselist=False)
    
    # Configuración del mapper
    __mapper_args__ = {
        'polymorphic_identity': 'request',
    }
    
    # Índices
    __table_args__ = (
        Index('idx_request_requester', 'requester_id'),
        Index('idx_request_department', 'department_id'),
        Index('idx_request_activity_type', 'activity_type'),
        Index('idx_request_is_processed', 'is_processed')
    )
    
    @validates('activity_type')
    def validate_activity_type(self, key, value):
        valid_types = ['single', 'recurrent', 'podcast', 'course']
        if value not in valid_types:
            raise ValueError(f"El tipo de actividad debe ser uno de: {', '.join(valid_types)}")
        return value
    
    @validates('location_type')
    def validate_location_type(self, key, value):
        if value is not None:
            valid_types = ['university', 'external', 'virtual']
            if value not in valid_types:
                raise ValueError(f"El tipo de ubicación debe ser uno de: {', '.join(valid_types)}")
        return value
    
    def __repr__(self):
        return f"<Request(id={self.id}, activity_type='{self.activity_type}', processed={self.is_processed})>"