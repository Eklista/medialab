# app/services/institutional_user_service.py
from typing import Optional
from datetime import datetime, timedelta
import re
from sqlalchemy.orm import Session
from werkzeug.security import generate_password_hash, check_password_hash

from app.models.organization.institutional_users import InstitutionalUser

class InstitutionalUserService:
    """
    Servicio para gestionar usuarios institucionales
    """
    
    @staticmethod
    def set_password(user: InstitutionalUser, password: str) -> None:
        """
        Establece el hash de la contraseña de forma segura
        """
        user.password_hash = generate_password_hash(password)
    
    @staticmethod
    def check_password(user: InstitutionalUser, password: str) -> bool:
        """
        Verifica si la contraseña es correcta
        """
        return check_password_hash(user.password_hash, password)
    
    @staticmethod
    def generate_reset_token(user: InstitutionalUser, expires_in: int = 3600) -> str:
        """
        Genera un token de recuperación de contraseña
        """
        import secrets
        
        user.reset_token = secrets.token_urlsafe(32)
        user.reset_token_expires = datetime.utcnow() + timedelta(seconds=expires_in)
        return user.reset_token
    
    @staticmethod
    def validate_email(email: str) -> str:
        """
        Valida el formato de email
        """
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            raise ValueError("Formato de email inválido")
        return email
    
    @staticmethod
    def validate_phone(phone: str) -> str:
        """
        Valida el formato de teléfono
        """
        if phone and not re.match(r"^\+?[0-9]{8,15}$", phone):
            raise ValueError("Formato de teléfono inválido")
        return phone