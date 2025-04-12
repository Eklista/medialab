from typing import List
from sqlalchemy import Boolean, Column, String, Integer, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base

class User(Base):
    """
    Modelo de usuario para autenticación y gestión de usuarios
    """
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    profile_image = Column(String(255), nullable=True)
    banner_image = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    birth_date = Column(Date, nullable=True)
    join_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
    is_online = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    reset_token = Column(String(255), nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    
    # Relaciones - usando strings para evitar problemas de importación circular
    roles = relationship("Role", secondary="user_roles", back_populates="users")
    
    @property
    def full_name(self) -> str:
        """
        Retorna el nombre completo del usuario
        """
        return f"{self.first_name} {self.last_name}"