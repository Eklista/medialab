"""
Modelos SEEDER para tipos de eventos y otras entidades del calendario.
"""

from sqlalchemy import Column, String, Text, Boolean
from sqlalchemy.orm import relationship

from ..base import BaseModel


class EventType(BaseModel):
    """
    Modelo SEEDER para tipos de eventos del calendario.
    """
    __tablename__ = "event_types"
    code = Column(String(100), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(50), nullable=True)
    icon = Column(String(100), nullable=True)
    is_system_generated = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relaciones
    calendar_events = relationship("CalendarEvent", back_populates="event_type")
    
    def __repr__(self):
        return f"<EventType(id={self.id}, code='{self.code}', name='{self.name}')>"


class LinkPlatform(BaseModel):
    """
    Modelo SEEDER para plataformas de enlaces.
    """
    __tablename__ = "link_platforms"
    code = Column(String(100), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    domain_pattern = Column(String(255), nullable=True)
    url_validation_regex = Column(Text, nullable=True)
    icon = Column(String(100), nullable=True)
    color = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relaciones
    task_links = relationship("TaskLink", back_populates="link_platform")
    
    def __repr__(self):
        return f"<LinkPlatform(id={self.id}, code='{self.code}', name='{self.name}')>"
