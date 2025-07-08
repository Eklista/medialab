"""
Modelo para tipos de usuario del sistema.
"""

from sqlalchemy import Column, String, Text, Boolean, Enum as SQLEnum, JSON
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship

from ..base import BaseModel
from enum import Enum


class DashboardType(Enum):
    """Tipos de dashboard."""
    PORTAL = "PORTAL"        # Portal clientes (/portal/)
    DASHBOARD = "DASHBOARD"  # Dashboard colaboradores (/dashboard/)
    GODMODE = "GODMODE"      # Godmode (/godmode/)


class UserTypeSetting(BaseModel):
    """
    Modelo para configuraciones de tipos de usuario del sistema.
    """
    __tablename__ = "user_type_settings"
    code = Column(String(100), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    dashboard_type = Column(SQLEnum(DashboardType), nullable=False)
    permissions = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    def __repr__(self):
        return f"<UserTypeSetting(id={self.id}, code='{self.code}', name='{self.name}')>"
