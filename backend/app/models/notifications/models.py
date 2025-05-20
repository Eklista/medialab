from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class Notification(Base):
    """
    Notificaciones para usuarios basadas en eventos del sistema
    """
    __tablename__ = 'notifications'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    audit_log_id = Column(Integer, ForeignKey('audit_logs.id'), nullable=True)
    
    title = Column(String(255), nullable=False)
    content = Column(String(500), nullable=False)
    link = Column(String(255), nullable=True)  # Enlace dentro de la aplicación
    
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    importance = Column(Integer, default=1)  # 1-5
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relaciones
    user = relationship("User")
    audit_log = relationship("AuditLog")
    
    # Índices
    __table_args__ = (
        Index('idx_notification_user', 'user_id'),
        Index('idx_notification_read', 'is_read'),
        Index('idx_notification_importance', 'importance'),
    )