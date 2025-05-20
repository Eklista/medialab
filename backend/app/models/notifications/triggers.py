from sqlalchemy import Column, String, Integer, Boolean, JSON, ForeignKey, UniqueConstraint
from app.models.base import Base

class NotificationTrigger(Base):
    """
    Define qué eventos generan notificaciones y para quién
    """
    __tablename__ = 'notification_triggers'
    
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False)  # 'task', 'project', etc.
    action = Column(String(50), nullable=False)  # 'create', 'update', 'status_change'
    
    # Configuración
    notify_roles = Column(JSON, nullable=True)  # IDs de roles a notificar
    notify_departments = Column(JSON, nullable=True)  # IDs de departamentos a notificar
    notify_entity_owner = Column(Boolean, default=True)  # Notificar al dueño
    notify_entity_assignee = Column(Boolean, default=True)  # Notificar al asignado
    
    # Opciones adicionales
    notification_template = Column(String(100), nullable=True)  # Código de plantilla
    importance = Column(Integer, default=1)  # Prioridad (1-5)
    
    # Restricciones
    __table_args__ = (
        UniqueConstraint('entity_type', 'action', name='uix_notification_entity_action'),
    )