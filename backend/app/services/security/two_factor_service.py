# app/services/security/two_factor_service.py
import base64
import json
import secrets
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.security.two_factor import UserTwoFactor, TwoFactorMethod

class TwoFactorService:
    """
    Servicio para gestionar la autenticación de dos factores
    """
    
    @staticmethod
    def encrypt_secret(raw_secret: str) -> str:
        """
        Encripta un secreto antes de almacenarlo
        En una implementación real, se debe usar una biblioteca de encriptación
        
        Args:
            raw_secret: Secreto sin encriptar
            
        Returns:
            str: Secreto encriptado
        """
        # Implementación simulada, en producción usar algo como Fernet
        return base64.b64encode(raw_secret.encode()).decode()
    
    @staticmethod
    def decrypt_secret(encrypted_secret: str) -> Optional[str]:
        """
        Desencripta el secreto almacenado
        En una implementación real, se debe usar una biblioteca de encriptación
        
        Args:
            encrypted_secret: Secreto encriptado
            
        Returns:
            Optional[str]: Secreto desencriptado o None si no hay secreto
        """
        if not encrypted_secret:
            return None
            
        # Implementación simulada, en producción usar algo como Fernet
        return base64.b64decode(encrypted_secret.encode()).decode()
    
    @staticmethod
    def generate_backup_codes(count: int = 8) -> List[str]:
        """
        Genera códigos de respaldo
        
        Args:
            count: Número de códigos a generar
            
        Returns:
            List[str]: Lista de códigos generados
        """
        return [secrets.token_hex(3) for _ in range(count)]
    
    @staticmethod
    def get_available_methods(db: Session) -> List[TwoFactorMethod]:
        """
        Obtiene todos los métodos 2FA disponibles
        
        Args:
            db: Sesión SQLAlchemy
            
        Returns:
            List[TwoFactorMethod]: Lista de métodos disponibles
        """
        return db.query(TwoFactorMethod).filter(TwoFactorMethod.is_active == True).all()
    
    @staticmethod
    def setup_user_2fa(db: Session, user_id: int, method_id: int, 
                     secret_key: str = None, phone_number: str = None) -> UserTwoFactor:
        """
        Configura la autenticación de dos factores para un usuario
        
        Args:
            db: Sesión SQLAlchemy
            user_id: ID del usuario
            method_id: ID del método 2FA
            secret_key: Secreto para TOTP (opcional)
            phone_number: Número de teléfono para SMS (opcional)
            
        Returns:
            UserTwoFactor: Configuración 2FA creada
        """
        # Verificar si ya existe
        existing = db.query(UserTwoFactor).filter(
            UserTwoFactor.user_id == user_id,
            UserTwoFactor.method_id == method_id
        ).first()
        
        if existing:
            # Actualizar configuración existente
            if secret_key:
                existing.secret_key = TwoFactorService.encrypt_secret(secret_key)
            if phone_number:
                existing.phone_number = phone_number
                
            existing.is_enabled = True
            db.commit()
            db.refresh(existing)
            return existing
        
        # Crear nueva configuración
        user_2fa = UserTwoFactor(
            user_id=user_id,
            method_id=method_id,
            is_enabled=True,
            is_confirmed=False
        )
        
        if secret_key:
            user_2fa.secret_key = TwoFactorService.encrypt_secret(secret_key)
        if phone_number:
            user_2fa.phone_number = phone_number
            
        # Generar códigos de respaldo
        backup_codes = TwoFactorService.generate_backup_codes()
        user_2fa.backup_codes = json.dumps(backup_codes)
        
        db.add(user_2fa)
        db.commit()
        db.refresh(user_2fa)
        
        return user_2fa
    
    @staticmethod
    def confirm_2fa_setup(db: Session, user_id: int, method_id: int) -> bool:
        """
        Confirma la configuración 2FA de un usuario
        
        Args:
            db: Sesión SQLAlchemy
            user_id: ID del usuario
            method_id: ID del método 2FA
            
        Returns:
            bool: True si se confirmó correctamente, False si no se encontró
        """
        user_2fa = db.query(UserTwoFactor).filter(
            UserTwoFactor.user_id == user_id,
            UserTwoFactor.method_id == method_id
        ).first()
        
        if not user_2fa:
            return False
            
        user_2fa.is_confirmed = True
        db.commit()
        
        return True
    
    @staticmethod
    def verify_backup_code(db: Session, user_id: int, method_id: int, code: str) -> bool:
        """
        Verifica si un código de respaldo es válido
        
        Args:
            db: Sesión SQLAlchemy
            user_id: ID del usuario
            method_id: ID del método 2FA
            code: Código de respaldo
            
        Returns:
            bool: True si el código es válido, False en caso contrario
        """
        user_2fa = db.query(UserTwoFactor).filter(
            UserTwoFactor.user_id == user_id,
            UserTwoFactor.method_id == method_id,
            UserTwoFactor.is_enabled == True
        ).first()
        
        if not user_2fa or not user_2fa.backup_codes:
            return False
            
        try:
            codes = json.loads(user_2fa.backup_codes)
            if code in codes:
                # Remover el código usado
                codes.remove(code)
                user_2fa.backup_codes = json.dumps(codes)
                db.commit()
                return True
            return False
        except json.JSONDecodeError:
            return False
    
    @staticmethod
    def disable_2fa(db: Session, user_id: int, method_id: int = None) -> bool:
        """
        Deshabilita la autenticación de dos factores para un usuario
        
        Args:
            db: Sesión SQLAlchemy
            user_id: ID del usuario
            method_id: ID del método 2FA (opcional, si no se especifica se deshabilitan todos)
            
        Returns:
            bool: True si se deshabilitó correctamente
        """
        query = db.query(UserTwoFactor).filter(UserTwoFactor.user_id == user_id)
        
        if method_id:
            query = query.filter(UserTwoFactor.method_id == method_id)
            
        for user_2fa in query.all():
            user_2fa.is_enabled = False
            
        db.commit()
        return True