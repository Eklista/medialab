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
    deleted_at = Column(DateTime, nullable=True)
    deleted_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Relaciones polimórficas
    entity_id = Column(Integer, nullable=False)
    entity_type = Column(String(50), nullable=False)  # project, task, podcast, course, etc.
    
    # Autor
    author_id = Column(Integer, nullable=False)
    is_client_comment = Column(Boolean, default=False)

    # Relación con el usuario institucional (si aplica)
    institutional_user_id = Column(Integer, ForeignKey('institutional_users.id'), nullable=True)
    institutional_user = relationship("InstitutionalUser")
    
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