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
    
    ## Métodos de clase para crear y obtener comentarios
    @classmethod
    def get_for_entity(cls, session, entity_type, entity_id):
        """
        Obtiene todos los comentarios asociados a una entidad específica
        
        Args:
            session: Sesión SQLAlchemy
            entity_type: Tipo de entidad ('project', 'podcast', 'course', etc.)
            entity_id: ID de la entidad
            
        Returns:
            list: Lista de comentarios ordenados por fecha
        """
        return session.query(cls).filter(
            cls.entity_type == entity_type,
            cls.entity_id == entity_id
        ).order_by(cls.created_at).all()
    
    # Método para obtener adjuntos de un comentario
    @property
    def attachments(self):
        """
        Obtiene los adjuntos asociados a este comentario
        """
        from sqlalchemy.orm import object_session
        from app.models.common.attachments import Attachment
        
        session = object_session(self)
        if not session:
            return []
        
        return Attachment.get_for_entity(session, 'comment', self.id)