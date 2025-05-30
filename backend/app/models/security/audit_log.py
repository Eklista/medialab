# app/models/security/audit_log.py
from sqlalchemy import Column, String, Integer, Text, DateTime, JSON, Index, ForeignKey
from datetime import datetime
import sqlalchemy as sa

from app.models.base import Base

class AuditLog(Base):
    """
    Registro de auditoría para cambios en el sistema
    """
    __tablename__ = 'audit_logs'
    
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(50), nullable=False)  # create, update, delete, login, etc.
    
    # Entidad relacionada
    entity_id = Column(Integer, nullable=True)
    entity_type = Column(String(50), nullable=True)
    
    # Usuario que realizó la acción
    user_id = Column(Integer, nullable=True)

    # Para asignaciones
    assignee_id = Column(Integer, nullable=True)
    action_type = Column(String(50), nullable=True)
    
    # Datos de la acción
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    
    # Metadatos
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    details = Column(Text, nullable=True)

    # Categorías y visibilidad
    category = Column(String(50), nullable=True)  # 'content', 'user', 'system', 'workflow'
    visibility = Column(String(20), nullable=True, default='all')  # 'dashboard', 'report', 'system'
    importance = Column(Integer, nullable=True, default=1)  # 1-5 (5 más importante)
    department_id = Column(Integer, ForeignKey('departments.id'), nullable=True)
    related_users = Column(JSON, nullable=True)  # IDs de usuarios relacionados para notificaciones
    batch_id = Column(String(50), nullable=True)  # Para agrupar operaciones relacionadas
    
    # Índices
    __table_args__ = (
        sa.Index('idx_audit_log_entity', 'entity_type', 'entity_id'),
        sa.Index('idx_audit_log_user', 'user_id'),
        sa.Index('idx_audit_log_action', 'action'),
        sa.Index('idx_audit_log_timestamp', 'timestamp'),
        sa.Index('idx_audit_log_category', 'category'),
        sa.Index('idx_audit_log_importance', 'importance'),
        sa.Index('idx_audit_log_department', 'department_id'),
        sa.Index('idx_audit_log_batch', 'batch_id'),
        sa.Index('idx_audit_log_task_assignment', 'entity_type', 'action_type', 'assignee_id'),
        sa.Index('idx_audit_log_task_status', 'entity_type', 'action_type')
    )
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, action='{self.action}', entity_type='{self.entity_type}', entity_id={self.entity_id})>"