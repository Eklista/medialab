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

    @classmethod
    def get_for_entity(cls, session, entity_type, entity_id):
        """
        Obtiene todos los adjuntos para una entidad específica
        """
        return session.query(cls).filter(
            cls.entity_type == entity_type,
            cls.entity_id == entity_id
        ).all()
    
    @classmethod
    def get_for_comment(cls, session, comment_id):
        """
        Método específico para obtener adjuntos de un comentario
        """
        return cls.get_for_entity(session, 'comment', comment_id)
    
    @property
    def file_url(self):
        """Retorna la URL para acceder al archivo"""
        return f"/api/attachments/{self.id}/{self.original_filename}"
    
    @property
    def is_image(self):
        """Verifica si el archivo es una imagen"""
        return self.mime_type.startswith('image/')
    
    @property
    def is_document(self):
        """Verifica si el archivo es un documento"""
        document_types = ['application/pdf', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'application/vnd.ms-excel',
                         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                         'application/vnd.ms-powerpoint',
                         'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                         'text/plain']
        return self.mime_type in document_types
    
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