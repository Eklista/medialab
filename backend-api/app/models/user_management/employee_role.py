"""
Modelo de roles de empleados
"""

from sqlalchemy import Column, String, Text, DateTime, Integer
from sqlalchemy.orm import relationship
from datetime import datetime

from ..base import Base


class EmployeeRole(Base):
    """
    Employee roles for internal users (COLLABORATOR, ADMIN, SUPERADMIN)
    SEEDER table
    """
    __tablename__ = "employee_roles"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    color = Column(String(7))  # Hex color
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    users = relationship("User", back_populates="employee_role")

    def __repr__(self):
        return f"<EmployeeRole(id={self.id}, code='{self.code}', name='{self.name}')>"
