# app/models/settings/email_config.py
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime
from app.models.base import Base
from datetime import datetime

class SmtpConfiguration(Base):
    """
    Configuración del servidor SMTP para envío de correos
    """
    __tablename__ = 'smtp_configuration'
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Configuración del servidor
    host = Column(String(255), nullable=False)
    port = Column(Integer, nullable=False, default=587)
    username = Column(String(255), nullable=False)
    password = Column(String(255), nullable=False)  # Idealmente encriptado
    
    # Opciones
    use_tls = Column(Boolean, default=True)
    use_ssl = Column(Boolean, default=False)
    timeout = Column(Integer, default=30)  # Segundos
    
    # Remitente predeterminado
    default_from_name = Column(String(100), nullable=False, default="MediaLab")
    default_from_email = Column(String(255), nullable=False)
    
    # Metadatos
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<SmtpConfiguration(host='{self.host}', username='{self.username}')>"


class EmailTemplate(Base):
    """
    Plantillas para correos electrónicos del sistema
    """
    __tablename__ = 'email_templates'
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)  # Identificador único
    name = Column(String(100), nullable=False)
    subject = Column(String(255), nullable=False)
    body_html = Column(Text, nullable=False)
    
    # Metadata
    description = Column(Text, nullable=True)
    available_variables = Column(Text, nullable=True)  # Variables que se pueden usar en la plantilla
    
    # Categorización
    category = Column(String(50), nullable=False, default='general')
    
    # Configuración
    is_active = Column(Boolean, default=True)
    
    def __repr__(self):
        return f"<EmailTemplate(code='{self.code}', name='{self.name}')>"