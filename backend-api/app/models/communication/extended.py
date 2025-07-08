"""
Comment System Extended Models - Reacciones, plantillas y estado de lectura
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import BaseModel

class CommentReaction(BaseModel):
    """
    Reacciones a comentarios
    Sistema de reacciones tipo "like", "dislike", emojis, etc.
    """
    __tablename__ = "comment_reactions"
    comment_id = Column(Integer, ForeignKey("comments.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Tipo de reacción
    reaction_type = Column(String(50), nullable=False)  # 'like', 'dislike', 'heart', 'thumbs_up', etc.
    emoji = Column(String(10))  # Unicode emoji
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    comment = relationship("Comment", back_populates="reactions")
    user = relationship("User", back_populates="comment_reactions")
    
    # Constraint único por usuario y comentario
    __table_args__ = (
        Index('ix_comment_user_reaction', 'comment_id', 'user_id', unique=True),
    )
    
    def __repr__(self):
        return f"<CommentReaction(comment_id={self.comment_id}, type='{self.reaction_type}')>"

class CommentTemplate(BaseModel):
    """
    Plantillas de comentarios
    Plantillas predefinidas para respuestas rápidas
    """
    __tablename__ = "comment_templates"
    name = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    
    # Categorización
    category = Column(String(100))  # 'approval', 'rejection', 'request_info', etc.
    tags = Column(String(500))  # Tags separados por comas
    
    # Contexto de uso
    context_type = Column(String(50))  # 'project', 'task', 'request', 'general'
    department = Column(String(100))
    
    # Control de acceso
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    is_public = Column(Boolean, default=False)  # Si otros usuarios pueden usarla
    is_active = Column(Boolean, default=True)
    
    # Estadísticas de uso
    usage_count = Column(Integer, default=0)
    last_used_at = Column(DateTime(timezone=True))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones    created_by = relationship("User", back_populates="created_comment_reactions")
    
    def __repr__(self):
        return f"<CommentTemplate(name='{self.name}', category='{self.category}')>"

class CommentReadStatus(BaseModel):
    """
    Estado de lectura de comentarios
    Tracking de qué comentarios ha leído cada usuario
    """
    __tablename__ = "comment_read_status"
    comment_id = Column(Integer, ForeignKey("comments.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Estado de lectura
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True))
    
    # Acciones adicionales
    is_starred = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones    comment = relationship("Comment", back_populates="reactions")
    user = relationship("User", back_populates="comment_reactions")
    
    # Constraint único por usuario y comentario
    __table_args__ = (
        Index('ix_comment_user_read', 'comment_id', 'user_id', unique=True),
    )
    
    def __repr__(self):
        return f"<CommentReadStatus(comment_id={self.comment_id}, user_id={self.user_id}, read={self.is_read})>"
