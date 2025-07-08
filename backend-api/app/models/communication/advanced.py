"""
Notification Extended Models - Lotes, logs, programación y plantillas
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import BaseModel

class NotificationBatch(BaseModel):
    """
    Lotes de notificaciones
    Agrupación de notificaciones enviadas en lote
    """
    __tablename__ = "notification_batches"    # Información del lote
    batch_name = Column(String(200))
    batch_type = Column(String(100), nullable=False)  # 'broadcast', 'targeted', 'automated'
    
    # Configuración del envío
    template_id = Column(Integer, ForeignKey("notification_templates.id"), index=True, nullable=False)
    channel_id = Column(Integer, ForeignKey("notification_channels.id"), nullable=False, index=True)
    
    # Estadísticas
    total_recipients = Column(Integer, default=0)
    successful_sends = Column(Integer, default=0)
    failed_sends = Column(Integer, default=0)
    
    # Estado
    status = Column(String(50), default='pending')  # 'pending', 'processing', 'completed', 'failed'
    
    # Programación
    scheduled_at = Column(DateTime(timezone=True))
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    # Filtros de destinatarios
    recipient_filters = Column(JSON)
    
    # Usuario que creó el lote
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones    template = relationship("NotificationTemplate", back_populates="notification_batches")
    channel = relationship("NotificationChannel", back_populates="notification_batches")
    created_by = relationship("User", back_populates="created_notification_batches")
    logs = relationship("NotificationLog", back_populates="batch")
    
    def __repr__(self):
        return f"<NotificationBatch(name='{self.batch_name}', status='{self.status}')>"

class NotificationLog(BaseModel):
    """
    Logs de notificaciones
    Registro detallado de cada notificación enviada
    """
    __tablename__ = "notification_logs"
    notification_id = Column(Integer, ForeignKey("notifications.id"), index=True, nullable=False)
    batch_id = Column(Integer, ForeignKey("notification_batches.id"), index=True, nullable=False)
    
    # Detalles del envío
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    channel_used = Column(String(50), nullable=False)
    
    # Resultado del envío
    status = Column(String(50), nullable=False)  # 'sent', 'failed', 'bounced', 'delivered'
    error_message = Column(Text)
    
    # Métricas de entrega
    sent_at = Column(DateTime(timezone=True))
    delivered_at = Column(DateTime(timezone=True))
    read_at = Column(DateTime(timezone=True))
    clicked_at = Column(DateTime(timezone=True))
    
    # Información técnica
    external_id = Column(String(255))  # ID del proveedor externo
    provider_response = Column(JSON)
    
    # Reintentos
    retry_count = Column(Integer, default=0)
    next_retry_at = Column(DateTime(timezone=True))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones    notification = relationship("Notification", back_populates="notification_batches")
    batch = relationship("NotificationBatch", back_populates="logs")
    recipient = relationship("User", back_populates="received_notification_batches")
    
    def __repr__(self):
        return f"<NotificationLog(recipient_id={self.recipient_id}, status='{self.status}')>"

class NotificationSchedule(BaseModel):
    """
    Programación de notificaciones
    Configuración para notificaciones automáticas programadas
    """
    __tablename__ = "notification_schedules"    # Información básica
    name = Column(String(200), nullable=False)
    description = Column(Text)
    
    # Configuración de la notificación
    template_id = Column(Integer, ForeignKey("notification_templates.id"), nullable=False, index=True)
    channel_id = Column(Integer, ForeignKey("notification_channels.id"), nullable=False, index=True)
    
    # Programación
    schedule_type = Column(String(50), nullable=False)  # 'once', 'recurring', 'event_based'
    cron_expression = Column(String(100))  # Para programación cron
    
    # Para notificaciones únicas
    scheduled_at = Column(DateTime(timezone=True))
    
    # Para notificaciones basadas en eventos
    trigger_event = Column(String(100))  # 'project_deadline', 'task_overdue', etc.
    trigger_offset_hours = Column(Integer, default=0)  # Horas antes/después del evento
    
    # Filtros de destinatarios
    recipient_filters = Column(JSON)
    max_recipients = Column(Integer)  # Límite de destinatarios por envío
    
    # Control
    is_active = Column(Boolean, default=True)
    
    # Estadísticas
    execution_count = Column(Integer, default=0)
    last_executed_at = Column(DateTime(timezone=True))
    next_execution_at = Column(DateTime(timezone=True))
    
    # Usuario que creó la programación
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones    template = relationship("NotificationTemplate", back_populates="notification_batches")
    channel = relationship("NotificationChannel", back_populates="notification_batches")
    created_by = relationship("User", back_populates="created_notification_batches")
    
    def __repr__(self):
        return f"<NotificationSchedule(name='{self.name}', type='{self.schedule_type}')>"

class ScheduledReport(BaseModel):
    """
    Reportes programados
    Configuración para generación automática de reportes
    """
    __tablename__ = "scheduled_reports"    # Información del reporte
    name = Column(String(200), nullable=False)
    report_type = Column(String(100), nullable=False)  # 'kpi', 'project_summary', 'inventory', etc.
    description = Column(Text)
    
    # Configuración del reporte
    report_config = Column(JSON, nullable=False)  # Parámetros específicos del reporte
    format = Column(String(20), default='pdf')  # 'pdf', 'excel', 'csv'
    
    # Programación
    schedule_type = Column(String(50), nullable=False)  # 'daily', 'weekly', 'monthly', 'quarterly'
    cron_expression = Column(String(100))
    
    # Distribución
    recipients = Column(JSON)  # Lista de destinatarios
    delivery_method = Column(String(50), default='email')  # 'email', 'dashboard', 'both'
    
    # Control
    is_active = Column(Boolean, default=True)
    
    # Estadísticas
    execution_count = Column(Integer, default=0)
    last_executed_at = Column(DateTime(timezone=True))
    next_execution_at = Column(DateTime(timezone=True))
    
    # Usuario que creó la programación
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones    created_by = relationship("User", back_populates="created_notification_batches")
    
    def __repr__(self):
        return f"<ScheduledReport(name='{self.name}', type='{self.report_type}')>"
