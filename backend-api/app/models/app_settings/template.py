"""
Modelos para plantillas del sistema.
"""

from sqlalchemy import Column, String, Text, Boolean, Integer, Date, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship

from ..base import BaseModel
from enum import Enum


class DraftStatus(Enum):
    """Estados de borrador."""
    DRAFT = "DRAFT"
    READY = "READY"
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"


class DeliverableType(BaseModel):
    """
    Modelo para tipos de entregables.
    """
    __tablename__ = "deliverable_types"
    code = Column(String(100), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_extensions = Column(JSON, nullable=True)
    color = Column(String(50), nullable=True)
    icon = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    def __repr__(self):
        return f"<DeliverableType(id={self.id}, code='{self.code}', name='{self.name}')>"


class PodcastEpisodeDraft(BaseModel):
    """
    Modelo para borradores de episodios de podcast.
    """
    __tablename__ = "podcast_episodes_drafts"
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    episode_number = Column(Integer, nullable=True)
    guest_name = Column(String(255), nullable=True)
    topic = Column(String(500), nullable=True)
    scheduled_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(SQLEnum(DraftStatus), default=DraftStatus.DRAFT, nullable=False)
    request_id = Column(String(36), ForeignKey("requests.id"), nullable=True, index=True)
    
    # Relaciones    user = relationship("User", back_populates="deliverable_types")
    request = relationship("Request", back_populates="deliverable_types")
    
    def __repr__(self):
        return f"<PodcastEpisodeDraft(id={self.id}, guest_name='{self.guest_name}', status='{self.status.value}')>"


class CourseClassDraft(BaseModel):
    """
    Modelo para borradores de clases de curso.
    """
    __tablename__ = "course_classes_drafts"
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    course_name = Column(String(255), nullable=True)
    class_number = Column(Integer, nullable=True)
    class_title = Column(String(500), nullable=True)
    professor = Column(String(255), nullable=True)
    scheduled_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(SQLEnum(DraftStatus), default=DraftStatus.DRAFT, nullable=False)
    request_id = Column(String(36), ForeignKey("requests.id"), nullable=True, index=True)
    deliverables = relationship("Deliverable", back_populates="deliverable_type")
    # Relaciones    user = relationship("User", back_populates="deliverable_types")
    request = relationship("Request", back_populates="deliverable_types")
    
    def __repr__(self):
        return f"<CourseClassDraft(id={self.id}, course_name='{self.course_name}', status='{self.status.value}')>"
