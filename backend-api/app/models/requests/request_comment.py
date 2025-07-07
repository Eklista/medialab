"""
Modelo de comentarios de solicitud
"""

from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship

from ..base import Base


class RequestComment(Base):
    """
    Comments on requests during evaluation
    """
    __tablename__ = "request_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("requests.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    comment = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)  # Internal admin comment vs client visible
    
    # Threading
    parent_comment_id = Column(Integer, ForeignKey("request_comments.id"), index=True, nullable=True)
    
    # Fechas
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)
    
    # Relationships
    child_comments = relationship("RequestComment", back_populates="parent_comment")
    request = relationship("Request", back_populates="comments")    user = relationship("User", back_populates="request_comments")
    parent_comment = relationship("RequestComment", remote_side="RequestComment.id", back_populates="child_comments")
    replies = relationship("RequestComment", back_populates="parent_comment")

    def __repr__(self):
        return f"<RequestComment(id={self.id}, request_id={self.request_id}, user_id={self.user_id})>"
