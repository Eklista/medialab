# app/models/auth/roles.py
from sqlalchemy import Column, String, Integer, Text
from sqlalchemy.orm import relationship

from app.models.base import Base

class Role(Base):
    """
    Modelo para roles de usuario
    """
    __tablename__ = 'roles'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    
    # Relaciones corregidas
    users = relationship(
        "User", 
        secondary="user_roles", 
        back_populates="roles", 
        overlaps="areas"
    )
    
    permissions = relationship(
        "Permission", 
        secondary="role_permissions", 
        back_populates="roles"
    )