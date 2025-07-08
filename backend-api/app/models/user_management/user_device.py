"""
Modelo de dispositivos de usuario
"""

from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import BaseModel


class UserDevice(BaseModel):
    """
    User devices for tracking active logins and device management
    """
    __tablename__ = "user_devices"
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    device_name = Column(String(200))  # User-assigned name
    device_type = Column(String(50))  # mobile, desktop, tablet, etc.
    
    # Device fingerprinting
    user_agent = Column(Text)
    ip_address = Column(String(45))  # IPv6 compatible
    browser_info = Column(JSON)  # JSON string with browser details
    os_info = Column(JSON)  # JSON string with OS details
    
    # Security
    is_trusted = Column(Boolean, default=False)
    device_token = Column(String(255), unique=True)  # For push notifications
    
    # Activity
    first_seen = Column(DateTime(timezone=True), default=datetime.utcnow)
    last_seen = Column(DateTime(timezone=True), default=datetime.utcnow)
    login_count = Column(Integer, default=0)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_blocked = Column(Boolean, default=False)
    blocked_reason = Column(String(200))
    blocked_at = Column(DateTime(timezone=True))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships    user = relationship("User", back_populates="user_devices")

    def __repr__(self):
        return f"<UserDevice(id={self.id}, user_id={self.user_id}, device_type='{self.device_type}')>"