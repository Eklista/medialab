import os
from pathlib import Path
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Detectar si estamos en Docker
in_docker = os.path.exists('/.dockerenv')

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

# Configuración de correo electrónico
EMAIL_ENABLED = os.getenv("EMAIL_ENABLED") == "True"
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))  # Valor predeterminado si no existe
SMTP_TLS = os.getenv("SMTP_TLS") == "True"
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
EMAILS_FROM_EMAIL = os.getenv("EMAILS_FROM_EMAIL")
EMAILS_FROM_NAME = os.getenv("EMAILS_FROM_NAME")