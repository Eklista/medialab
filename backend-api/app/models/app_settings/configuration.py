"""
Modelo para configuraciones del sistema.
"""

from sqlalchemy import Column, String, Text, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship

from ..base import BaseModel
from enum import Enum


class ConfigurationType(Enum):
    id = Column(Integer, primary_key=True, index=True)
    """Tipos de configuración."""
    STRING = "STRING"
    INTEGER = "INTEGER"
    BOOLEAN = "BOOLEAN"
    JSON = "JSON"
    URL = "URL"
    EMAIL = "EMAIL"


class ChangeType(Enum):
    """Tipos de cambio."""
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    CREATE = "CREATE"
    ROLLBACK = "ROLLBACK"


class Configuration(BaseModel):
    """
    Modelo para configuraciones del sistema.
    """
    __tablename__ = "configurations"
    
    key = Column(String(255), nullable=False, unique=True, index=True)
    value = Column(Text, nullable=True)
    type = Column(SQLEnum(ConfigurationType), nullable=False)
    is_encrypted = Column(Boolean, default=False, nullable=False)
    description = Column(Text, nullable=True)
    
    # Relaciones
    history = relationship("ConfigurationHistory", back_populates="configuration", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Configuration(id={self.id}, key='{self.key}', type='{self.type.value}')>"


class ConfigurationHistory(BaseModel):
    """
    Modelo para historial de cambios de configuración.
    """
    __tablename__ = "configuration_histories"
    
    configuration_id = Column(String(36), ForeignKey("configurations.id"), nullable=False, index=True)
    changed_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    change_reason = Column(Text, nullable=True)
    change_type = Column(SQLEnum(ChangeType), nullable=False)
    requires_restart = Column(Boolean, default=False, nullable=False)
    approved_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    rollback_available = Column(Boolean, default=True, nullable=False)
    
    # Relaciones
    configuration = relationship("Configuration", back_populates="history")
    changed_by = relationship("User", foreign_keys=[changed_by_user_id], back_populates="configuration_changes")
    approved_by = relationship("User", foreign_keys=[approved_by_user_id], back_populates="configuration_approvals")
    
    def __repr__(self):
        return f"<ConfigurationHistory(id={self.id}, config_id='{self.configuration_id}', change_type='{self.change_type.value}')>"
