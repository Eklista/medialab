# scripts/init_email_templates.py
#!/usr/bin/env python3
"""
Script para inicializar plantillas de correo predeterminadas
"""

import logging
import sys
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.common.email_config import EmailTemplate
from app.repositories.email_template_repository import EmailTemplateRepository

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

def init_email_templates() -> None:
    """Inicializa las plantillas de correo predeterminadas."""
    logger.info("Creando conexión a la base de datos...")
    db = SessionLocal()
    
    try:
        # Plantillas predeterminadas
        default_templates = [
            {
                "code": "welcome_email",
                "name": "Bienvenida",
                "subject": "Bienvenido a MediaLab Sistema",
                "category": "user",
                "description": "Correo de bienvenida para nuevos usuarios",
                "available_variables": "username, email, recovery_link, project_name",
                "body_html": """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fb; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <h2 style="color: #181c24;">¡Bienvenido a <span style="color: #7758ff;">MediaLab</span>, {{username}}!</h2>
                    
                    <div style="background-color: #eff6ff; padding: 16px; border-left: 4px solid #7758ff; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0; color: #181c24;">
                            Te informamos que tu cuenta en la plataforma MediaLab ha sido creada exitosamente. Para poder ingresar por primera vez, sigue estos sencillos pasos:
                        </p>
                        <ol style="margin: 10px 0 0 20px; color: #6b7280;">
                            <li>Haz clic en el botón de abajo para ir a la página de recuperación de contraseña.</li>
                            <li>Ingresa el correo electrónico con el que te registraste ({{email}}).</li>
                            <li>Sigue las instrucciones para crear tu contraseña.</li>
                            <li>Una vez creada tu contraseña, podrás iniciar sesión en MediaLab.</li>
                        </ol>
                    </div>
                    
                    <p style="color: #181c24; margin-bottom: 20px;">
                        Una vez que hayas ingresado al sistema, es importante que completes tu perfil de la siguiente manera:
                    </p>
                    <ol style="margin: 0 0 0 20px; color: #6b7280;">
                        <li>Dirígete a la sección <strong>"Mi perfil"</strong> en el menú principal.</li>
                        <li>Haz clic en el botón <strong>"Completar perfil"</strong>.</li>
                        <li><strong>Es obligatorio</strong> que subas una fotografía tuya como foto de perfil.</li>
                        <li>En el banner de perfil, puedes colocar la imagen que desees.</li>
                        <li>Tu número de teléfono es opcional.</li>
                        <li><strong>Es obligatorio</strong> que ingreses tu fecha de nacimiento.</li>
                    </ol>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="{{recovery_link}}" style="background-color: #7758ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
                            Crear mi contraseña
                        </a>
                    </div>
                    
                    <p style="margin-top: 40px; font-size: 14px; color: #6b7280;">
                        Si tienes alguna pregunta o necesitas ayuda en cualquier momento, no dudes en contactar a nuestro equipo de soporte de MediaLab.
                    </p>
                </div>
                """
            },
            {
                "code": "password_reset",
                "name": "Restablecimiento de contraseña",
                "subject": "MediaLab Sistema - Restablecimiento de Contraseña",
                "category": "user",
                "description": "Correo para restablecer contraseña con enlace",
                "available_variables": "username, reset_url, project_name",
                "body_html": """
                <h1>Restablecimiento de Contraseña</h1>
                <p>Hola {{username}},</p>
                <p>Has solicitado restablecer tu contraseña en {{project_name}}.</p>
                <p>Para completar el proceso, por favor haz clic en el siguiente enlace:</p>
                <p><a href="{{reset_url}}">Restablecer Contraseña</a></p>
                <p>Si no solicitaste este restablecimiento, puedes ignorar este correo.</p>
                <p>Este enlace expirará en 24 horas.</p>
                <p>Saludos,<br>{{project_name}}</p>
                """
            },
            {
                "code": "password_reset_code",
                "name": "Código de verificación",
                "subject": "MediaLab Sistema - Restablecimiento de Contraseña",
                "category": "user",
                "description": "Correo con código de verificación para restablecer contraseña",
                "available_variables": "username, code, project_name",
                "body_html": """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 5px; background-color: #f8f9fb;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #7758ff; margin-bottom: 5px;">Código de verificación</h1>
                        <p style="color: #6b7280; font-size: 16px;">Recuperación de contraseña</p>
                    </div>
                    
                    <p style="font-size: 16px; color: #181c24;">Hola {{username}},</p>
                    
                    <p style="font-size: 16px; color: #181c24;">Has solicitado restablecer tu contraseña en {{project_name}}. Usa el siguiente código para continuar con el proceso:</p>
                    
                    <div style="text-align: center; padding: 20px; background-color: #f3f4f6; border-radius: 5px;">
                        <h2 style="color: #7758ff; font-size: 30px; font-weight: bold; margin-top: 10px;">{{code}}</h2>
                    </div>
                    
                    <p style="font-size: 16px; color: #6b7280;">Este código expirará en 5 minutos.</p>
                    
                    <p style="font-size: 16px; color: #6b7280;">Si no solicitaste este restablecimiento, puedes ignorar este correo.</p>
                    
                    <p style="color: #181c24;">Saludos,<br>{{project_name}}</p>
                </div>
                """
            },
            {
                "code": "generic_notification",
                "name": "Notificación genérica",
                "subject": "Notificación",  # Se sobrescribe al enviar
                "category": "general",
                "description": "Plantilla para notificaciones genéricas",
                "available_variables": "subject, message, action_url, action_text, project_name",
                "body_html": """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 5px; background-color: #f8f9fb;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #7758ff; margin-bottom: 5px;">{{subject}}</h1>
                    </div>
                    
                    <div style="font-size: 16px; color: #181c24; margin-bottom: 20px;">
                        {{message}}
                    </div>
                    
                    {% if action_url and action_text %}
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{action_url}}" style="background-color: #7758ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">{{action_text}}</a>
                    </div>
                    {% endif %}
                    
                    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
                        Este es un mensaje automático, por favor no responda a este correo.
                    </p>
                    
                    <p style="color: #181c24; text-align: center;">
                        Saludos,<br>{{project_name}}
                    </p>
                </div>
                """
            }
        ]
        
        # Revisar plantillas existentes
        existing_codes = []
        for template in db.query(EmailTemplate).all():
            existing_codes.append(template.code)
        
        created_count = 0
        updated_count = 0
        
        # Crear o actualizar las plantillas predeterminadas
        for template_data in default_templates:
            code = template_data
            existing_template = EmailTemplateRepository.get_by_code(db, template_data["code"])
            
            if existing_template:
                # Actualizar la plantilla existente
                EmailTemplateRepository.update(db, existing_template, template_data)
                logger.info(f"Plantilla actualizada: {template_data['code']}")
                updated_count += 1
            else:
                # Crear nueva plantilla
                EmailTemplateRepository.create(db, template_data)
                logger.info(f"Plantilla creada: {template_data['code']}")
                created_count += 1
        
        logger.info(f"Proceso completado: {created_count} plantillas creadas, {updated_count} plantillas actualizadas")
        
    except Exception as e:
        logger.error(f"Error al inicializar plantillas de correo: {e}", exc_info=True)
        db.rollback()
        raise
    finally:
        logger.info("Cerrando conexión a la base de datos...")
        db.close()

def main() -> None:
    logger.info("Iniciando inicialización de plantillas de correo...")
    init_email_templates()
    logger.info("Script completado.")

if __name__ == "__main__":
    main()