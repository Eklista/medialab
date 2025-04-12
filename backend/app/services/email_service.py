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
    Envía un correo electrónico
    """
    if not EMAIL_ENABLED:
        print(f"Email no enviado, destinatario: {email_to}, asunto: {subject}")
        return False
        
    message = emails.Message(
        subject=subject,
        html=JinjaTemplate(html_template),
        mail_from=(EMAILS_FROM_NAME, EMAILS_FROM_EMAIL),
    )
    
    response = message.send(
        to=email_to,
        render=environment,
        smtp={
            "host": SMTP_HOST,
            "port": SMTP_PORT,
            "tls": SMTP_TLS,
            "user": SMTP_USER,
            "password": SMTP_PASSWORD,
        }
    )
    
    return response.status_code == 250

def send_reset_password_email(email_to: str, username: str, token: str) -> bool:
    """
    Envía un correo de restablecimiento de contraseña
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