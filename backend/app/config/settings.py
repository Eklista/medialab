import os
from pathlib import Path
from dotenv import load_dotenv

# Detectar si estamos en Docker
in_docker = os.path.exists('/.dockerenv')

# Primero intentar cargar desde el entorno del sistema
# Luego, cargar variables de entorno desde .env solo como respaldo
env_path = Path(__file__).parent.parent.parent / '.env'
if env_path.exists():
    # Cargar variables solo si el archivo existe
    load_dotenv(dotenv_path=env_path)

# Configuración de la aplicación
APP_NAME = "MediaLab API"
API_V1_PREFIX = "/api/v1"

# Configuración del entorno
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Configuración de la base de datos
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+mysqldb://user:password@localhost/medialab_db"
)

# Si estamos en Docker, reemplazar 'localhost' por 'db'
if in_docker and 'localhost' in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace('localhost', 'db')

# URL del frontend según el entorno
FRONTEND_URL_DEV = os.getenv("FRONTEND_URL_DEV", "http://localhost:5173")
FRONTEND_URL_PROD = os.getenv("FRONTEND_URL_PROD", "https://medialab.eklista.com")
FRONTEND_URL = FRONTEND_URL_PROD if ENVIRONMENT == "production" else FRONTEND_URL_DEV

# Configuración de seguridad
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Configuración de CORS
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://medialab.eklista.com",
    "http://168.231.74.237"
]

# Configuración de correo electrónico - Modificar esta parte
# Verificar EMAIL_ENABLED usando un enfoque más flexible
EMAIL_ENABLED = os.getenv("EMAIL_ENABLED", "").lower() in ["true", "1", "yes"]
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_TLS = os.getenv("SMTP_TLS", "").lower() in ["true", "1", "yes"]
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
EMAILS_FROM_EMAIL = os.getenv("EMAILS_FROM_EMAIL")
EMAILS_FROM_NAME = os.getenv("EMAILS_FROM_NAME")