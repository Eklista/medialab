"""
Modelos para políticas y configuración de auditoría.
"""

from sqlalchemy import Column, String, Text, Boolean, Integer, Date, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship

from ..base import BaseModel


class AuditLogType(BaseModel):
    id = Column(Integer, primary_key=True, index=True)
    """
    Modelo para tipos de logs de auditoría.
    """
    __tablename__ = "audit_log_types"
    
    code = Column(String(100), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(50), nullable=True)
    icon = Column(String(100), nullable=True)
    severity_level = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relaciones
    retention_policies = relationship("AuditRetentionPolicy", back_populates="audit_log_type", cascade="restrict")  # Previene eliminación accidental
    alerts = relationship("AuditAlert", back_populates="audit_log_type", cascade="restrict")  # Previene eliminación accidental
    
    def __repr__(self):
        return f"<AuditLogType(id={self.id}, code='{self.code}', name='{self.name}')>"


class AuditRetentionPolicy(BaseModel):
    """
    Modelo para políticas de retención de logs de auditoría.
    """
    __tablename__ = "audit_retention_policies"
    
    audit_log_type_id = Column(String(36), ForeignKey("audit_log_types.id"), nullable=False, index=True)
    retention_days = Column(Integer, nullable=False)
    archive_after_days = Column(Integer, nullable=True)
    auto_delete = Column(Boolean, default=False, nullable=False)
    compress_archive = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relaciones
    audit_log_type = relationship("AuditLogType", back_populates="retention_policies")
    
    def __repr__(self):
        return f"<AuditRetentionPolicy(id={self.id}, type_id='{self.audit_log_type_id}', retention_days={self.retention_days})>"


class AuditAlert(BaseModel):
    """
    Modelo para alertas de auditoría.
    """
    __tablename__ = "audit_alerts"
    
    audit_log_type_id = Column(String(36), ForeignKey("audit_log_types.id"), nullable=False, index=True)
    condition_rules = Column(JSON, nullable=False)
    alert_recipients = Column(JSON, nullable=False)
    alert_channels = Column(JSON, nullable=False)
    cooldown_minutes = Column(Integer, default=60, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relaciones
    audit_log_type = relationship("AuditLogType", back_populates="alerts")
    
    def __repr__(self):
        return f"<AuditAlert(id={self.id}, type_id='{self.audit_log_type_id}', active={self.is_active})>"


class AuditStatistics(BaseModel):
    """
    Modelo para estadísticas de auditoría.
    """
    __tablename__ = "audit_statistics"
    
    date = Column(Date, nullable=False, index=True)
    total_actions = Column(Integer, default=0, nullable=False)
    unique_users = Column(Integer, default=0, nullable=False)
    most_active_user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    most_common_action = Column(String(255), nullable=True)
    peak_hour = Column(Integer, nullable=True)
    error_count = Column(Integer, default=0, nullable=False)
    suspicious_activities = Column(Integer, default=0, nullable=False)
    
    # Relaciones
    most_active_user = relationship("User", back_populates="audit_statistics")
    
    def __repr__(self):
        return f"<AuditStatistics(id={self.id}, date='{self.date}', total_actions={self.total_actions})>"
