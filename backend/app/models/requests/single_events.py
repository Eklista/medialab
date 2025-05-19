# app/models/requests/single_events.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, Time, Index
from sqlalchemy.orm import relationship

from app.models.base import Base

class SingleEvent(Base):
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
    request = relationship("Request", backref="single_event")
    
    # Índices
    __table_args__ = (
        Index('idx_single_event_request', 'request_id'),
    )
    
    def __repr__(self):
        return f"<SingleEvent(id={self.id}, event_date={self.event_date})>"