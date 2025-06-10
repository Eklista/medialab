# app/models/content/videos.py
from sqlalchemy import Column, String, Integer, Text, Boolean, ForeignKey, BigInteger, DECIMAL, DateTime, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import sqlalchemy as sa
import uuid

from app.models.base import Base

class Video(Base):
    """
    Videos asociados a contenido
    """
    __tablename__ = 'videos'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    content_id = Column(String(36), ForeignKey('content.id'), nullable=False)
    
    # Información del archivo original
    original_filename = Column(String(255), nullable=True)
    file_size = Column(BigInteger, nullable=True)
    mime_type = Column(String(100), nullable=True)
    
    # Proveedor y tipo
    video_type_id = Column(Integer, ForeignKey('video_types.id'), nullable=False)
    storage_provider_id = Column(Integer, ForeignKey('storage_providers.id'), nullable=False)
    
    # URLs y identificadores
    video_url = Column(String(1000), nullable=False)
    video_id = Column(String(255), nullable=True)
    thumbnail_url = Column(String(1000), nullable=True)
    
    # Metadata del video
    duration_seconds = Column(Integer, nullable=True)
    duration_formatted = Column(String(20), nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    fps = Column(DECIMAL(5,2), nullable=True)
    bitrate = Column(Integer, nullable=True)
    
    # Estado y procesamiento
    is_processed = Column(Boolean, default=False)
    processing_status = Column(String(50), default='pending')
    error_message = Column(Text, nullable=True)
    
    # Control
    is_main = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    
    # Auditoría
    deleted_at = Column(DateTime, nullable=True)
    deleted_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Relaciones
    content = relationship("Content", back_populates="videos")
    video_type = relationship("VideoType", back_populates="videos")
    storage_provider = relationship("StorageProvider", back_populates="videos")
    created_by = relationship("User", foreign_keys=[created_by_id])
    updated_by = relationship("User", foreign_keys=[updated_by_id])
    deleted_by = relationship("User", foreign_keys=[deleted_by_id])
    
    # Índices
    __table_args__ = (
        Index('idx_video_content', 'content_id'),
        Index('idx_video_type', 'video_type_id'),
        Index('idx_video_provider', 'storage_provider_id'),
        Index('idx_video_status', 'processing_status'),
        Index('idx_video_main', 'is_main'),
        Index('idx_video_deleted', 'deleted_at'),
    )
    
    def __repr__(self):
        return f"<Video(id='{self.id}', content_id='{self.content_id}')>"