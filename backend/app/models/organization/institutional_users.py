# app/models/organization/institutional_users.py
from sqlalchemy import Column, String, Integer, Text, ForeignKey, Boolean, Date, DateTime
from sqlalchemy.orm import relationship, validates
import re
from datetime import datetime
import sqlalchemy as sa

from app.models.base import Base
from app.models.common.entity_mixin import EntityMixin

class InstitutionalUser(Base, EntityMixin):
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
    
    @validates('email')
    def validate_email(self, key, email):
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            raise ValueError("Formato de email inválido")
        return email

    @validates('phone')
    def validate_phone(self, key, phone):
        if phone and not re.match(r"^\+?[0-9]{8,15}$", phone):
            raise ValueError("Formato de teléfono inválido")
        return phone
    
    def set_password(self, password):
        """Establece el hash de la contraseña de forma segura"""
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verifica si la contraseña es correcta"""
        from werkzeug.security import check_password_hash
        return check_password_hash(self.password_hash, password)
    
    def generate_reset_token(self, expires_in=3600):
        """Genera un token de recuperación de contraseña"""
        import secrets
        from datetime import datetime, timedelta
        
        self.reset_token = secrets.token_urlsafe(32)
        self.reset_token_expires = datetime.utcnow() + timedelta(seconds=expires_in)
        return self.reset_token
    
    def __repr__(self):
        return f"<InstitutionalUser(id={self.id}, name='{self.name}', email='{self.email}')>"