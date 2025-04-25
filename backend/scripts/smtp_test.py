import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configuración
smtp_host = "smtp.hostinger.com"
smtp_port = 465
smtp_user = "medialab@byblnk.com"
smtp_password = "V0rt3x2025*"
from_email = "medialab@byblnk.com"
to_email = "pablo.lacan@galileo.edu"

# Crear mensaje
message = MIMEMultipart()
message["From"] = from_email
message["To"] = to_email
message["Subject"] = "Prueba de conexión SMTP MediaLab"

# Cuerpo del mensaje
body = "Este es un correo de prueba para verificar la configuración SMTP."
message.attach(MIMEText(body, "plain"))

try:
    # Para puerto 465, usar SMTP_SSL
    server = smtplib.SMTP_SSL(smtp_host, smtp_port)
    
    # Si usaras el puerto 587, sería así:
    # server = smtplib.SMTP(smtp_host, smtp_port)
    # server.starttls()
    
    server.login(smtp_user, smtp_password)
    text = message.as_string()
    server.sendmail(from_email, to_email, text)
    print("Correo enviado con éxito!")
except Exception as e:
    print(f"Error al enviar correo: {e}")
finally:
    server.quit()