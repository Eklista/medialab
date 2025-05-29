# app/services/email_service.py
"""
Servicio para enviar correos electrónicos utilizando la configuración SMTP activa.
EN ESTE SERVICIO SE UNIFICA EL ENVÍO DE CORREOS CON PLANTILLAS Y SIN PLANTILLAS.

Las funciones generales son:
- send_email: Función base para enviar correos directamente con HTML
- send_email_with_template: Función para enviar correos usando plantillas de la BD

Las funciones específicas para cada tipo de correo son:
- send_welcome_email: Correo de bienvenida para nuevos usuarios
- send_reset_password_email: Correo para restablecer contraseña (con enlace)
- send_reset_code_email: Correo con código para restablecer contraseña
- send_notification_email: Correo de notificación genérico
"""

import emails
from emails.template import JinjaTemplate
from pathlib import Path
from app.services.communication.smtp_service import SmtpService
from app.services.templates.email_template_service import EmailTemplateService
from app.database import get_db
from jinja2 import Template

def send_email(
    email_to: str,
    subject: str,
    html_template: str,
    environment: dict = {}
) -> bool:
    """
    Envía un correo electrónico utilizando la configuración SMTP activa
    """
    db = next(get_db())
    try:
        # Obtener la configuración SMTP activa
        smtp_config = SmtpService.get_active_config(db, include_password=True)
        
        if not smtp_config:
            print("No hay configuración SMTP activa. No se puede enviar el correo.")
            return False
        
        # Configurar el mensaje de correo
        message = emails.Message(
            subject=subject,
            html=JinjaTemplate(html_template),
            mail_from=(smtp_config["default_from_name"], smtp_config["default_from_email"]),
        )
        
        # Configurar el servidor SMTP
        smtp_options = {
            "host": smtp_config["host"],
            "port": smtp_config["port"],
            "user": smtp_config["username"],
            "password": smtp_config["password"],
            "timeout": smtp_config["timeout"]
        }
        
        # Determinar el tipo de conexión (SSL o TLS)
        if smtp_config["port"] == 465 or smtp_config["use_ssl"]:
            smtp_options["ssl"] = True
            print(f"Configuración SMTP: {smtp_config['host']}:{smtp_config['port']}, SSL: True, Usuario: {smtp_config['username']}")
        else:
            smtp_options["tls"] = smtp_config["use_tls"]
            print(f"Configuración SMTP: {smtp_config['host']}:{smtp_config['port']}, TLS: {smtp_config['use_tls']}, Usuario: {smtp_config['username']}")
        
        # Enviar el correo
        response = message.send(
            to=email_to,
            render=environment,
            smtp=smtp_options
        )
        print(f"Respuesta del servidor SMTP: {response}")
        
        if response.status_code == 250:
            print(f"Correo enviado exitosamente a {email_to}")
            return True
        else:
            print(f"Fallo el envío del correo. Status: {response.status_code}, Texto: {response.status_text}")
            return False
    except Exception as e:
        # Log de error si algo falla al intentar enviar el correo
        print(f"Error en el envío del correo a {email_to}: {str(e)}")
        return False
    finally:
        db.close()

def send_email_with_template(
    email_to: str,
    template_code: str,
    context: dict = {},
    subject_override: str = None
) -> bool:
    """
    Envía un correo utilizando una plantilla predefinida
    """
    db = next(get_db())
    try:
        # Obtener la plantilla por su código
        template_data = EmailTemplateService.get_template_by_code(db, template_code)
        
        # Obtener el sujeto (usar el override si se proporciona)
        subject = subject_override or template_data["subject"]
        
        # Renderizar el HTML con el contexto
        rendered_html = EmailTemplateService.render_template(db, template_code, context)
        
        # Enviar el correo
        success = send_email(
            email_to=email_to,
            subject=subject,
            html_template=rendered_html,
            environment={}  # No es necesario pasar environment porque ya está renderizado
        )
        
        return success
    except Exception as e:
        print(f"Error al enviar correo con plantilla {template_code}: {str(e)}")
        return False
    finally:
        db.close()

def send_reset_password_email(email_to: str, username: str, token: str) -> bool:
    """
    Envía un correo de restablecimiento de contraseña (versión antigua con enlace)
    Mantenido para compatibilidad
    """
    reset_url = f"/reset-password/{token}"
    
    context = {
        "username": username,
        "reset_url": reset_url,
        "project_name": "MediaLab Sistema"
    }
    
    return send_email_with_template(
        email_to=email_to,
        template_code="password_reset",
        context=context
    )

def send_reset_code_email(email_to: str, username: str, code: str) -> bool:
    """
    Envía un correo con código de verificación para restablecer contraseña
    """
    # Usar plantilla de la base de datos
    context = {
        "username": username,
        "code": code,
        "project_name": "MediaLab Sistema"
    }
    
    return send_email_with_template(
        email_to=email_to,
        template_code="password_reset_code",
        context=context
    )

def send_notification_email(email_to: str, subject: str, message: str, action_url: str = None, action_text: str = None) -> bool:
    """
    Envía un correo de notificación genérico
    """
    context = {
        "subject": subject,
        "message": message,
        "action_url": action_url,
        "action_text": action_text,
        "project_name": "MediaLab Sistema"
    }
    
    return send_email_with_template(
        email_to=email_to,
        template_code="generic_notification",
        context=context,
        subject_override=subject
    )

def send_welcome_email(email_to: str, username: str) -> bool:
    """
    Envía un correo de bienvenida a un nuevo usuario
    """
    # URL directa en producción para evitar problemas con variables de entorno
    recovery_link = "https://medialab.eklista.com/password-recovery"
    
    context = {
        "username": username,
        "email": email_to,
        "recovery_link": recovery_link,
        "project_name": "MediaLab Sistema"
    }
    
    print(f"Intentando enviar correo de bienvenida a {email_to}")
    
    try:
        success = send_email_with_template(
            email_to=email_to,
            template_code="welcome_email",
            context=context
        )
        
        if success:
            print(f"Correo de bienvenida enviado exitosamente a {email_to}")
        else:
            print(f"Error al enviar correo de bienvenida a {email_to} - Falló el envío")
        
        return success
    except Exception as e:
        print(f"Error general al enviar correo de bienvenida: {str(e)}")
        return False