"""
Modelo de archivos adjuntos de solicitud
"""

from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship

from ..base import Base


class RequestAttachment(Base):
    """
    File attachments for requests
    """
    __tablename__ = "request_attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("requests.id"), nullable=False, index=True)
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id")
    uploaded_by_user = relationship("User", back_populates="uploaded_attachments"), nullable=False, index=True)
    
    # File info
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    mime_type = Column(String(100))
    
    # Metadata
    description = Column(Text)
    is_reference_material = Column(Boolean, default=False)
    
    # Fechas
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)
    
    # Relationships
    request = relationship("Request", back_populates="attachments")
    uploaded_by = relationship("User", back_populates="uploaded_request_attachments")

    def __repr__(self):
        return f"<RequestAttachment(id={self.id}, filename='{self.filename}', request_id={self.request_id})>"
