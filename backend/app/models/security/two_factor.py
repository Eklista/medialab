# app/models/security/two_factor.py
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class TwoFactorMethod(Base):
    """
    Métodos disponibles para autenticación de dos factores
    """
    __tablename__ = 'two_factor_methods'
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)  # app, sms, email, etc.
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Configuración
    is_active = Column(Boolean, default=True)
    
    def __repr__(self):
        return f"<TwoFactorMethod(code='{self.code}', name='{self.name}')>"


class UserTwoFactor(Base):
    """
    Configuración de 2FA por usuario
    """
    __tablename__ = 'user_two_factor'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    method_id = Column(Integer, ForeignKey('two_factor_methods.id'), nullable=False)
    
    # Datos específicos por método (encriptados idealmente)
    secret_key = Column(String(255), nullable=True)  # Secreto para TOTP
    phone_number = Column(String(50), nullable=True)  # Para SMS
    backup_codes = Column(Text, nullable=True)  # Códigos de respaldo
    
    # Estado
    is_enabled = Column(Boolean, default=True)
    is_confirmed = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    
    # Relaciones
    method = relationship("TwoFactorMethod")
    
    # Índices
    __table_args__ = (
        UniqueConstraint('user_id', 'method_id', name='uix_user_2fa_method'),
    )
    
    def __repr__(self):
        return f"<UserTwoFactor(user_id={self.user_id}, method_id={self.method_id})>"