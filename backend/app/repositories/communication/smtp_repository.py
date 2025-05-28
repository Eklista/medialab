# app/repositories/smtp_repository.py
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.models.common.email_config import SmtpConfiguration
from app.utils.encryption import encrypt_value, decrypt_value

class SmtpRepository:
    """
    Repositorio para operaciones de acceso a datos de configuración SMTP
    """
    
    @staticmethod
    def get_all(db: Session) -> List[SmtpConfiguration]:
        """
        Obtiene todas las configuraciones SMTP
        """
        return db.query(SmtpConfiguration).all()
    
    @staticmethod
    def get_active(db: Session) -> Optional[SmtpConfiguration]:
        """
        Obtiene la configuración SMTP activa
        """
        return db.query(SmtpConfiguration).filter(SmtpConfiguration.is_active == True).first()
    
    @staticmethod
    def get_by_id(db: Session, config_id: int) -> Optional[SmtpConfiguration]:
        """
        Obtiene una configuración SMTP por su ID
        """
        return db.query(SmtpConfiguration).filter(SmtpConfiguration.id == config_id).first()
    
    @staticmethod
    def create(db: Session, config_data: dict) -> SmtpConfiguration:
        """
        Crea una nueva configuración SMTP en la base de datos
        """
        # Encriptar contraseña antes de guardar
        if 'password' in config_data:
            config_data['password'] = encrypt_value(config_data['password'])
            
        db_config = SmtpConfiguration(**config_data)
        db.add(db_config)
        db.commit()
        db.refresh(db_config)
        return db_config
    
    @staticmethod
    def update(db: Session, config: SmtpConfiguration, config_data: dict) -> SmtpConfiguration:
        """
        Actualiza una configuración SMTP existente
        """
        # Encriptar contraseña si se proporciona
        if 'password' in config_data:
            config_data['password'] = encrypt_value(config_data['password'])
        
        for field, value in config_data.items():
            setattr(config, field, value)
        
        db.commit()
        db.refresh(config)
        return config
    
    @staticmethod
    def delete(db: Session, config: SmtpConfiguration) -> SmtpConfiguration:
        """
        Elimina una configuración SMTP
        """
        db.delete(config)
        db.commit()
        return config
    
    @staticmethod
    def set_active(db: Session, config_id: int) -> bool:
        """
        Establece una configuración como activa y desactiva las demás
        """
        try:
            # Primero desactivamos todas las configuraciones
            db.query(SmtpConfiguration).update({SmtpConfiguration.is_active: False})
            
            # Luego activamos solo la configuración especificada
            config = db.query(SmtpConfiguration).filter(SmtpConfiguration.id == config_id).first()
            if config:
                config.is_active = True
                db.commit()
                return True
            return False
        except SQLAlchemyError:
            db.rollback()
            return False