from sqlalchemy import Column, Integer, String, Boolean, Text, JSON, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey
from app.models.base import Base

class VideoType(Base):
    __tablename__ = 'video_types'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)
    icon = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    
    storage_providers = relationship("StorageProvider", back_populates="video_type")
    videos = relationship("Video", back_populates="video_type")

class StorageProvider(Base):
    __tablename__ = 'storage_providers'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    video_type_id = Column(Integer, ForeignKey('video_types.id'), nullable=False)
    is_active = Column(Boolean, default=True)
    config = Column(JSON, nullable=True)
    max_file_size = Column(BigInteger, nullable=True)
    supported_formats = Column(JSON, nullable=True)
    api_endpoint = Column(String(255), nullable=True)
    
    video_type = relationship("VideoType", back_populates="storage_providers")
    videos = relationship("Video", back_populates="storage_provider")
