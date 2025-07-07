"""
Modelo de logs de auditoría
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON, JSONB, UUID
from datetime import datetime

from ..base import Base


class AuditLog(Base):
    """
    Audit logs for tracking all user actions
    Critical for compliance and debugging
    """
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    resource = Column(String(100), index=True)
    resource_id = Column(String(255), index=True)
    
    # Details (JSON strings for compatibility)
    details = Column(JSON)  # JSON string
    old_values = Column(JSON)  # JSON string
    new_values = Column(JSON)  # JSON string
    
    # Context
    ip_address = Column(String(45))
    user_agent = Column(Text)
    session_id = Column(String(255))
    
    # Categorization
    severity = Column(String(20), default="INFO")  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    category = Column(String(50), index=True)  # AUTH, PROJECT, TASK, INVENTORY, etc.
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
    def __repr__(self):
        return f"<AuditLog(action={self.action}, user={self.user_id}, resource={self.resource})>"
