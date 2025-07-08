"""
Calendar Extended Models - Vistas personalizadas y eventos recurrentes
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import BaseModel

class CalendarView(BaseModel):
    """
    Vistas personalizadas de calendario
    Configuraciones de vista personalizadas por usuario
    """
    __tablename__ = "calendar_views"
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Configuración de la vista
    name = Column(String(200), nullable=False)
    view_type = Column(String(50), nullable=False)  # 'month', 'week', 'day', 'agenda', 'timeline'
    
    # Filtros aplicados
    filters = Column(JSON)  # Filtros guardados como JSON
    
    # Configuración visual
    default_view = Column(Boolean, default=False)
    color_scheme = Column(String(50))
    show_weekends = Column(Boolean, default=True)
    start_day_of_week = Column(Integer, default=1)  # 1=Monday, 0=Sunday
    
    # Configuración de eventos mostrados
    show_projects = Column(Boolean, default=True)
    show_tasks = Column(Boolean, default=True)
    show_personal = Column(Boolean, default=True)
    show_university = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    last_used_at = Column(DateTime(timezone=True))
    
    # Relaciones    user = relationship("User", back_populates="calendar_views")
    
    def __repr__(self):
        return f"<CalendarView(name='{self.name}', type='{self.view_type}', user_id={self.user_id})>"

class RecurringEvent(BaseModel):
    """
    Eventos recurrentes
    Configuración para eventos que se repiten según patrones
    """
    __tablename__ = "recurring_events"
    parent_event_id = Column(Integer, ForeignKey("calendar_events.id"), nullable=False, index=True)
    
    # Patrón de recurrencia
    recurrence_type = Column(String(50), nullable=False)  # 'daily', 'weekly', 'monthly', 'yearly', 'custom'
    recurrence_interval = Column(Integer, default=1)  # Cada X días/semanas/meses
    
    # Días específicos (para recurrencia semanal)
    days_of_week = Column(String(20))  # '1,3,5' para Lunes, Miércoles, Viernes
    day_of_month = Column(Integer)  # Para recurrencia mensual
    week_of_month = Column(Integer)  # 1-4 para primera, segunda, etc. semana del mes
    
    # Límites de recurrencia
    end_type = Column(String(20), default='never')  # 'never', 'date', 'count'
    end_date = Column(DateTime(timezone=True))
    occurrence_count = Column(Integer)
    
    # Excepciones y modificaciones
    exceptions = Column(JSON)  # Fechas donde no aplica la recurrencia
    modifications = Column(JSON)  # Modificaciones específicas para ciertas fechas
    
    # Control
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    parent_event = relationship("CalendarEvent", back_populates="recurrence_config")
    
    def __repr__(self):
        return f"<RecurringEvent(parent_id={self.parent_event_id}, type='{self.recurrence_type}')>"

class PodcastEpisode(BaseModel):
    """
    Episodios de podcast
    Episodios específicos dentro de una serie de podcast
    """
    __tablename__ = "podcast_episodes"
    podcast_id = Column(Integer, ForeignKey("podcasts.id"), nullable=False, index=True)
    
    # Información del episodio
    episode_number = Column(Integer)
    season_number = Column(Integer)
    title = Column(String(300), nullable=False)
    description = Column(Text)
    
    # Contenido
    audio_file_url = Column(String(500))
    transcript_url = Column(String(500))
    duration_seconds = Column(Integer)
    
    # Metadatos
    publish_date = Column(DateTime(timezone=True))
    is_published = Column(Boolean, default=False)
    featured = Column(Boolean, default=False)
    
    # SEO y tags
    slug = Column(String(300), unique=True, index=True)
    tags = Column(String(500))
    
    # Estadísticas
    play_count = Column(Integer, default=0)
    download_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    podcast = relationship("Podcast", back_populates="episodes")
    
    def __repr__(self):
        return f"<PodcastEpisode(title='{self.title}', number={self.episode_number})>"
