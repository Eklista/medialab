# app/models/common/attachments.py
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship, validates
from datetime import datetime
import sqlalchemy as sa
import re

from app.models.base import Base

class Attachment(Base):
    """
    Archivos adjuntos para cualquier entidad
    """
    __tablename__ = 'attachments'
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)  # Tamaño en bytes
    
    # Metadatos
    description = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    uploaded_by = Column(Integer, nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Entidad relacionada (polimórfica)
    entity_id = Column(Integer, nullable=False)
    entity_type = Column(String(50), nullable=False)
    
    # Índices
    __table_args__ = (
        sa.Index('idx_attachments_entity', 'entity_type', 'entity_id'),
        sa.Index('idx_attachments_uploader', 'uploaded_by'),
        sa.Index('idx_attachments_mime', 'mime_type')
    )
    
    def __repr__(self):
        return f"<Attachment(id={self.id}, filename='{self.filename}', entity_type='{self.entity_type}', entity_id={self.entity_id})>"

    @validates('file_size')
    def validate_file_size(self, key, size):
        if size <= 0:
            raise ValueError("El tamaño del archivo debe ser mayor que cero")
        return size
    
    @validates('mime_type')
    def validate_mime_type(self, key, mime):
        if not mime or not re.match(r'^[a-z]+/[a-z0-9\.\-\+]+$', mime):
            raise ValueError("Formato MIME inválido")
        return mime