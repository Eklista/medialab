from sqlalchemy import Column, String, Integer, Text
from sqlalchemy.orm import relationship

from app.models.base import Base

class Area(Base):
    """
    Modelo para áreas organizacionales
    """
    __tablename__ = 'areas'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    
    # Relaciones inversas con user_roles
    users = relationship("User", secondary="user_roles", viewonly=True)
    
    def __repr__(self):
        return f"<Area(id={self.id}, name='{self.name}')>"