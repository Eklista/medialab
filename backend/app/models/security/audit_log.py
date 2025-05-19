# app/models/security/audit_log.py
from sqlalchemy import Column, String, Integer, Text, DateTime, JSON, Index
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
    
    # Datos de la acción
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    
    # Metadatos
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    details = Column(Text, nullable=True)  # Detalles adicionales
    
    # Índices
    __table_args__ = (
        sa.Index('idx_audit_log_entity', 'entity_type', 'entity_id'),
        sa.Index('idx_audit_log_user', 'user_id'),
        sa.Index('idx_audit_log_action', 'action'),
        sa.Index('idx_audit_log_timestamp', 'timestamp')
    )
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, action='{self.action}', entity_type='{self.entity_type}', entity_id={self.entity_id})>"
    
    @classmethod
    def log_action(cls, session, action, entity_type, entity_id, user_id, 
                  old_values=None, new_values=None, ip_address=None, user_agent=None, details=None):
        """
        Método de clase para crear fácilmente entradas de auditoría
        """
        audit_entry = cls(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            user_id=user_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details
        )
        session.add(audit_entry)
        return audit_entry