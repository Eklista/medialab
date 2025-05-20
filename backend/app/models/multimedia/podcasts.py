# app/models/multimedia/podcasts.py
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import sqlalchemy as sa
from app.models.base import Base
from app.models.common.entity_mixin import EntityMixin

class PodcastSeries(Base, EntityMixin):
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
    podcast_request = relationship("PodcastRequest", back_populates="podcast_series")
    
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
    
    @property
    def links(self):
        """
        Obtiene los enlaces asociados a esta serie de podcast
        """
        from sqlalchemy.orm import object_session
        from app.models.communications.links import Link
        
        session = object_session(self)
        if not session:
            return []
        
        return session.query(Link).filter(
            Link.entity_type == 'podcast_series',
            Link.entity_id == self.id
        ).all()
    
    @property
    def all_links(self):
        """
        Obtiene todos los enlaces asociados a esta serie y sus episodios
        """
        from sqlalchemy.orm import object_session
        from app.models.communications.links import Link
        
        session = object_session(self)
        if not session:
            return []
        
        # Enlaces directos de la serie
        series_links = session.query(Link).filter(
            Link.entity_type == 'podcast_series',
            Link.entity_id == self.id
        ).all()
        
        # Enlaces de todos los episodios
        episode_ids = [episode.id for episode in self.episodes]
        episode_links = [] if not episode_ids else session.query(Link).filter(
            Link.entity_type == 'podcast_episode',
            Link.entity_id.in_(episode_ids)
        ).all()
        
        return series_links + episode_links
    
    def add_link(self, session, url, platform_id=None, title=None, description=None, created_by=None):
        """
        Añade un enlace a esta serie de podcast
        """
        from app.models.communications.links import Link
        return Link.create_for_entity(
            session, self, url, platform_id, title, description, created_by
        )
    
    def __repr__(self):
        return f"<PodcastSeries(title='{self.title}')>"


class PodcastEpisode(Base, EntityMixin):
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
    
    @property
    def links(self):
        """
        Obtiene los enlaces asociados a este episodio
        """
        from sqlalchemy.orm import object_session
        from app.models.communications.links import Link
        
        session = object_session(self)
        if not session:
            return []
        
        return session.query(Link).filter(
            Link.entity_type == 'podcast_episode',
            Link.entity_id == self.id
        ).all()
    
    def add_link(self, session, url, platform_id=None, title=None, description=None, created_by=None):
        """
        Añade un enlace a este episodio
        """
        from app.models.communications.links import Link
        return Link.create_for_entity(
            session, self, url, platform_id, title, description, created_by
        )
    
    def __repr__(self):
        return f"<PodcastEpisode(title='{self.title}', series_id={self.series_id})>"