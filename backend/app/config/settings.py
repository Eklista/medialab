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

# Configuración de CORS para desarrollo y producción
if ENVIRONMENT == "production":
    CORS_ORIGINS = [
        "https://medialab.eklista.com",
        "https://www.medialab.eklista.com"
    ]
    FRONTEND_URL = "https://medialab.eklista.com"
else:
    CORS_ORIGINS = [
        "http://localhost:5173",  # Vite dev
        "http://localhost:3000",  # React dev alternativo
        "http://127.0.0.1:5173",  # Alternativa localhost
        "http://127.0.0.1:3000"   # Alternativa localhost
    ]
    FRONTEND_URL = "http://localhost:5173"

# Configuración de cookies
CORS_CREDENTIALS = True
COOKIE_SECURE = ENVIRONMENT == "production"  # Solo HTTPS en producción
COOKIE_SAMESITE = "strict" if ENVIRONMENT == "production" else "lax"  # Más permisivo en dev
COOKIE_DOMAIN = None  # Dejar que el navegador determine

# Logging de configuración
logger.info(f"CORS Origins: {CORS_ORIGINS}")
logger.info(f"Frontend URL: {FRONTEND_URL}")
logger.info(f"Cookie Secure: {COOKIE_SECURE}")
logger.info(f"Cookie SameSite: {COOKIE_SAMESITE}")

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

# ===========================================
# CONFIGURACIÓN DE SEGURIDAD CRÍTICA
# ===========================================

# Configuración de seguridad CRÍTICA
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY or SECRET_KEY == "super-secret-key-change-in-production":
    if ENVIRONMENT == "production":
        logger.error("SECRET_KEY no configurado correctamente en producción!")
        raise ValueError("SECRET_KEY debe ser configurado en producción")
    else:
        logger.warning("Usando SECRET_KEY por defecto en desarrollo")
        SECRET_KEY = "super-secret-key-change-in-production"

ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = get_int_env("ACCESS_TOKEN_EXPIRE_MINUTES", 15)  # Reducido de 30 a 15
REFRESH_TOKEN_EXPIRE_DAYS = get_int_env("REFRESH_TOKEN_EXPIRE_DAYS", 7)

# JWT Security Enhancement
JWT_ISSUER = os.getenv("JWT_ISSUER", "medialab-api")
JWT_AUDIENCE = os.getenv("JWT_AUDIENCE", "medialab-users")

# Token Security
TOKEN_BLACKLIST_ENABLED = get_bool_env("TOKEN_BLACKLIST_ENABLED", True)

# Encryption
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    if ENVIRONMENT == "production":
        logger.error("ENCRYPTION_KEY no configurado en producción!")
        raise ValueError("ENCRYPTION_KEY debe ser configurado en producción")
    else:
        logger.warning("Usando ENCRYPTION_KEY por defecto en desarrollo")
        ENCRYPTION_KEY = "dev-encryption-key-change-in-production"

PASSWORD_SALT = os.getenv("PASSWORD_SALT", "medialab-default-salt-change-in-production")

# Rate Limiting
RATE_LIMIT_ENABLED = get_bool_env("RATE_LIMIT_ENABLED", True)
RATE_LIMIT_LOGIN_ATTEMPTS = get_int_env("RATE_LIMIT_LOGIN_ATTEMPTS", 5)
RATE_LIMIT_LOGIN_WINDOW = get_int_env("RATE_LIMIT_LOGIN_WINDOW", 300)
RATE_LIMIT_GENERAL = get_int_env("RATE_LIMIT_GENERAL", 100)
RATE_LIMIT_GENERAL_WINDOW = get_int_env("RATE_LIMIT_GENERAL_WINDOW", 60)

# Security Headers
SECURITY_HEADERS_ENABLED = get_bool_env("SECURITY_HEADERS_ENABLED", True)

# Session Security
SESSION_SECURE_COOKIES = get_bool_env("SESSION_SECURE_COOKIES", ENVIRONMENT == "production")
SESSION_HTTPONLY_COOKIES = get_bool_env("SESSION_HTTPONLY_COOKIES", True)
SESSION_SAMESITE = os.getenv("SESSION_SAMESITE", "lax")

# ❌ ELIMINADO: Segunda configuración de CORS que causaba conflicto
# No definir CORS_ORIGINS nuevamente aquí - ya está definido arriba

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

# Configuración de seguridad adicional
logger.info("==== CONFIGURACIÓN DE SEGURIDAD ====")
logger.info(f"TOKEN_BLACKLIST_ENABLED: {TOKEN_BLACKLIST_ENABLED}")
logger.info(f"RATE_LIMIT_ENABLED: {RATE_LIMIT_ENABLED}")
logger.info(f"SECURITY_HEADERS_ENABLED: {SECURITY_HEADERS_ENABLED}")
logger.info(f"ACCESS_TOKEN_EXPIRE_MINUTES: {ACCESS_TOKEN_EXPIRE_MINUTES}")
logger.info(f"CORS_ORIGINS: {CORS_ORIGINS}")
logger.info("====================================")

# Forzar habilitación de email si estamos en producción y tenemos credenciales
if ENVIRONMENT == "production" and SMTP_HOST and SMTP_USER and SMTP_PASSWORD and not EMAIL_ENABLED:
    logger.warning("Forzando habilitación de email en producción ya que todas las credenciales están presentes")
    EMAIL_ENABLED = True