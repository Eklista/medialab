# app/models/security/two_factor.py
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, validates
from datetime import datetime
import sqlalchemy as sa

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
    
    # Relaciones
    user_methods = relationship("UserTwoFactor", back_populates="method")
    
    # Índices
    __table_args__ = (
        sa.Index('idx_2fa_method_code', 'code'),
        sa.Index('idx_2fa_method_active', 'is_active')
    )
    
    def __repr__(self):
        return f"<TwoFactorMethod(code='{self.code}', name='{self.name}')>"
    
    @validates('code')
    def validate_code(self, key, code):
        if not code or not code.strip():
            raise ValueError("El código del método 2FA no puede estar vacío")
        return code.lower()  # Normalizamos a minúsculas


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
    method = relationship("TwoFactorMethod", back_populates="user_methods")
    
    # Índices y restricciones
    __table_args__ = (
        UniqueConstraint('user_id', 'method_id', name='uix_user_2fa_method'),
        sa.Index('idx_user_2fa_user', 'user_id'),
        sa.Index('idx_user_2fa_method', 'method_id'),
        sa.Index('idx_user_2fa_enabled', 'is_enabled')
    )
    
    def __repr__(self):
        return f"<UserTwoFactor(user_id={self.user_id}, method_id={self.method_id})>"
    
    @validates('phone_number')
    def validate_phone(self, key, phone):
        if phone and not phone.strip():
            raise ValueError("El número de teléfono no puede estar vacío si se proporciona")
        return phone
    
    def encrypt_secret(self, raw_secret):
        """
        Encripta un secreto antes de almacenarlo
        En una implementación real, usaría una biblioteca de encriptación
        """
        # Implementación simulada, en producción usar algo como Fernet
        import base64
        return base64.b64encode(raw_secret.encode()).decode()
    
    def decrypt_secret(self):
        """
        Desencripta el secreto almacenado
        En una implementación real, usaría una biblioteca de encriptación
        """
        # Implementación simulada, en producción usar algo como Fernet
        import base64
        if not self.secret_key:
            return None
        return base64.b64decode(self.secret_key.encode()).decode()
    
    def generate_backup_codes(self, count=8):
        """
        Genera códigos de respaldo para el usuario
        """
        import secrets
        import json
        
        codes = [secrets.token_hex(3) for _ in range(count)]
        self.backup_codes = json.dumps(codes)
        return codes
    
    def verify_backup_code(self, code):
        """
        Verifica si un código de respaldo es válido
        """
        import json
        
        if not self.backup_codes:
            return False
            
        try:
            codes = json.loads(self.backup_codes)
            if code in codes:
                # Remover el código usado
                codes.remove(code)
                self.backup_codes = json.dumps(codes)
                return True
            return False
        except json.JSONDecodeError:
            return False