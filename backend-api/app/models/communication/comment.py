"""
Modelo para comentarios del sistema.
"""

from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship

from ..base import BaseModel
from enum import Enum


class CommentableType(Enum):
    """Tipos de entidad comentable."""
    TASK = "TASK"
    PROJECT = "PROJECT"
    REQUEST = "REQUEST"
    DELIVERABLE = "DELIVERABLE"


class CommentType(Enum):
    """Tipos de comentario."""
    GENERAL = "GENERAL"
    FEEDBACK = "FEEDBACK"
    APPROVAL = "APPROVAL"
    REJECTION = "REJECTION"
    SYSTEM = "SYSTEM"


class Comment(BaseModel):
    """
    Modelo para comentarios del sistema.
    """
    __tablename__ = "comments"
    commentable_type = Column(SQLEnum(CommentableType), nullable=False, index=True)
    commentable_id = Column(String(36), nullable=False, index=True)
    parent_comment_id = Column(String(36), ForeignKey("comments.id"), nullable=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    comment_type = Column(SQLEnum(CommentType), default=CommentType.GENERAL, nullable=False)
    is_internal = Column(Boolean, default=False, nullable=False)
    is_resolved = Column(Boolean, default=False, nullable=False)
    mentions = Column(JSON, nullable=True)
    attachments = Column(JSON, nullable=True)
    edited_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relaciones
    child_comments = relationship("Comment", back_populates="parent_comment", remote_side="Comment.id")
    reactions = relationship("CommentReaction", back_populates="comment")
    parent_comment = relationship("Comment", remote_side="Comment.id", back_populates="child_comments")
    user = relationship("User", back_populates="comments")
    replies = relationship("Comment", back_populates="parent_comment", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Comment(id={self.id}, commentable_type='{self.commentable_type.value}', user_id='{self.user_id}')>"
