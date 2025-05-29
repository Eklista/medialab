# app/services/smtp_service.py
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.models.common.email_config import SmtpConfiguration
from app.repositories.communication.smtp_repository import SmtpRepository
from app.utils.encryption import decrypt_value
from app.exceptions import ResourceNotFoundException
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class SmtpService:
    """
    Servicio para manejar operaciones de configuración SMTP y envío de correos
    """
    
    @staticmethod
    def get_smtp_configs(db: Session) -> List[Dict[str, Any]]:
        """
        Obtiene todas las configuraciones SMTP
        Retorna versiones seguras (sin contraseñas)
        """
        configs = SmtpRepository.get_all(db)
        return [SmtpService.sanitize_config(config) for config in configs]
    
    @staticmethod
    def get_smtp_config_by_id(db: Session, config_id: int, include_password: bool = False) -> Dict[str, Any]:
        """
        Obtiene una configuración SMTP por su ID
        """
        config = SmtpRepository.get_by_id(db, config_id)
        if not config:
            raise ResourceNotFoundException(f"Configuración SMTP con ID {config_id} no encontrada")
            
        return SmtpService.sanitize_config(config, include_password)
    
    @staticmethod
    def get_active_config(db: Session, include_password: bool = False) -> Optional[Dict[str, Any]]:
        """
        Obtiene la configuración SMTP activa
        """
        config = SmtpRepository.get_active(db)
        if not config:
            return None
            
        return SmtpService.sanitize_config(config, include_password)
    
    @staticmethod
    def create_smtp_config(db: Session, config_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Crea una nueva configuración SMTP
        """
        # Si es la primera configuración, asegurarse de que sea activa
        if len(SmtpRepository.get_all(db)) == 0:
            config_data['is_active'] = True
            
        new_config = SmtpRepository.create(db, config_data)
        return SmtpService.sanitize_config(new_config)
    
    @staticmethod
    def update_smtp_config(db: Session, config_id: int, config_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Actualiza una configuración SMTP existente
        """
        config = SmtpRepository.get_by_id(db, config_id)
        if not config:
            raise ResourceNotFoundException(f"Configuración SMTP con ID {config_id} no encontrada")
        
        # Si el campo password está vacío, mantener la contraseña actual
        if 'password' in config_data and not config_data['password']:
            del config_data['password']
            
        updated_config = SmtpRepository.update(db, config, config_data)
        return SmtpService.sanitize_config(updated_config)
    
    @staticmethod
    def delete_smtp_config(db: Session, config_id: int) -> Dict[str, Any]:
        """
        Elimina una configuración SMTP
        """
        config = SmtpRepository.get_by_id(db, config_id)
        if not config:
            raise ResourceNotFoundException(f"Configuración SMTP con ID {config_id} no encontrada")
            
        # No permitir eliminar la configuración activa si es la única
        if config.is_active and len(SmtpRepository.get_all(db)) == 1:
            raise ValueError("No se puede eliminar la única configuración activa")
            
        deleted_config = SmtpRepository.delete(db, config)
        
        # Si eliminamos la configuración activa, activar otra si existe
        if config.is_active:
            other_config = db.query(SmtpConfiguration).first()
            if other_config:
                SmtpRepository.set_active(db, other_config.id)
                
        return SmtpService.sanitize_config(deleted_config)
    
    @staticmethod
    def set_active_config(db: Session, config_id: int) -> Dict[str, Any]:
        """
        Establece una configuración como activa
        """
        config = SmtpRepository.get_by_id(db, config_id)
        if not config:
            raise ResourceNotFoundException(f"Configuración SMTP con ID {config_id} no encontrada")
            
        success = SmtpRepository.set_active(db, config_id)
        if not success:
            raise SQLAlchemyError("No se pudo activar la configuración")
            
        return SmtpService.sanitize_config(config)
    
    @staticmethod
    def test_smtp_connection(smtp_config: Dict[str, Any]) -> bool:
        """
        Prueba una conexión SMTP utilizando la configuración proporcionada
        """
        host = smtp_config.get('host')
        port = smtp_config.get('port')
        username = smtp_config.get('username')
        password = smtp_config.get('password')
        use_tls = smtp_config.get('use_tls', True)
        use_ssl = smtp_config.get('use_ssl', False)
        
        try:
            # Seleccionar clase SMTP según configuración
            if use_ssl:
                server = smtplib.SMTP_SSL(host, port, timeout=10)
            else:
                server = smtplib.SMTP(host, port, timeout=10)
                
                # Iniciar TLS si está configurado
                if use_tls:
                    server.starttls()
            
            # Iniciar sesión
            server.login(username, password)
            
            # Si llegamos aquí, la conexión fue exitosa
            server.quit()
            return True
        except Exception as e:
            print(f"Error al probar conexión SMTP: {str(e)}")
            return False
    
    @staticmethod
    def test_smtp_config(db: Session, config_id: int) -> bool:
        """
        Prueba una configuración SMTP almacenada
        """
        config = SmtpRepository.get_by_id(db, config_id)
        if not config:
            raise ResourceNotFoundException(f"Configuración SMTP con ID {config_id} no encontrada")
            
        config_dict = SmtpService.get_complete_config(config)
        return SmtpService.test_smtp_connection(config_dict)
    
    @staticmethod
    def get_complete_config(config: SmtpConfiguration) -> Dict[str, Any]:
        """
        Obtiene todos los datos de una configuración SMTP, incluyendo la contraseña desencriptada
        """
        return {
            "id": config.id,
            "host": config.host,
            "port": config.port,
            "username": config.username,
            "password": decrypt_value(config.password),
            "use_tls": config.use_tls,
            "use_ssl": config.use_ssl,
            "timeout": config.timeout,
            "default_from_name": config.default_from_name,
            "default_from_email": config.default_from_email,
            "is_active": config.is_active,
            "updated_at": config.updated_at
        }
    
    @staticmethod
    def sanitize_config(config: SmtpConfiguration, include_password: bool = False) -> Dict[str, Any]:
        """
        Convierte una configuración SMTP en un diccionario, ocultando la contraseña por defecto
        """
        config_dict = {
            "id": config.id,
            "host": config.host,
            "port": config.port,
            "username": config.username,
            "use_tls": config.use_tls,
            "use_ssl": config.use_ssl,
            "timeout": config.timeout,
            "default_from_name": config.default_from_name,
            "default_from_email": config.default_from_email,
            "is_active": config.is_active,
            "updated_at": config.updated_at
        }
        
        if include_password:
            # Desencriptar contraseña si es necesario
            config_dict["password"] = decrypt_value(config.password)
        else:
            config_dict["password"] = "" if not config.password else "●●●●●●●●"
            
        return config_dict
    
    @staticmethod
    def send_email(db: Session, to_email: str, subject: str, html_content: str, text_content: str = None) -> bool:
        """
        Envía un correo electrónico utilizando la configuración SMTP activa
        """
        # Obtener la configuración activa
        active_config = SmtpService.get_active_config(db, include_password=True)
        if not active_config:
            raise ValueError("No hay configuración SMTP activa")
        
        # Desencriptar la contraseña
        password = active_config['password']
        
        # Crear el mensaje
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{active_config['default_from_name']} <{active_config['default_from_email']}>"
        msg['To'] = to_email
        
        # Agregar texto plano
        if text_content:
            part1 = MIMEText(text_content, 'plain')
            msg.attach(part1)
        
        # Agregar HTML
        part2 = MIMEText(html_content, 'html')
        msg.attach(part2)
        
        # Configurar servidor SMTP
        try:
            if active_config['use_ssl']:
                server = smtplib.SMTP_SSL(active_config['host'], active_config['port'], timeout=active_config['timeout'])
            else:
                server = smtplib.SMTP(active_config['host'], active_config['port'], timeout=active_config['timeout'])
                if active_config['use_tls']:
                    server.starttls()
            
            server.login(active_config['username'], password)
            server.sendmail(active_config['default_from_email'], to_email, msg.as_string())
            server.quit()
            
            return True
        except Exception as e:
            print(f"Error al enviar correo: {str(e)}")
            return False