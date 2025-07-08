"""
Modelo de documentos de proyecto
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import BaseModel


class ProjectDocument(BaseModel):
    """Documentos del proyecto"""
    __tablename__ = "project_documents"
    title = Column(String(200), nullable=False)
    description = Column(Text)
    file_path = Column(String(500))  # Ruta del archivo
    file_type = Column(String(50))  # PDF, DOC, XLS, etc.
    file_size = Column(Integer)  # Tamaño en bytes
    version = Column(String(20), default="1.0")
    is_public = Column(Boolean, default=False)
    uploaded_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    project = relationship("Project", back_populates="project_documents")
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    uploaded_by = relationship("User", back_populates="uploaded_documents")

    def __repr__(self):
        return f"<ProjectDocument(id={self.id}, title='{self.title}', project_id={self.project_id})>"
