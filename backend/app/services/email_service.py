import emails
from emails.template import JinjaTemplate
from pathlib import Path

from app.config.settings import (
    EMAILS_FROM_EMAIL,
    EMAILS_FROM_NAME,
    SMTP_HOST,
    SMTP_PASSWORD,
    SMTP_PORT,
    SMTP_TLS,
    SMTP_USER,
    EMAIL_ENABLED,
)

def send_email(
    email_to: str,
    subject: str,
    html_template: str,
    environment: dict = {}
) -> bool:
    """
    Envía un correo electrónico con logs detallados.
    """
    if not EMAIL_ENABLED:
        print(f"Email no enviado (deshabilitado), destinatario: {email_to}, asunto: {subject}")
        return False
    
    print(f"Preparando mensaje de correo... Para: {email_to}, Asunto: {subject}")
    message = emails.Message(
        subject=subject,
        html=JinjaTemplate(html_template),
        mail_from=(EMAILS_FROM_NAME, EMAILS_FROM_EMAIL),
    )
    
    try:
        # Configuración SMTP
        smtp_config = {
            "host": SMTP_HOST,
            "port": SMTP_PORT,
            "user": SMTP_USER,
            "password": SMTP_PASSWORD,
        }
        
        # Si el puerto es 465, usar SSL directo en lugar de TLS
        if SMTP_PORT == 465:
            smtp_config["ssl"] = True
            print(f"Configuración SMTP: {SMTP_HOST}:{SMTP_PORT}, SSL: True, Usuario: {SMTP_USER}")
        else:
            smtp_config["tls"] = SMTP_TLS
            print(f"Configuración SMTP: {SMTP_HOST}:{SMTP_PORT}, TLS: {SMTP_TLS}, Usuario: {SMTP_USER}")
        
        response = message.send(
            to=email_to,
            render=environment,
            smtp=smtp_config
        )
        
        # Log: Después de intentar enviar el correo
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

def send_reset_password_email(email_to: str, username: str, token: str) -> bool:
    """
    Envía un correo de restablecimiento de contraseña (versión antigua con enlace)
    Mantenido para compatibilidad
    """
    project_name = "MediaLab Sistema"
    reset_url = f"/reset-password/{token}"
    
    template = f"""
    <h1>Restablecimiento de Contraseña</h1>
    <p>Hola {username},</p>
    <p>Has solicitado restablecer tu contraseña en {project_name}.</p>
    <p>Para completar el proceso, por favor haz clic en el siguiente enlace:</p>
    <p><a href="{reset_url}">Restablecer Contraseña</a></p>
    <p>Si no solicitaste este restablecimiento, puedes ignorar este correo.</p>
    <p>Este enlace expirará en 24 horas.</p>
    <p>Saludos,<br>{project_name}</p>
    """
    
    return send_email(
        email_to=email_to,
        subject=f"{project_name} - Restablecimiento de Contraseña",
        html_template=template,
        environment={"username": username, "reset_url": reset_url, "project_name": project_name}
    )

def send_reset_code_email(email_to: str, username: str, code: str) -> bool:
    print(f"Intentando enviar correo a {email_to} con el código {code}")
    """
    Envía un correo con código de verificación para restablecer contraseña
    """
    project_name = "MediaLab Sistema"
    
    # Aquí definimos la plantilla antes de cualquier acción con ella
    template = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 5px; background-color: #f8f9fb;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #7758ff; margin-bottom: 5px;">Código de verificación</h1>
            <p style="color: #6b7280; font-size: 16px;">Recuperación de contraseña</p>
        </div>

        <p style="font-size: 16px; color: #181c24;">Hola {username},</p>

        <p style="font-size: 16px; color: #181c24;">Has solicitado restablecer tu contraseña en {project_name}. Usa el siguiente código para continuar con el proceso:</p>

        <div style="text-align: center; padding: 20px; background-color: #f3f4f6; border-radius: 5px;">
            <h2 style="color: #7758ff; font-size: 30px; font-weight: bold; margin-top: 10px;">{code}</h2>
        </div>

        <p style="font-size: 16px; color: #6b7280;">Este código expirará en 24 horas.</p>

        <p style="font-size: 16px; color: #6b7280;">Si no solicitaste este restablecimiento, puedes ignorar este correo.</p>

        <p style="color: #181c24;">Saludos,<br>{project_name}</p>
    </div>
    """
    
    # Log: Ver los detalles del correo antes de enviarlo
    print(f"Enviando correo a: {email_to}")
    print(f"Asunto: {project_name} - Restablecimiento de Contraseña")
    print(f"Plantilla del correo: \n{template}")
    
    try:
        # Log: Justo antes de enviar el correo
        print("Enviando correo usando la función send_email...")
        
        # Intentar enviar el correo
        response = send_email(
            email_to=email_to,
            subject=f"{project_name} - Restablecimiento de Contraseña",
            html_template=template,
            environment={"username": username, "code": code, "project_name": project_name}
        )
        
        # Log: Después de enviar el correo
        print(f"Respuesta de la función send_email: {response}")
        
        if response:
            print(f"Correo enviado exitosamente a {email_to}")
        else:
            print(f"Error al enviar el correo a {email_to}. Respuesta: {response}")
        
        return response
    except Exception as e:
        # Log de error si algo falla al intentar enviar el correo
        print(f"Error al enviar el correo a {email_to}: {str(e)}")
        return False
