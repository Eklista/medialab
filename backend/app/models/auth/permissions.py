from sqlalchemy import Column, String, Integer, Text
from sqlalchemy.orm import relationship

from app.models.base import Base

class Permission(Base):
    """
    Modelo para permisos de sistema
    """
    __tablename__ = 'permissions'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    
    # Relaciones - usando strings para evitar problemas de importación circular
    roles = relationship("Role", secondary="role_permissions", back_populates="permissions")