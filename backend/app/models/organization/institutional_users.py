# app/models/organization/institutional_users.py
from sqlalchemy import Column, String, Integer, Text, ForeignKey, Boolean, Date, DateTime
from sqlalchemy.orm import relationship, validates
import re
from datetime import datetime
import sqlalchemy as sa

from app.models.base import Base

class InstitutionalUser(Base):
    """
    Modelo para usuarios/solicitantes institucionales dentro de la universidad
    """
    __tablename__ = 'institutional_users'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(50), nullable=True)
    
    # Información institucional
    department_id = Column(Integer, ForeignKey('departments.id'), nullable=True)
    position = Column(String(255), nullable=True)

    # Acceso al portal
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    
    # Estado y metadata
    is_active = Column(Boolean, default=True)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)
    
    # Para el reseteo de contraseña
    reset_token = Column(String(255), nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    
    # Relaciones
    department = relationship("Department")
    
    # Relaciones inversas con entidades principales
    projects = relationship("Project", foreign_keys="Project.institutional_user_id", back_populates="institutional_user")
    courses = relationship("Course", foreign_keys="Course.institutional_user_id", back_populates="institutional_user")
    podcast_series = relationship("PodcastSeries", foreign_keys="PodcastSeries.institutional_user_id", back_populates="institutional_user")
    
    # Relación con Request general
    requests = relationship("Request", foreign_keys="Request.requester_institutional_id", back_populates="institutional_requester")
    
    # Índices
    __table_args__ = (
        sa.Index('idx_institutional_user_email', 'email'),
        sa.Index('idx_institutional_user_username', 'username'),
        sa.Index('idx_institutional_user_is_active', 'is_active'),
        sa.Index('idx_institutional_user_department', 'department_id')
    )
    
    def __repr__(self):
        return f"<InstitutionalUser(id={self.id}, name='{self.name}', email='{self.email}')>"