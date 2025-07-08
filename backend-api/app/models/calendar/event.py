"""
Modelos para el sistema de calendario y eventos.
"""

from sqlalchemy import Column, String, DateTime, Boolean, Text, Integer, Enum as SQLEnum, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship

from ..base import BaseModel
from enum import Enum


class EventVisibility(Enum):
    """Visibilidad del evento."""
    PUBLIC = "PUBLIC"
    TEAM = "TEAM"
    PROJECT = "PROJECT"
    PRIVATE = "PRIVATE"


class EventStatus(Enum):
    """Estado del evento."""
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    POSTPONED = "POSTPONED"


class AttendanceStatus(Enum):
    """Estado de asistencia."""
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    TENTATIVE = "TENTATIVE"
    NO_RESPONSE = "NO_RESPONSE"


class EventRole(Enum):
    """Rol en el evento."""
    ORGANIZER = "ORGANIZER"
    PRESENTER = "PRESENTER"
    PARTICIPANT = "PARTICIPANT"
    OBSERVER = "OBSERVER"
    TECHNICAL_SUPPORT = "TECHNICAL_SUPPORT"


class ResourceType(Enum):
    """Tipo de recurso."""
    EQUIPMENT = "EQUIPMENT"
    ROOM = "ROOM"
    VEHICLE = "VEHICLE"


class ResourceStatus(Enum):
    """Estado de la reserva de recurso."""
    REQUESTED = "REQUESTED"
    CONFIRMED = "CONFIRMED"
    DENIED = "DENIED"


class CalendarEvent(BaseModel):
    """
    Modelo para eventos del calendario.
    """
    __tablename__ = "calendar_events"
    event_type_id = Column(String(36), ForeignKey("event_types.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    all_day = Column(Boolean, default=False, nullable=False)
    location = Column(String(255), nullable=True)
    created_by_user_id = Column(UUID, ForeignKey("users.id"), nullable=False, index=True)
    related_entity_type = Column(String(50), nullable=True)
    related_entity_id = Column(String(36), nullable=True)
    is_system_generated = Column(Boolean, default=False, nullable=False)
    visibility = Column(SQLEnum(EventVisibility), default=EventVisibility.PUBLIC, nullable=False)
    status = Column(SQLEnum(EventStatus), default=EventStatus.SCHEDULED, nullable=False)
    reminder_minutes = Column(Integer, nullable=True)
    recurrence_rule = Column(JSON, nullable=True)
    
    # Relaciones
    event_type = relationship("EventType", back_populates="calendar_events")
    created_by = relationship("User", foreign_keys=[created_by_user_id], back_populates="created_events")
    attendees = relationship("EventAttendee", back_populates="event", cascade="all, delete-orphan")
    resources = relationship("EventResource", back_populates="event", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<CalendarEvent(id={self.id}, title='{self.title}', start_date='{self.start_date}')>"


class EventAttendee(BaseModel):
    """
    Modelo para asistentes de eventos.
    """
    __tablename__ = "event_attendees"
    event_id = Column(String(36), ForeignKey("calendar_events.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    attendance_status = Column(SQLEnum(AttendanceStatus), default=AttendanceStatus.PENDING, nullable=False)
    role = Column(SQLEnum(EventRole), default=EventRole.PARTICIPANT, nullable=False)
    is_required = Column(Boolean, default=False, nullable=False)
    invited_at = Column(DateTime(timezone=True), nullable=True)
    responded_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relaciones
    event = relationship("CalendarEvent", back_populates="attendees")
    user = relationship("User", back_populates="calendar_events")
    
    def __repr__(self):
        return f"<EventAttendee(id={self.id}, event_id='{self.event_id}', user_id='{self.user_id}')>"


class EventResource(BaseModel):
    """
    Modelo para recursos de eventos.
    """
    __tablename__ = "event_resources"
    event_id = Column(String(36), ForeignKey("calendar_events.id"), nullable=False, index=True)
    resource_type = Column(SQLEnum(ResourceType), nullable=False)
    resource_id = Column(String(36), nullable=False, index=True)
    quantity_needed = Column(Integer, default=1, nullable=False)
    status = Column(SQLEnum(ResourceStatus), default=ResourceStatus.REQUESTED, nullable=False)
    notes = Column(Text, nullable=True)
    
    # Relaciones
    recurrence_config = relationship("CalendarView", back_populates="parent_event")
    event = relationship("CalendarEvent", remote_side="CalendarEvent.id", back_populates="resources")
    
    def __repr__(self):
        return f"<EventResource(id={self.id}, event_id='{self.event_id}', resource_type='{self.resource_type.value}')>"
