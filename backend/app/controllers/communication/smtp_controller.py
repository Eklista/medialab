# backend/app/controllers/communication/smtp_controller.py
"""
Controlador para configuración SMTP
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
import logging

from app.services.communication.smtp_service import SmtpService
from app.schemas.communication.email_config import (
    SmtpConfigurationCreate, SmtpConfigurationUpdate, 
    SmtpConfigurationInDB, SmtpTestRequest
)
from app.utils.error_handler import ErrorHandler

logger = logging.getLogger(__name__)

class SmtpController:
    """
    Controlador para operaciones SMTP
    """
    
    @staticmethod
    def get_smtp_configs_list(db: Session, current_user) -> List[SmtpConfigurationInDB]:
        """
        Obtiene lista de configuraciones SMTP
        """
        try:
            configs = SmtpService.get_smtp_configs(db)
            return configs
        except SQLAlchemyError as e:
            raise ErrorHandler.handle_db_error(e, "obtener", "configuraciones SMTP")
    
    @staticmethod
    def create_smtp_config(db: Session, config_in: SmtpConfigurationCreate, current_user) -> SmtpConfigurationInDB:
        """
        Crea nueva configuración SMTP
        """
        try:
            config = SmtpService.create_smtp_config(db=db, config_data=config_in.dict())
            return config
        except SQLAlchemyError as e:
            raise ErrorHandler.handle_db_error(e, "crear", "configuración SMTP")
    
    @staticmethod
    def get_smtp_config_by_id(db: Session, config_id: int, current_user) -> SmtpConfigurationInDB:
        """
        Obtiene configuración SMTP por ID
        """
        try:
            config = SmtpService.get_smtp_config_by_id(db=db, config_id=config_id)
            return config
        except SQLAlchemyError as e:
            raise ErrorHandler.handle_db_error(e, "obtener", "configuración SMTP")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
    
    @staticmethod
    def update_smtp_config(db: Session, config_id: int, config_in: SmtpConfigurationUpdate, current_user) -> SmtpConfigurationInDB:
        """
        Actualiza configuración SMTP
        """
        try:
            config = SmtpService.update_smtp_config(
                db=db,
                config_id=config_id,
                config_data=config_in.dict(exclude_unset=True)
            )
            return config
        except SQLAlchemyError as e:
            raise ErrorHandler.handle_db_error(e, "actualizar", "configuración SMTP")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
    
    @staticmethod
    def delete_smtp_config(db: Session, config_id: int, current_user) -> SmtpConfigurationInDB:
        """
        Elimina configuración SMTP
        """
        try:
            config = SmtpService.delete_smtp_config(db=db, config_id=config_id)
            return config
        except SQLAlchemyError as e:
            raise ErrorHandler.handle_db_error(e, "eliminar", "configuración SMTP")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
    
    @staticmethod
    def activate_smtp_config(db: Session, config_id: int, current_user) -> SmtpConfigurationInDB:
        """
        Activa una configuración SMTP
        """
        try:
            config = SmtpService.set_active_config(db=db, config_id=config_id)
            return config
        except SQLAlchemyError as e:
            raise ErrorHandler.handle_db_error(e, "activar", "configuración SMTP")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
    
    @staticmethod
    def test_smtp_config(db: Session, config_id: int, current_user) -> Dict[str, Any]:
        """
        Prueba una configuración SMTP guardada
        """
        try:
            success = SmtpService.test_smtp_config(db=db, config_id=config_id)
            return {
                "success": success, 
                "message": "Conexión exitosa" if success else "Error de conexión"
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error al probar la configuración: {str(e)}"
            )
    
    @staticmethod
    def test_smtp_connection(config_in: SmtpTestRequest, current_user) -> Dict[str, Any]:
        """
        Prueba conexión SMTP sin guardar
        """
        try:
            from app.services.communication.email_service import test_smtp_connection
            
            success = test_smtp_connection(
                host=config_in.host,
                port=config_in.port,
                username=config_in.username,
                password=config_in.password,
                use_tls=config_in.use_tls,
                use_ssl=config_in.use_ssl,
                from_email=config_in.default_from_email
            )
            
            return {
                "success": success, 
                "message": "Conexión exitosa" if success else "Error de conexión"
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error al probar la conexión: {str(e)}"
            )
    
    @staticmethod
    def send_test_email(db: Session, email_data: dict, current_user) -> Dict[str, Any]:
        """
        Envía correo de prueba - LÓGICA COMPLEJA MOVIDA DEL ENDPOINT
        """
        try:
            # Verificar configuración activa
            active_config = SmtpService.get_active_config(db)
            if not active_config:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No hay configuración SMTP activa"
                )
            
            # Validar datos requeridos
            to_email = email_data.get('to_email')
            if not to_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La dirección de correo destino es obligatoria"
                )
            
            # Procesar según tipo de envío
            template_code = email_data.get('template_code')
            
            if template_code:
                # Envío con plantilla
                result = SmtpController._send_with_template(to_email, template_code, email_data)
            else:
                # Envío genérico
                result = SmtpController._send_generic_email(to_email, email_data)
            
            if result:
                return {
                    "success": True, 
                    "message": f"Correo de prueba enviado exitosamente a {to_email}"
                }
            else:
                return {
                    "success": False, 
                    "message": "Error al enviar el correo de prueba"
                }
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error al enviar correo de prueba: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al enviar correo de prueba: {str(e)}"
            )
    
    @staticmethod
    def _send_with_template(to_email: str, template_code: str, email_data: dict) -> bool:
        """
        Lógica de envío con plantilla
        """
        from app.services.communication.email_service import send_email_with_template
        
        # Determinar contexto según plantilla
        context = SmtpController._get_template_context(template_code, to_email, email_data)
        
        # Usar contexto personalizado si se proporcionó
        if email_data.get('context'):
            context.update(email_data.get('context'))
        
        return send_email_with_template(
            email_to=to_email,
            template_code=template_code,
            context=context,
            subject_override=email_data.get('subject')
        )
    
    @staticmethod
    def _get_template_context(template_code: str, to_email: str, email_data: dict) -> dict:
        """
        Genera contexto para diferentes plantillas
        """
        contexts = {
            "welcome_email": {
                "username": "Usuario Ejemplo",
                "email": to_email,
                "recovery_link": "https://medialab.eklista.com/password-recovery",
                "project_name": "MediaLab Sistema"
            },
            "password_reset": {
                "username": "Usuario Ejemplo",
                "reset_url": "https://medialab.eklista.com/reset-password/token-ejemplo",
                "project_name": "MediaLab Sistema"
            },
            "password_reset_code": {
                "username": "Usuario Ejemplo",
                "code": "123456",
                "project_name": "MediaLab Sistema"
            }
        }
        
        # Contexto por defecto
        default_context = {
            "subject": email_data.get('subject', 'Correo de prueba'),
            "message": email_data.get('message', 'Este es un correo de prueba desde MediaLab Sistema.'),
            "project_name": "MediaLab Sistema"
        }
        
        # Agregar acción si se proporcionó
        if email_data.get('action_url') and email_data.get('action_text'):
            default_context["action_url"] = email_data.get('action_url')
            default_context["action_text"] = email_data.get('action_text')
        
        return contexts.get(template_code, default_context)
    
    @staticmethod
    def _send_generic_email(to_email: str, email_data: dict) -> bool:
        """
        Envío de correo genérico sin plantilla
        """
        from app.services.communication.email_service import send_notification_email
        
        return send_notification_email(
            email_to=to_email,
            subject=email_data.get('subject', 'Correo de prueba'),
            message=email_data.get('message', 'Este es un correo de prueba enviado desde MediaLab Sistema.'),
            action_url=email_data.get('action_url'),
            action_text=email_data.get('action_text')
        )