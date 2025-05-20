# app/models/requests/recurrent_events.py
from sqlalchemy import Column, String, Integer, Text, ForeignKey, Date, Time, JSON, Boolean, Index, UniqueConstraint
from sqlalchemy.orm import relationship, validates
from datetime import datetime, timedelta, date

from app.models.base import Base
from app.models.common.entity_mixin import EntityMixin

class RecurrentEvent(Base, EntityMixin):
    """
    Detalles para una actividad recurrente
    """
    __tablename__ = 'recurrent_events'
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey('requests.id'), nullable=False, unique=True)
    
    # Periodo de recurrencia
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    # Configuración de recurrencia
    recurrence_type = Column(String(50), nullable=False)  # 'daily', 'weekly', 'monthly', 'manual'
    recurrence_config = Column(JSON, nullable=True)  # Almacena patrones específicos (días semana, etc)
    
    # Relaciones
    request = relationship("Request", back_populates="recurrent_event")
    event_dates = relationship("EventDate", back_populates="recurrent_event", cascade="all, delete-orphan")
    
    # Índices
    __table_args__ = (
        Index('idx_recurrent_event_request', 'request_id'),
        Index('idx_recurrent_event_start_date', 'start_date'),
        Index('idx_recurrent_event_end_date', 'end_date'),
    )
    
    @validates('recurrence_type')
    def validate_recurrence_type(self, key, value):
        valid_types = ['daily', 'weekly', 'monthly', 'manual']
        if value not in valid_types:
            raise ValueError(f"El tipo de recurrencia debe ser uno de: {', '.join(valid_types)}")
        return value
    
    @validates('end_date')
    def validate_end_date(self, key, value):
        if hasattr(self, 'start_date') and self.start_date and value < self.start_date:
            raise ValueError("La fecha de fin debe ser posterior o igual a la fecha de inicio")
        return value
    
    @validates('end_time')
    def validate_end_time(self, key, value):
        if hasattr(self, 'start_time') and self.start_time and value <= self.start_time:
            raise ValueError("La hora de fin debe ser posterior a la hora de inicio")
        return value
    
    def __repr__(self):
        return f"<RecurrentEvent(id={self.id}, type={self.recurrence_type})>"


class EventDate(Base):
    """
    Fechas específicas para eventos recurrentes
    """
    __tablename__ = 'event_dates'
    
    id = Column(Integer, primary_key=True, index=True)
    recurrent_event_id = Column(Integer, ForeignKey('recurrent_events.id'), nullable=False)
    event_date = Column(Date, nullable=False)
    
    # Relaciones
    recurrent_event = relationship("RecurrentEvent", back_populates="event_dates")
    
    # Índices
    __table_args__ = (
        Index('idx_event_dates_event', 'recurrent_event_id'),
        Index('idx_event_dates_date', 'event_date'),
        UniqueConstraint('recurrent_event_id', 'event_date', name='uix_event_date')
    )
    
    def __repr__(self):
        return f"<EventDate(id={self.id}, date={self.event_date})>"