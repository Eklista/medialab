# app/models/multimedia/podcasts.py
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import sqlalchemy as sa
from app.models.base import Base

class PodcastSeries(Base):
    """
    Series de podcasts
    """
    __tablename__ = 'podcast_series'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    cover_image_url = Column(String(255), nullable=True)
    
    # Metadatos
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Plataformas donde se publica
    main_platform_id = Column(Integer, ForeignKey('platforms.id'), nullable=True)
    
    # Estado
    status_id = Column(Integer, ForeignKey('statuses.id'), nullable=True)
    
    # Relación con solicitud de podcast (si proviene de una)
    podcast_request_id = Column(Integer, ForeignKey('podcast_requests.id'), nullable=True)
    
    # Relaciones
    main_platform = relationship("Platform")
    status = relationship("Status")
    episodes = relationship("PodcastEpisode", back_populates="series")
    
    # Índices
    __table_args__ = (
        Index('idx_podcast_series_platform', 'main_platform_id'),
        Index('idx_podcast_series_status', 'status_id'),
        Index('idx_podcast_series_request', 'podcast_request_id')
    )
    
    def __repr__(self):
        return f"<PodcastSeries(title='{self.title}')>"


class PodcastEpisode(Base):
    """
    Episodios de podcast
    """
    __tablename__ = 'podcast_episodes'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    episode_number = Column(Integer, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    
    # Relación con serie
    series_id = Column(Integer, ForeignKey('podcast_series.id'), nullable=False)
    series = relationship("PodcastSeries", back_populates="episodes")
    
    # Metadatos
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    published_at = Column(DateTime, nullable=True)
    recording_date = Column(DateTime, nullable=True)
    
    # Estado
    status_id = Column(Integer, ForeignKey('statuses.id'), nullable=True)
    status = relationship("Status")
    
    # Relación con episodio de solicitud (si proviene de uno)
    request_episode_id = Column(Integer, ForeignKey('podcast_request_episodes.id'), nullable=True)
    
    # Índices
    __table_args__ = (
        Index('idx_podcast_episode_series', 'series_id'),
        Index('idx_podcast_episode_status', 'status_id'),
        Index('idx_podcast_episode_request', 'request_episode_id')
    )
    
    def __repr__(self):
        return f"<PodcastEpisode(title='{self.title}', series_id={self.series_id})>"