"""
Dashboard Models - Dashboards personalizados y widgets
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import BaseModel

class CustomDashboard(BaseModel):
    """
    Dashboards personalizados
    Configuraciones de dashboard personalizadas por usuario
    """
    __tablename__ = "custom_dashboards"
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Información del dashboard
    name = Column(String(200), nullable=False)
    description = Column(Text)
    
    # Configuración de layout
    layout_config = Column(JSON)  # Configuración del grid/layout
    theme = Column(String(50), default='default')
    
    # Control de acceso
    is_default = Column(Boolean, default=False)
    is_public = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Metadatos
    tags = Column(String(500))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    last_viewed_at = Column(DateTime(timezone=True))
    
    # Relaciones
    user = relationship("User", back_populates="custom_dashboards")
    widgets = relationship("DashboardWidget", back_populates="dashboard", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<CustomDashboard(name='{self.name}', user_id={self.user_id})>"

class DashboardWidget(BaseModel):
    """
    Widgets de dashboard
    Componentes individuales que conforman un dashboard
    """
    __tablename__ = "dashboard_widgets"
    dashboard_id = Column(Integer, ForeignKey("custom_dashboards.id"), nullable=False, index=True)
    
    # Información del widget
    widget_type = Column(String(100), nullable=False)  # 'chart', 'table', 'kpi', 'calendar', etc.
    title = Column(String(200), nullable=False)
    
    # Configuración del widget
    config = Column(JSON, nullable=False)  # Configuración específica del widget
    data_source = Column(String(100))  # Fuente de datos
    
    # Posición y tamaño
    position_x = Column(Integer, default=0)
    position_y = Column(Integer, default=0)
    width = Column(Integer, default=4)
    height = Column(Integer, default=3)
    
    # Configuración de actualización
    refresh_interval_minutes = Column(Integer, default=15)
    auto_refresh = Column(Boolean, default=True)
    last_refreshed_at = Column(DateTime(timezone=True))
    
    # Control
    is_visible = Column(Boolean, default=True)
    is_locked = Column(Boolean, default=False)  # Si está bloqueado para edición
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    dashboard = relationship("CustomDashboard", back_populates="widgets")
    
    def __repr__(self):
        return f"<DashboardWidget(title='{self.title}', type='{self.widget_type}')>"
