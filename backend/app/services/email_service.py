# app/services/email_service.py
import emails
from emails.template import JinjaTemplate
from pathlib import Path
from app.services.smtp_service import SmtpService
from app.database import get_db

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

        <p style="font-size: 16px; color: #6b7280;">Este código expirará en 5 minutos.</p>

        <p style="font-size: 16px; color: #6b7280;">Si no solicitaste este restablecimiento, puedes ignorar este correo.</p>

        <p style="color: #181c24;">Saludos,<br>{project_name}</p>
    </div>
    """
    
    # Log: Ver los detalles del correo antes de enviarlo
    print(f"Enviando correo a: {email_to}")
    print(f"Asunto: {project_name} - Restablecimiento de Contraseña")
    
    try:
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

def send_notification_email(email_to: str, subject: str, message: str, action_url: str = None, action_text: str = None) -> bool:
    """
    Envía un correo de notificación genérico
    """
    project_name = "MediaLab Sistema"
    
    # Construir el HTML para el botón de acción si se proporciona
    action_button = ""
    if action_url and action_text:
        action_button = f"""
        <div style="text-align: center; margin: 30px 0;">
            <a href="{action_url}" style="background-color: #7758ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">{action_text}</a>
        </div>
        """
    
    # Plantilla HTML para el correo
    template = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 5px; background-color: #f8f9fb;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #7758ff; margin-bottom: 5px;">{subject}</h1>
        </div>

        <div style="font-size: 16px; color: #181c24; margin-bottom: 20px;">
            {message}
        </div>

        {action_button}

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
            Este es un mensaje automático, por favor no responda a este correo.
        </p>

        <p style="color: #181c24; text-align: center;">
            Saludos,<br>{project_name}
        </p>
    </div>
    """
    
    return send_email(
        email_to=email_to,
        subject=subject,
        html_template=template,
        environment={
            "subject": subject,
            "message": message,
            "action_url": action_url,
            "action_text": action_text,
            "project_name": project_name
        }
    )

def test_smtp_connection(
    host: str,
    port: int,
    username: str,
    password: str,
    use_tls: bool = True,
    use_ssl: bool = False,
    from_email: str = None,
    timeout: int = 5
) -> bool:
    """
    Prueba la conexión SMTP sin enviar un correo
    """
    import smtplib
    
    try:
        # Seleccionar clase SMTP según configuración
        if use_ssl:
            server = smtplib.SMTP_SSL(host, port, timeout=timeout)
        else:
            server = smtplib.SMTP(host, port, timeout=timeout)
            
            # Iniciar TLS si está configurado
            if use_tls:
                server.starttls()
        
        # Iniciar sesión
        server.login(username, password)
        
        # Si llegamos aquí, la conexión fue exitosa
        server.quit()
        return True
    except Exception as e:
        # Loguear el error para debugging
        print(f"Error al probar conexión SMTP: {str(e)}")
        return False