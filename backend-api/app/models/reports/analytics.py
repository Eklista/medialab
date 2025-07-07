"""
Analytics Models - Eventos y métricas de analíticas del sistema
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import Base

class AnalyticsEvent(Base):
    """
    Eventos de analytics
    Registro de eventos para análisis de uso del sistema
    """
    __tablename__ = "analytics_events"
    
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    event_category = Column(String(50), nullable=False, index=True)  # 'user_action', 'system', 'error', etc.
    
    # Usuario asociado (opcional para eventos del sistema)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    session_id = Column(String(255), index=True)
    
    # Detalles del evento
    event_data = Column(JSON)  # Datos específicos del evento
    page_url = Column(String(500))
    referrer = Column(String(500))
    user_agent = Column(Text)
    ip_address = Column(String(45))  # IPv6 compatible
    
    # Métricas
    duration_ms = Column(Integer)  # Duración en milisegundos
    
    # Timestamps
    event_timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relaciones    user = relationship("User", back_populates="analytics_events")
    
    def __repr__(self):
        return f"<AnalyticsEvent(type='{self.event_type}', category='{self.event_category}')>"

class SearchAnalytics(Base):
    """
    Analytics de búsqueda
    Métricas y análisis de las búsquedas realizadas en el sistema
    """
    __tablename__ = "search_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Información de la búsqueda
    search_query = Column(String(500), nullable=False, index=True)
    search_type = Column(String(50), index=True)  # 'global', 'projects', 'inventory', etc.
    results_count = Column(Integer, default=0)
    
    # Usuario y sesión
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    session_id = Column(String(255), index=True)
    
    # Métricas de rendimiento
    response_time_ms = Column(Integer)
    clicked_result_position = Column(Integer)  # Posición del resultado clickeado
    clicked_result_id = Column(String(100))  # ID del recurso clickeado
    
    # Filtros aplicados
    filters_applied = Column(JSON)
    
    # Contexto
    page_context = Column(String(100))  # Desde dónde se hizo la búsqueda
    
    # Timestamps
    searched_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    
    # Relaciones    user = relationship("User", back_populates="analytics_events")
    
    def __repr__(self):
        return f"<SearchAnalytics(query='{self.search_query}', results={self.results_count})>"
