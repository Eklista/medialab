import sys
from app.services.user_service import UserService  # Cambia esta ruta si es necesario
from dotenv import load_dotenv
import os

# Aquí deberías poner los datos de prueba: email y username
email = "pablo.lacan@galileo.edu"  # Pon una dirección de correo válida para la prueba
username = "pablo.lacan"  # El nombre del usuario

# Ejecutar la función de envío de correo
if __name__ == "__main__":
    try:
        # Aquí llamamos a la función estática
        UserService.send_welcome_email(email, username)
        print(f"Correo enviado a {email} exitosamente.")
    except Exception as e:
        print(f"Error al enviar el correo: {e}")
