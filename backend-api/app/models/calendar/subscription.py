"""
Modelo para suscripciones de calendario.
"""

from sqlalchemy import Column, String, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship

from ..base import BaseModel
from enum import Enum


class SubscriptionType(Enum):
    """Tipos de suscripción de calendario."""
    PROJECT_CALENDAR = "PROJECT_CALENDAR"
    TEAM_CALENDAR = "TEAM_CALENDAR"
    USER_CALENDAR = "USER_CALENDAR"
    EQUIPMENT_CALENDAR = "EQUIPMENT_CALENDAR"


class CalendarSubscription(BaseModel):
    """
    Modelo para suscripciones de calendario.
    """
    __tablename__ = "calendar_subscriptions"
    
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    subscription_type = Column(SQLEnum(SubscriptionType), nullable=False)
    subscription_target_id = Column(String(36), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relaciones    user = relationship("User", back_populates="calendar_subscriptions")
    
    def __repr__(self):
        return f"<CalendarSubscription(id={self.id}, user_id='{self.user_id}', type='{self.subscription_type.value}')>"
