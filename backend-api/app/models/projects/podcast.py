"""
Modelo de proyectos tipo podcast
Especialización de Project para producción de podcasts
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import Base


class Podcast(Base):
    """
    Proyectos específicos para producción de podcasts
    Extiende la funcionalidad de Project para podcasts
    """
    __tablename__ = "podcasts"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Información del podcast
    podcast_title = Column(String(200), nullable=False)
    episode_number = Column(Integer)
    season_number = Column(Integer)
    
    # Formato y duración
    format_type = Column(String(50))  # interview, solo, panel, narrative
    target_duration_minutes = Column(Integer)  # Duración objetivo
    actual_duration_minutes = Column(Integer)  # Duración real
    
    # Contenido
    topic = Column(String(200))  # Tema principal
    guest_names = Column(Text)  # Nombres de invitados
    guest_contacts = Column(Text)  # Contactos de invitados
    episode_summary = Column(Text)  # Resumen del episodio
    show_notes = Column(Text)  # Notas del programa
    
    # Producción
    recording_date = Column(DateTime(timezone=True))
    recording_location = Column(String(200))
    equipment_used = Column(Text)  # Equipos utilizados
    
    # Estado de producción
    script_completed = Column(Boolean, default=False)
    recording_completed = Column(Boolean, default=False)
    editing_completed = Column(Boolean, default=False)
    mixing_completed = Column(Boolean, default=False)
    mastering_completed = Column(Boolean, default=False)
    
    # Publicación
    publish_date = Column(DateTime(timezone=True))
    platform_urls = Column(JSON)  # JSON con URLs de plataformas
    social_media_posts = Column(Text)  # Posts para redes sociales
    
    # Métricas
    download_count = Column(Integer, default=0)
    listen_time_minutes = Column(Integer, default=0)
    rating_average = Column(Integer)  # Rating promedio 1-5
    
    # Archivos
    raw_audio_file_path = Column(String(500))  # Archivo de audio crudo
    edited_audio_file_path = Column(String(500))  # Archivo editado
    thumbnail_image_path = Column(String(500))  # Imagen del episodio
    
    # Relación con el proyecto base
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)    project = relationship("Project", back_populates="podcasts")
    
    # Relaciones adicionales
    episodes = relationship("CalendarView", back_populates="podcast")
    host_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    host = relationship("User", foreign_keys=[host_id], back_populates="hosted_podcasts")
    
    producer_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    producer = relationship("User", foreign_keys=[producer_id], back_populates="produced_podcasts")
    
    # Fechas
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Podcast(id={self.id}, title='{self.podcast_title}', episode={self.episode_number})>"
