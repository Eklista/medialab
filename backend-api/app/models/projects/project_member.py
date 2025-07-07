"""
Modelo de miembros de proyecto
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import Base


class ProjectMember(Base):
    """Miembros de un proyecto"""
    __tablename__ = "project_members"
    
    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(100))  # Rol en el proyecto
    responsibilities = Column(Text)
    joined_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    left_at = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    
    # Relaciones
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    project = relationship("Project", back_populates="project_members")
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)    user = relationship("User", back_populates="project_memberships")

    def __repr__(self):
        return f"<ProjectMember(id={self.id}, project_id={self.project_id}, user_id={self.user_id})>"
