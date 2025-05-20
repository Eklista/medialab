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

    @property
    def tasks(self):
        """Obtiene las tareas asociadas a esta actividad"""
        from sqlalchemy.orm import object_session
        from app.models.projects.models import Task
        
        session = object_session(self)
        if not session:
            return []
        
        entity_type = self.__tablename__
        if entity_type.endswith('s'):
            entity_type = entity_type[:-1]
        
        return Task.get_for_activity(session, entity_type, self.id)
    
    @validates('end_time')
    def validate_end_time(self, key, value):
        """Validar que la hora de fin sea posterior a la hora de inicio"""
        if hasattr(self, 'start_time') and self.start_time and value <= self.start_time:
            raise ValueError("La hora de fin debe ser posterior a la hora de inicio")
        return value
    
    def get_duration_minutes(self):
        """
        Calcula la duración del evento en minutos
        
        Returns:
            int: Duración en minutos
        """
        if not self.start_time or not self.end_time:
            return 0
            
        # Crear una fecha dummy para hacer el cálculo
        base_date = datetime.now().date()
        start_dt = datetime.combine(base_date, self.start_time)
        end_dt = datetime.combine(base_date, self.end_time)
        
        # Si la hora de fin es menor que la de inicio, asumimos que es al día siguiente
        if end_dt < start_dt:
            end_dt = end_dt + timedelta(days=1)
            
        return int((end_dt - start_dt).total_seconds() / 60)
    
    def has_conflict_with(self, other_event):
        """
        Verifica si hay conflicto con otro evento
        
        Args:
            other_event (SingleEvent): Otro evento para verificar conflicto
            
        Returns:
            bool: True si hay conflicto, False si no
        """
        if self.event_date != other_event.event_date:
            return False
        
        # Verificar solapamiento de horarios
        return (
            (self.start_time <= other_event.start_time < self.end_time) or
            (self.start_time < other_event.end_time <= self.end_time) or
            (other_event.start_time <= self.start_time < other_event.end_time) or
            (other_event.start_time < self.end_time <= other_event.end_time)
        )
    
    def __repr__(self):
        return f"<SingleEvent(id={self.id}, event_date={self.event_date})>"