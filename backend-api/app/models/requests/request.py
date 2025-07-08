"""
Modelo principal de solicitud
"""

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Date, Boolean, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from ..base import BaseModel


class Request(BaseModel):
    """
    Client requests for services
    First step in the workflow before becoming projects
    """
    __tablename__ = "requests"    # Basic Info
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    
    # Requestor Info
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=True, index=True)
    
    # Service Details
    service_type_id = Column(Integer, ForeignKey("service_types.id"), nullable=False, index=True)
    priority = Column(String(50), default="medium")  # low, medium, high, urgent
    requested_date = Column(Date)
    
    # Status
    status = Column(String(50), default="pending")  # pending, in_review, approved, rejected, converted
    
    # Evaluation
    evaluation_notes = Column(Text)
    evaluated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    evaluated_at = Column(DateTime(timezone=True))
    
    # Conversion
    converted_project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True)
    
    # Template (if request is based on a template)
    template_id = Column(Integer, ForeignKey("project_templates.id"), nullable=True, index=True)
    
    # Additional Info
    budget_estimate = Column(String(100))
    special_requirements = Column(Text)
    target_audience = Column(String(255))
    
    # Fechas
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)
    
    # Relationships
    client = relationship("User", foreign_keys=[client_id], back_populates="client_requests")
    unit = relationship("Unit", back_populates="requests")
    service_type = relationship("ServiceType", back_populates="requests")
    evaluated_by = relationship("User", foreign_keys=[evaluated_by_user_id], back_populates="evaluated_requests")
    converted_project = relationship("Project", back_populates="original_request")
    template = relationship("ProjectTemplate", back_populates="requests")
    
    # Related entities
    comments = relationship("RequestComment", back_populates="request")
    deliverable_types = relationship("DeliverableType", back_populates="request")
    attachments = relationship("RequestAttachment", back_populates="request")

    def __repr__(self):
        return f"<Request(id={self.id}, title='{self.title}', status='{self.status}')>"
