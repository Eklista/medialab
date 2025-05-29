# ============================================================================
# backend/app/config/__init__.py (NUEVO)
# ============================================================================
"""
Configuración de la aplicación
Configuraciones centralizadas, variables de entorno y ajustes del sistema
"""

# Configuración principal de la aplicación
from .settings import (
    settings,
    # Variables generales
    PROJECT_NAME, VERSION, ENVIRONMENT, DEBUG,
    
    # Base de datos
    DATABASE_URL, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME,
    
    # Redis
    REDIS_URL, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB, REDIS_ENABLED,
    
    # Seguridad JWT
    SECRET_KEY, ALGORITHM, ALLOWED_ALGORITHMS, JWT_ISSUER, JWT_AUDIENCE,
    ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS,
    ENABLE_JWE_ENCRYPTION,
    
    # Tokens y autenticación
    TOKEN_BLACKLIST_ENABLED, PASSWORD_SALT,
    
    # Rate limiting
    RATE_LIMIT_ENABLED, RATE_LIMIT_STORAGE, 
    RATE_LIMIT_LOGIN_ATTEMPTS, RATE_LIMIT_LOGIN_WINDOW,
    RATE_LIMIT_GENERAL, RATE_LIMIT_GENERAL_WINDOW,
    
    # Cookies y CORS
    COOKIE_SECURE, COOKIE_SAMESITE, COOKIE_DOMAIN,
    CORS_ORIGINS, CORS_CREDENTIALS,
    
    # Email
    EMAIL_ENABLED, SMTP_HOST, SMTP_PORT, SMTP_TLS,
    SMTP_USER, SMTP_PASSWORD, EMAILS_FROM_EMAIL, EMAILS_FROM_NAME,
    
    # Frontend
    FRONTEND_URL, VITE_API_URL, VITE_FRONTEND_URL,
    
    # Inicialización
    INIT_BASE_STRUCTURE, INIT_DEPARTMENT_DATA, INIT_SERVICE_DATA,
    INIT_PERMISSIONS, INIT_EMAIL_TEMPLATES,
    
    # Funciones de utilidad
    validate_jwt_config, get_security_summary, run_configuration_diagnostics,
    is_running_in_docker
)

# Configuración de Redis
from .redis_config import redis_manager

# Configuración de seguridad
from .security import (
    SecureTokenManager,
    pwd_context,
    
    # Funciones de tokens
    create_access_token, create_encrypted_token, create_normal_token,
    
    # Funciones de contraseñas
    create_password_hash, verify_password, get_password_hash,
    generate_secure_password, check_password_strength
)

__all__ = [
    # Configuración principal
    "settings",
    
    # Variables de configuración exportadas
    "PROJECT_NAME", "VERSION", "ENVIRONMENT", "DEBUG",
    "DATABASE_URL", "DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME",
    "REDIS_URL", "REDIS_HOST", "REDIS_PORT", "REDIS_PASSWORD", "REDIS_DB", "REDIS_ENABLED",
    "SECRET_KEY", "ALGORITHM", "ALLOWED_ALGORITHMS", "JWT_ISSUER", "JWT_AUDIENCE",
    "ACCESS_TOKEN_EXPIRE_MINUTES", "REFRESH_TOKEN_EXPIRE_DAYS", "ENABLE_JWE_ENCRYPTION",
    "TOKEN_BLACKLIST_ENABLED", "PASSWORD_SALT",
    "RATE_LIMIT_ENABLED", "RATE_LIMIT_STORAGE",
    "RATE_LIMIT_LOGIN_ATTEMPTS", "RATE_LIMIT_LOGIN_WINDOW",
    "RATE_LIMIT_GENERAL", "RATE_LIMIT_GENERAL_WINDOW",
    "COOKIE_SECURE", "COOKIE_SAMESITE", "COOKIE_DOMAIN",
    "CORS_ORIGINS", "CORS_CREDENTIALS",
    "EMAIL_ENABLED", "SMTP_HOST", "SMTP_PORT", "SMTP_TLS",
    "SMTP_USER", "SMTP_PASSWORD", "EMAILS_FROM_EMAIL", "EMAILS_FROM_NAME",
    "FRONTEND_URL", "VITE_API_URL", "VITE_FRONTEND_URL",
    "INIT_BASE_STRUCTURE", "INIT_DEPARTMENT_DATA", "INIT_SERVICE_DATA",
    "INIT_PERMISSIONS", "INIT_EMAIL_TEMPLATES",
    
    # Funciones de configuración
    "validate_jwt_config", "get_security_summary", "run_configuration_diagnostics",
    "is_running_in_docker",
    
    # Redis
    "redis_manager",
    
    # Seguridad
    "SecureTokenManager",
    "pwd_context",
    "create_access_token", "create_encrypted_token", "create_normal_token",
    "create_password_hash", "verify_password", "get_password_hash",
    "generate_secure_password", "check_password_strength"
]

__version__ = "1.0.0"
__description__ = "Application configuration and security settings"