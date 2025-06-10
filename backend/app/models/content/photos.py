# app/models/content/photos.py
from sqlalchemy import Column, String, Integer, Text, Boolean, ForeignKey, BigInteger, DateTime, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import sqlalchemy as sa
import uuid

from app.models.base import Base

class Photo(Base):
    """
    Fotos para galerías y graduaciones
    """
    __tablename__ = 'photos'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    content_id = Column(String(36), ForeignKey('content.id'), nullable=False)
    
    # URLs de la imagen
    photo_url = Column(String(1000), nullable=False)
    thumbnail_url = Column(String(1000), nullable=True)
    medium_url = Column(String(1000), nullable=True)
    
    # Metadata
    original_filename = Column(String(255), nullable=True)
    file_size = Column(BigInteger, nullable=True)
    mime_type = Column(String(100), nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    
    # Contenido
    caption = Column(Text, nullable=True)
    alt_text = Column(String(255), nullable=True)
    
    # Ordenamiento y control
    sort_order = Column(Integer, default=0)
    is_featured = Column(Boolean, default=False)
    is_cover = Column(Boolean, default=False)
    
    # Auditoría
    deleted_at = Column(DateTime, nullable=True)
    deleted_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Relaciones
    content = relationship("Content", back_populates="photos")
    created_by = relationship("User", foreign_keys=[created_by_id])
    updated_by = relationship("User", foreign_keys=[updated_by_id])
    deleted_by = relationship("User", foreign_keys=[deleted_by_id])
    
    # Índices
    __table_args__ = (
        Index('idx_photo_content', 'content_id'),
        Index('idx_photo_featured', 'is_featured'),
        Index('idx_photo_cover', 'is_cover'),
        Index('idx_photo_sort', 'sort_order'),
        Index('idx_photo_deleted', 'deleted_at'),
    )
    
    def __repr__(self):
        return f"<Photo(id='{self.id}', content_id='{self.content_id}')>"