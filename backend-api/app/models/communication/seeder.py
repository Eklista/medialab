"""
Modelos SEEDER para notificaciones.
"""

from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship

from ..base import BaseModel


class NotificationChannel(BaseModel):
    id = Column(Integer, primary_key=True, index=True)
    """
    Modelo SEEDER para canales de notificación.
    """
    __tablename__ = "notification_channels"
    
    code = Column(String(100), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    configuration = Column(JSON, nullable=True)
    
    # Relaciones
    notification_types = relationship("NotificationType", secondary="notification_type_channels", back_populates="channels")
    notifications = relationship("Notification", back_populates="channel")
    user_preferences = relationship("UserNotificationPreference", back_populates="channel")
    templates = relationship("NotificationTemplate", back_populates="channel", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<NotificationChannel(id={self.id}, code='{self.code}', name='{self.name}')>"


class NotificationType(BaseModel):
    id = Column(Integer, primary_key=True, index=True)
    """
    Modelo SEEDER para tipos de notificación.
    """
    __tablename__ = "notification_types"
    
    code = Column(String(100), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    default_channels = Column(JSON, nullable=True)
    priority_level = Column(Integer, default=3, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relaciones
    channels = relationship("NotificationChannel", secondary="notification_type_channels", back_populates="notification_types")
    notifications = relationship("Notification", back_populates="notification_type")
    user_preferences = relationship("UserNotificationPreference", back_populates="notification_type")
    templates = relationship("NotificationTemplate", back_populates="notification_type", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<NotificationType(id={self.id}, code='{self.code}', category='{self.category}')>"


class NotificationTemplate(BaseModel):
    """
    Modelo para plantillas de notificación.
    """
    __tablename__ = "notification_templates"
    
    notification_type_id = Column(String(36), ForeignKey("notification_types.id"), nullable=False, index=True)
    channel_id = Column(String(36), ForeignKey("notification_channels.id"), nullable=False, index=True)
    subject_template = Column(String(500), nullable=True)
    body_template = Column(Text, nullable=False)
    variables = Column(JSON, nullable=True)
    language = Column(String(10), default="es", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relaciones
    notification_batches = relationship("NotificationBatch", back_populates="channel")
    notification_type = relationship("NotificationType", back_populates="templates")
    channel = relationship("NotificationChannel", back_populates="templates")
    
    def __repr__(self):
        return f"<NotificationTemplate(id={self.id}, type_id='{self.notification_type_id}', language='{self.language}')>"


# Tabla de relación many-to-many entre NotificationType y NotificationChannel
class NotificationTypeChannel(BaseModel):
    """
    Tabla de relación entre tipos de notificación y canales.
    """
    __tablename__ = "notification_type_channels"
    
    notification_type_id = Column(String(36), ForeignKey("notification_types.id"), nullable=False, index=True)
    channel_id = Column(String(36), ForeignKey("notification_channels.id"), nullable=False, index=True)
    is_default = Column(Boolean, default=False, nullable=False)
    
    def __repr__(self):
        return f"<NotificationTypeChannel(type_id='{self.notification_type_id}', channel_id='{self.channel_id}')>"
