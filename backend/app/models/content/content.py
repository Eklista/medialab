# app/models/content/content.py
from sqlalchemy import Column, String, Text, Integer, DateTime, Boolean, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import sqlalchemy as sa
import uuid

from app.models.base import Base
from app.models.content.enums import ContentType, ContentStatus

class Content(Base):
    """
    Contenido principal: videos, galerías, graduaciones
    """
    __tablename__ = 'content'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    content_type = Column(SQLEnum(ContentType), nullable=False)
    status = Column(SQLEnum(ContentStatus), default=ContentStatus.DRAFT)
    
    # Relaciones con otras entidades
    department_id = Column(Integer, ForeignKey('departments.id'), nullable=False)
    category_id = Column(Integer, ForeignKey('content_categories.id'), nullable=False)
    author_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Metadata
    published_at = Column(DateTime, nullable=True)
    views = Column(Integer, default=0)
    featured = Column(Boolean, default=False)
    
    # SEO y metadata adicional
    slug = Column(String(255), unique=True, nullable=True)
    meta_description = Column(Text, nullable=True)
    tags = Column(String(500), nullable=True)
    
    # Auditoría (siguiendo el patrón de tu podcast)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Relaciones
    department = relationship("Department", back_populates="content")
    category = relationship("ContentCategory", back_populates="content")
    author = relationship("User", foreign_keys=[author_id], back_populates="authored_content")
    created_by = relationship("User", foreign_keys=[created_by_id])
    updated_by = relationship("User", foreign_keys=[updated_by_id])
    deleted_by = relationship("User", foreign_keys=[deleted_by_id])
    
    videos = relationship("Video", back_populates="content", cascade="all, delete-orphan")
    photos = relationship("Photo", back_populates="content", cascade="all, delete-orphan")
    
    # Índices
    __table_args__ = (
        Index('idx_content_department', 'department_id'),
        Index('idx_content_category', 'category_id'),
        Index('idx_content_author', 'author_id'),
        Index('idx_content_status', 'status'),
        Index('idx_content_type', 'content_type'),
        Index('idx_content_published', 'published_at'),
        Index('idx_content_featured', 'featured'),
        Index('idx_content_deleted', 'deleted_at'),
    )
    
    def __repr__(self):
        return f"<Content(id='{self.id}', title='{self.title}', type='{self.content_type}')>"