# app/models/common/platforms.py
from sqlalchemy import Column, String, Integer, Text, Boolean
from app.models.base import Base

class Platform(Base):
    """
    Plataformas donde se publican contenidos (YouTube, Spotify, etc.)
    """
    __tablename__ = 'platforms'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    url_base = Column(String(255), nullable=True)  # URL base para la plataforma
    description = Column(Text, nullable=True)
    
    # Campos para UI
    logo_url = Column(String(255), nullable=True) 
    color = Column(String(20), nullable=True)
    
    # Banderas de capacidades
    supports_video = Column(Boolean, default=False)
    supports_audio = Column(Boolean, default=False)
    supports_documents = Column(Boolean, default=False)
    
    def __repr__(self):
        return f"<Platform(name='{self.name}')>"