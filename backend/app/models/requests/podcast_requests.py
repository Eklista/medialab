# app/models/requests/podcast_requests.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, Time, JSON, Boolean, Index, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.base import Base

class PodcastRequest(Base):
    """
    Detalles para solicitud de podcast
    """
    __tablename__ = 'podcast_requests'
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey('requests.id'), nullable=False, unique=True)
    
    # Información del podcast
    podcast_name = Column(String(255), nullable=False)
    podcast_description = Column(Text, nullable=True)
    
    # Configuración de recurrencia
    is_recurrent = Column(Boolean, default=False)
    recurrence_type = Column(String(50), nullable=True)  # 'daily', 'weekly', 'monthly', 'manual'
    recurrence_config = Column(JSON, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    
    # Relaciones
    request = relationship("Request", back_populates="podcast_request")
    moderators = relationship("PodcastModerator", back_populates="podcast", cascade="all, delete-orphan")
    episodes = relationship("PodcastRequestEpisode", back_populates="podcast", cascade="all, delete-orphan")
    
    # Relación con una serie de podcast (si se convierte) - sin referencia circular
    podcast_series = relationship("PodcastSeries", back_populates="podcast_request", uselist=False)
    
    # Índices
    __table_args__ = (
        Index('idx_podcast_request_request', 'request_id'),
    )
    
    def __repr__(self):
        return f"<PodcastRequest(id={self.id}, name='{self.podcast_name}')>"


class PodcastModerator(Base):
    """
    Moderadores para un podcast
    """
    __tablename__ = 'podcast_moderators'
    
    id = Column(Integer, primary_key=True, index=True)
    podcast_id = Column(Integer, ForeignKey('podcast_requests.id'), nullable=False)
    name = Column(String(255), nullable=False)
    position = Column(String(255), nullable=True)
    role = Column(String(100), nullable=True)
    
    # Relación
    podcast = relationship("PodcastRequest", back_populates="moderators")
    
    # Índices
    __table_args__ = (
        Index('idx_podcast_moderator_podcast', 'podcast_id'),
    )
    
    def __repr__(self):
        return f"<PodcastModerator(id={self.id}, name='{self.name}')>"


class PodcastRequestEpisode(Base):
    """
    Episodios para una solicitud de podcast
    """
    __tablename__ = 'podcast_request_episodes'
    
    id = Column(Integer, primary_key=True, index=True)
    podcast_id = Column(Integer, ForeignKey('podcast_requests.id'), nullable=False)
    title = Column(String(255), nullable=False)
    topic = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    
    # Departamento/Facultad relacionada
    department_id = Column(Integer, ForeignKey('departments.id'), nullable=True)
    
    # Relaciones
    podcast = relationship("PodcastRequest", back_populates="episodes")
    department = relationship("Department")
    guests = relationship("PodcastGuest", back_populates="episode", cascade="all, delete-orphan")
    
    # Índices
    __table_args__ = (
        Index('idx_podcast_episode_podcast', 'podcast_id'),
        Index('idx_podcast_episode_department', 'department_id'),
    )
    
    def __repr__(self):
        return f"<PodcastEpisode(id={self.id}, title='{self.title}')>"


class PodcastGuest(Base):
    """
    Invitados para episodios de podcast
    """
    __tablename__ = 'podcast_guests'
    
    id = Column(Integer, primary_key=True, index=True)
    episode_id = Column(Integer, ForeignKey('podcast_request_episodes.id'), nullable=False)
    name = Column(String(255), nullable=False)
    
    # Relaciones
    episode = relationship("PodcastRequestEpisode", back_populates="guests")
    
    # Índices
    __table_args__ = (
        Index('idx_podcast_guest_episode', 'episode_id'),
    )
    
    def __repr__(self):
        return f"<PodcastGuest(id={self.id}, name='{self.name}')>"