"""
Modelo para notificaciones del sistema.
"""

from sqlalchemy import Column, String, Text, Boolean, DateTime, Integer, ForeignKey, Enum as SQLEnum, JSON, Time
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship

from ..base import BaseModel
from enum import Enum


class NotificationStatus(Enum):
    """Estados de notificación."""
    QUEUED = "QUEUED"
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    READ = "READ"
    FAILED = "FAILED"


class NotificationFrequency(Enum):
    """Frecuencia de notificaciones."""
    INSTANT = "INSTANT"
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"


class Notification(BaseModel):
    """
    Modelo para notificaciones del sistema.
    """
    __tablename__ = "notifications"
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    notification_type_id = Column(String(36), ForeignKey("notification_types.id"), nullable=False, index=True)
    channel_id = Column(String(36), ForeignKey("notification_channels.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    data = Column(JSON, nullable=True)
    related_entity_type = Column(String(50), nullable=True)
    related_entity_id = Column(String(36), nullable=True)
    status = Column(SQLEnum(NotificationStatus), default=NotificationStatus.QUEUED, nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    failed_at = Column(DateTime(timezone=True), nullable=True)
    failure_reason = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    
    # Relaciones    user = relationship("User", back_populates="notifications")
    notification_type = relationship("NotificationType", back_populates="notifications")
    channel = relationship("NotificationChannel", back_populates="notifications")
    
    def __repr__(self):
        return f"<Notification(id={self.id}, user_id='{self.user_id}', title='{self.title[:50]}')>"


class UserNotificationPreference(BaseModel):
    """
    Modelo para preferencias de notificación por usuario.
    """
    __tablename__ = "user_notification_preferences"
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    notification_type_id = Column(String(36), ForeignKey("notification_types.id"), nullable=False, index=True)
    channel_id = Column(String(36), ForeignKey("notification_channels.id"), nullable=False, index=True)
    is_enabled = Column(Boolean, default=True, nullable=False)
    frequency = Column(SQLEnum(NotificationFrequency), default=NotificationFrequency.INSTANT, nullable=False)
    quiet_hours_start = Column(Time, nullable=True)
    quiet_hours_end = Column(Time, nullable=True)
    
    # Relaciones    user = relationship("User", back_populates="notifications")
    notification_type = relationship("NotificationType", back_populates="notifications")
    channel = relationship("NotificationChannel", back_populates="notifications")
    notification_batches = relationship("NotificationBatch", back_populates="notification")
    
    def __repr__(self):
        return f"<UserNotificationPreference(id={self.id}, user_id='{self.user_id}', enabled={self.is_enabled})>"
