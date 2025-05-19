# app/models/communications/comments.py
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base
import sqlalchemy as sa

class Comment(Base):
    """
    Comentarios en cualquier entidad para feedback y discusión
    """
    __tablename__ = 'comments'
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Contenido
    content = Column(Text, nullable=False)
    
    # Metadatos
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones polimórficas
    entity_id = Column(Integer, nullable=False)
    entity_type = Column(String(50), nullable=False)  # project, task, podcast, course, etc.
    
    # Autor
    author_id = Column(Integer, nullable=False)
    is_client_comment = Column(Boolean, default=False)  # Si proviene de un cliente
    
    # Comentario padre (para hilos)
    parent_id = Column(Integer, ForeignKey('comments.id'), nullable=True)
    
    # Índices
    __table_args__ = (
        Index('idx_comments_entity', 'entity_type', 'entity_id'),
        Index('idx_comments_author', 'author_id')
    )
    
    # Relaciones
    replies = relationship("Comment", 
                         backref=sa.orm.backref("parent", remote_side=[id]),
                         cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Comment(id={self.id}, entity_type='{self.entity_type}', entity_id={self.entity_id})>"