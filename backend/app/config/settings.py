import os
import logging
from pathlib import Path
from dotenv import load_dotenv

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Detectar si estamos en Docker
in_docker = os.path.exists('/.dockerenv')
logger.info(f"Ejecución en Docker: {in_docker}")

# Buscar el archivo .env en múltiples ubicaciones posibles
env_paths = [
    Path(__file__).parent.parent.parent / '.env',  # /app/.env desde settings.py
    Path('/app/.env'),                             # Ruta absoluta en Docker
    Path('.env')                                   # En el directorio actual
]

env_loaded = False
for path in env_paths:
    if path.exists():
        logger.info(f"Cargando variables desde {path}")
        load_dotenv(dotenv_path=path)
        env_loaded = True
        break

if not env_loaded:
    logger.warning("No se encontró ningún archivo .env, usando solo variables de entorno del sistema")

# Funciones auxiliares para conversión de tipos
def get_bool_env(name, default=False):
    """Obtiene una variable de entorno como booleano de forma más segura"""
    value = os.getenv(name, str(default)).lower()
    return value in ('true', '1', 'yes', 'y', 't')

def get_int_env(name, default=0):
    """Obtiene una variable de entorno como entero de forma más segura"""
    try:
        return int(os.getenv(name, default))
    except (ValueError, TypeError):
        logger.warning(f"Error al convertir {name} a entero, usando valor por defecto: {default}")
        return default

def get_list_env(name, default=None, separator=','):
    """Obtiene una variable de entorno como lista de forma más segura"""
    if default is None:
        default = []
    value = os.getenv(name)
    if not value:
        return default
    return [item.strip() for item in value.split(separator)]

# Configuración de la aplicación
APP_NAME = "MediaLab API"
API_V1_PREFIX = "/api/v1"

# Configuración del entorno
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
logger.info(f"Entorno configurado: {ENVIRONMENT}")

# Configuración de la base de datos
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+mysqldb://user:password@localhost/medialab_db"
)

# Si estamos en Docker, reemplazar 'localhost' por 'db'
if in_docker and 'localhost' in DATABASE_URL:
    logger.info("Detectada ejecución en Docker, reemplazando 'localhost' por 'db' en DATABASE_URL")
    DATABASE_URL = DATABASE_URL.replace('localhost', 'db')

# URL del frontend según el entorno
FRONTEND_URL_DEV = os.getenv("FRONTEND_URL_DEV", "http://localhost:5173")
FRONTEND_URL_PROD = os.getenv("FRONTEND_URL_PROD", "https://medialab.eklista.com")
FRONTEND_URL = FRONTEND_URL_PROD if ENVIRONMENT == "production" else FRONTEND_URL_DEV

# Configuración de seguridad
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = get_int_env("ACCESS_TOKEN_EXPIRE_MINUTES", 30)
REFRESH_TOKEN_EXPIRE_DAYS = get_int_env("REFRESH_TOKEN_EXPIRE_DAYS", 7)

# Configuración de CORS
default_cors = ["http://localhost:3000", "http://localhost:5173"]
CORS_ORIGINS = get_list_env("CORS_ORIGINS", default_cors)
if ENVIRONMENT == "production":
    # Asegurarse que el dominio de producción esté en CORS
    prod_domain = "https://medialab.eklista.com"
    if prod_domain not in CORS_ORIGINS:
        CORS_ORIGINS.append(prod_domain)

# Configuración de correo electrónico - Mejorado
EMAIL_ENABLED = get_bool_env("EMAIL_ENABLED", False)
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = get_int_env("SMTP_PORT", 587)
SMTP_TLS = get_bool_env("SMTP_TLS", True)
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
EMAILS_FROM_EMAIL = os.getenv("EMAILS_FROM_EMAIL", "")
EMAILS_FROM_NAME = os.getenv("EMAILS_FROM_NAME", "MediaLab Sistema")

# Diagnóstico de configuración de email
logger.info("==== CONFIGURACIÓN DE EMAIL ====")
logger.info(f"EMAIL_ENABLED: {EMAIL_ENABLED} (tipo: {type(EMAIL_ENABLED).__name__})")
logger.info(f"SMTP_HOST: {SMTP_HOST}")
logger.info(f"SMTP_PORT: {SMTP_PORT} (tipo: {type(SMTP_PORT).__name__})")
logger.info(f"SMTP_TLS: {SMTP_TLS} (tipo: {type(SMTP_TLS).__name__})")
logger.info(f"SMTP_USER: {SMTP_USER}")
logger.info(f"SMTP_PASSWORD: {'*****' if SMTP_PASSWORD else 'No definido'}")
logger.info(f"EMAILS_FROM_EMAIL: {EMAILS_FROM_EMAIL}")
logger.info(f"EMAILS_FROM_NAME: {EMAILS_FROM_NAME}")
logger.info("===============================")

# Forzar habilitación de email si estamos en producción y tenemos credenciales
if ENVIRONMENT == "production" and SMTP_HOST and SMTP_USER and SMTP_PASSWORD and not EMAIL_ENABLED:
    logger.warning("Forzando habilitación de email en producción ya que todas las credenciales están presentes")
    EMAIL_ENABLED = True