# app/models/requests/single_events.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, Time, Index
from sqlalchemy.orm import relationship, validates
from datetime import datetime, time, timedelta

from app.models.base import Base
from app.models.common.entity_mixin import EntityMixin

class SingleEvent(Base, EntityMixin):
    """
    Detalles para una actividad única
    """
    __tablename__ = 'single_events'
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey('requests.id'), nullable=False, unique=True)
    
    # Detalles específicos para actividad única
    event_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    # Relaciones
    request = relationship("Request", back_populates="single_event", uselist=False)

    # Índices
    __table_args__ = (
        Index('idx_single_event_request', 'request_id'),
        Index('idx_single_event_date', 'event_date'),
    )
    
    @validates('end_time')
    def validate_end_time(self, key, value):
        """Validar que la hora de fin sea posterior a la hora de inicio"""
        if hasattr(self, 'start_time') and self.start_time and value <= self.start_time:
            raise ValueError("La hora de fin debe ser posterior a la hora de inicio")
        return value
    
    def __repr__(self):
        return f"<SingleEvent(id={self.id}, event_date={self.event_date})>"