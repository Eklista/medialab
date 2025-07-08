"""
Modelo de tipos de usuario
"""

from sqlalchemy import Column, String, Text, DateTime, Integer
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import BaseModel


class UserType(BaseModel):
    """
    User types: CLIENT, COLLABORATOR, ADMIN, SUPERADMIN
    SEEDER table - populated during initialization
    """
    __tablename__ = "user_types"
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    dashboard_type = Column(String(50), nullable=False)  # portal, dashboard, godmode
    permissions = Column(JSON, nullable=False)  # JSON string with permissions
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    users = relationship("User", back_populates="user_type")

    def __repr__(self):
        return f"<UserType(id={self.id}, code='{self.code}', name='{self.name}')>"
