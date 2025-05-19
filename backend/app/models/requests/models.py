# app/models/requests/models.py
from sqlalchemy import (Column, String, Integer, Text, Boolean, DateTime, ForeignKey, 
                        Index, JSON, Enum, func)
from sqlalchemy.orm import relationship, validates
from datetime import datetime, date, time

from app.models.base import Base
from app.models.common.workflow import WorkItem

class Request(WorkItem):
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
    
    # Relaciones
    requester = relationship("User", foreign_keys=[requester_id])
    department = relationship("Department")
    
    # Relación con proyecto (cuando se convierte)
    converted_to_project_id = Column(Integer, ForeignKey('projects.id'), nullable=True)
    project = relationship("Project", foreign_keys=[converted_to_project_id], back_populates="originating_request")
    
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
    
    def __repr__(self):
        return f"<Request(id={self.id}, activity_type='{self.activity_type}', processed={self.is_processed})>"