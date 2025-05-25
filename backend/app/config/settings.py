# backend/app/config/settings.py
import os
from typing import Optional, List
from pydantic_settings import BaseSettings

# Detectar si estamos en Docker
def is_running_in_docker() -> bool:
    """Detecta si la aplicación está ejecutándose en Docker"""
    return (
        os.path.exists('/.dockerenv') or 
        os.getenv('DOCKER_CONTAINER') == 'true' or
        os.getenv('HOSTNAME', '').startswith(('backend', 'medialab'))
    )

class Settings(BaseSettings):
    """Configuración de la aplicación usando Pydantic Settings"""
    
    # ===== CONFIGURACIÓN GENERAL =====
    PROJECT_NAME: str = "MediaLab API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    
    # ===== DETECCIÓN DE DOCKER =====
    IN_DOCKER: bool = is_running_in_docker()
    
    # ===== CONFIGURACIÓN DE BASE DE DATOS =====
    DB_HOST: str = "db" if is_running_in_docker() else "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "medialab_user"
    DB_PASSWORD: str = "MediaLab2025Db$3cur3"
    DB_NAME: str = "medialab_db"
    DB_ROOT_PASSWORD: str = "rootpassword"
    
    # ===== CONFIGURACIÓN DE REDIS =====
    REDIS_HOST: str = "redis" if is_running_in_docker() else "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_DB: int = 0
    REDIS_ENABLED: bool = True
    
    # ===== CONFIGURACIÓN DE PUERTOS =====
    BACKEND_PORT: int = 8000
    FRONTEND_PORT: int = 5173
    
    # ===== CONFIGURACIÓN DE SEGURIDAD MEJORADA =====
    SECRET_KEY: str = "aUgkMhDGJGsS9TTGFinsLhtF69gOq9au1zEaCzGtKKQ"
    
    # 🔥 MEJORADO: Configuración JWT robusta
    ALGORITHM: str = "HS256"
    ALLOWED_ALGORITHMS: List[str] = ["HS256", "HS384", "HS512"]  # Algoritmos permitidos
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # ===== JWT SECURITY MEJORADO =====
    JWT_ISSUER: str = "medialab-api-dev"
    JWT_AUDIENCE: str = "medialab-users-dev"
    
    # 🔥 NUEVO: Configuración de encriptación JWE
    ENABLE_JWE_ENCRYPTION: bool = True  # Habilitar encriptación JWE por defecto
    
    # ===== CONFIGURACIÓN DE TOKENS =====
    TOKEN_BLACKLIST_ENABLED: bool = True
    
    # ===== CONFIGURACIÓN DE RATE LIMITING =====
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_STORAGE: str = "redis"  # redis o memory
    RATE_LIMIT_LOGIN_ATTEMPTS: int = 10
    RATE_LIMIT_LOGIN_WINDOW: int = 300
    RATE_LIMIT_GENERAL: int = 100
    RATE_LIMIT_GENERAL_WINDOW: int = 60
    
    # ===== CONFIGURACIÓN DE CACHE =====
    CACHE_ENABLED: bool = True
    CACHE_DEFAULT_TTL: int = 300  # 5 minutos
    
    # ===== CONFIGURACIÓN DE ENCRIPTACIÓN =====
    ENCRYPTION_KEY: str = "T7gh8kJIaAovp-g7HtKd_qXAkVRY3FQ146VZG18-EUw="
    PASSWORD_SALT: str = "MediaLab2025$8f4a992ee46ca4bf$Secure"
    
    # ===== CONFIGURACIÓN DE SEGURIDAD Y HEADERS =====
    SECURITY_HEADERS_ENABLED: bool = True
    SESSION_SECURE_COOKIES: bool = False  # True en producción
    SESSION_HTTPONLY_COOKIES: bool = True
    SESSION_SAMESITE: str = "lax"
    
    # ===== CONFIGURACIÓN DE COOKIES =====
    COOKIE_SECURE: bool = False  # True en producción
    COOKIE_SAMESITE: str = "lax"
    COOKIE_DOMAIN: Optional[str] = None
    
    # ===== CONFIGURACIÓN DE CORS =====
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"

    CORS_CREDENTIALS: bool = True
    
    # ===== CONFIGURACIÓN DE EMAIL =====
    EMAIL_ENABLED: bool = True
    SMTP_HOST: str = "smtp.hostinger.com"
    SMTP_PORT: int = 465
    SMTP_TLS: bool = True
    SMTP_USER: str = "medialab@byblnk.com"
    SMTP_PASSWORD: str = "V0rt3x2025*"
    EMAILS_FROM_EMAIL: str = "medialab@byblnk.com"
    EMAILS_FROM_NAME: str = "MediaLab Sistema"
    
    # ===== CONFIGURACIÓN DE FRONTEND =====
    VITE_API_URL: str = "http://localhost:8000/api/v1"
    VITE_FRONTEND_URL: str = "http://localhost:5173"
    FRONTEND_URL: str = "http://localhost:5173"
    
    # ===== CONFIGURACIÓN DE INICIALIZACIÓN =====
    INIT_BASE_STRUCTURE: bool = True
    INIT_DEPARTMENT_DATA: bool = True
    INIT_SERVICE_DATA: bool = True
    INIT_PERMISSIONS: bool = True
    INIT_EMAIL_TEMPLATES: bool = True
    INTERACTIVE_ADMIN: bool = False
    START_SERVER: bool = True
    
    # ===== CONFIGURACIÓN DE DOCKER COMPOSE =====
    COMPOSE_PROFILES: str = "dev"
    BACKEND_VOLUME_SOURCE: str = "./backend"
    
    @property
    def CORS_ORIGINS_LIST(self) -> List[str]:
        """Convierte CORS_ORIGINS string a lista"""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(',')]
        return self.CORS_ORIGINS if isinstance(self.CORS_ORIGINS, list) else []
    
    @property
    def DATABASE_URL(self) -> str:
        """Construye la URL de la base de datos"""
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    @property
    def REDIS_URL(self) -> str:
        """Construye la URL de Redis"""
        auth = f":{self.REDIS_PASSWORD}@" if self.REDIS_PASSWORD else ""
        return f"redis://{auth}{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
    
    # 🔥 NUEVO: Métodos de configuración mejorados
    def get_jwt_config(self) -> dict:
        """Obtiene configuración completa de JWT"""
        return {
            "algorithm": self.ALGORITHM,
            "allowed_algorithms": self.ALLOWED_ALGORITHMS,
            "issuer": self.JWT_ISSUER,
            "audience": self.JWT_AUDIENCE,
            "secret_key": self.SECRET_KEY,
            "access_token_expire_minutes": self.ACCESS_TOKEN_EXPIRE_MINUTES,
            "refresh_token_expire_days": self.REFRESH_TOKEN_EXPIRE_DAYS,
            "enable_jwe": self.ENABLE_JWE_ENCRYPTION
        }
    
    def get_security_config(self) -> dict:
        """Obtiene configuración completa de seguridad"""
        return {
            "password_salt": self.PASSWORD_SALT,
            "token_blacklist_enabled": self.TOKEN_BLACKLIST_ENABLED,
            "rate_limit_enabled": self.RATE_LIMIT_ENABLED,
            "rate_limit_storage": self.RATE_LIMIT_STORAGE,
            "security_headers_enabled": self.SECURITY_HEADERS_ENABLED,
            "cors_enabled": True,
            "cors_origins": self.CORS_ORIGINS_LIST,
            "cookie_secure": self.COOKIE_SECURE,
            "cookie_samesite": self.COOKIE_SAMESITE,
            "enable_jwe": self.ENABLE_JWE_ENCRYPTION
        }
    
    def is_production(self) -> bool:
        """Verifica si estamos en producción"""
        return self.ENVIRONMENT.lower() == "production"
    
    def is_development(self) -> bool:
        """Verifica si estamos en desarrollo"""
        return self.ENVIRONMENT.lower() == "development"
    
    def model_post_init(self, __context) -> None:
        """Post-inicialización para logging de debug y validaciones"""
        if self.DEBUG:
            print("=" * 50)
            print("🔧 CONFIGURACIÓN DE DEBUG - MEDIALAB")
            print("=" * 50)
            print(f"📦 Ejecutándose en Docker: {self.IN_DOCKER}")
            print(f"🌍 Entorno: {self.ENVIRONMENT}")
            print(f"🗄️  DB_HOST: {self.DB_HOST}")
            print(f"🗄️  DATABASE_URL: {self.DATABASE_URL}")
            print(f"🔴 REDIS_HOST: {self.REDIS_HOST}")
            print(f"🔴 REDIS_URL: {self.REDIS_URL}")
            print(f"🔴 REDIS_ENABLED: {self.REDIS_ENABLED}")
            print(f"📧 EMAIL_ENABLED: {self.EMAIL_ENABLED}")
            print(f"🛡️  RATE_LIMIT_ENABLED: {self.RATE_LIMIT_ENABLED}")
            print(f"💾 CACHE_ENABLED: {self.CACHE_ENABLED}")
            print(f"🔑 TOKEN_BLACKLIST_ENABLED: {self.TOKEN_BLACKLIST_ENABLED}")
            print(f"🔐 JWE_ENCRYPTION: {self.ENABLE_JWE_ENCRYPTION}")
            print(f"🎯 JWT_ALGORITHM: {self.ALGORITHM}")
            print(f"🌐 CORS_ORIGINS: {self.CORS_ORIGINS_LIST}")
            print("=" * 50)
        
        # 🔥 NUEVAS VALIDACIONES DE SEGURIDAD
        self._validate_security_config()
    
    def _validate_security_config(self) -> None:
        """🔥 NUEVO: Validaciones de seguridad mejoradas"""
        warnings = []
        errors = []
        
        # Validar SECRET_KEY
        if self.SECRET_KEY == "aUgkMhDGJGsS9TTGFinsLhtF69gOq9au1zEaCzGtKKQ":
            if self.is_production():
                errors.append("SECRET_KEY debe cambiarse en producción!")
            else:
                warnings.append("SECRET_KEY usando valor por defecto (OK en desarrollo)")
        
        # Validar algoritmo JWT
        if self.ALGORITHM not in self.ALLOWED_ALGORITHMS:
            errors.append(f"ALGORITHM '{self.ALGORITHM}' no está en ALLOWED_ALGORITHMS")
        
        # Validar cookies en producción
        if self.is_production():
            if not self.COOKIE_SECURE:
                warnings.append("COOKIE_SECURE debería ser True en producción!")
            if "localhost" in str(self.CORS_ORIGINS):
                warnings.append("CORS_ORIGINS contiene localhost en producción")
        
        # Validar Redis
        if self.REDIS_ENABLED and not self.REDIS_HOST:
            errors.append("REDIS_HOST requerido cuando REDIS_ENABLED=true")
        
        # Log de validaciones
        if errors:
            for error in errors:
                print(f"❌ ERROR: {error}")
            if self.is_production():
                raise ValueError(f"Errores críticos en producción: {'; '.join(errors)}")
        
        if warnings:
            for warning in warnings:
                print(f"⚠️  ADVERTENCIA: {warning}")
    
    class Config:
        # Buscar archivos .env en orden de prioridad
        env_file = None
        case_sensitive = True
        
        def __init__(self):
            # Buscar archivos .env en orden de prioridad
            env_files = [".env.dev", ".env", ".env.local"]
            for env_file in env_files:
                if os.path.exists(env_file):
                    self.env_file = env_file
                    if os.getenv("DEBUG") == "true":
                        print(f"📄 Cargando configuración desde: {env_file}")
                    break
            else:
                if os.getenv("DEBUG") == "true":
                    print("📄 No se encontró archivo .env, usando variables de entorno del sistema")

# Instancia global de configuración
settings = Settings()

# ===== VARIABLES EXPORTADAS PARA COMPATIBILIDAD =====
# General
PROJECT_NAME = settings.PROJECT_NAME
VERSION = settings.VERSION
ENVIRONMENT = settings.ENVIRONMENT
DEBUG = settings.DEBUG

# Base de datos
DB_HOST = settings.DB_HOST
DB_PORT = settings.DB_PORT
DB_USER = settings.DB_USER
DB_PASSWORD = settings.DB_PASSWORD
DB_NAME = settings.DB_NAME
DB_ROOT_PASSWORD = settings.DB_ROOT_PASSWORD
DATABASE_URL = settings.DATABASE_URL

# Redis
REDIS_HOST = settings.REDIS_HOST
REDIS_PORT = settings.REDIS_PORT
REDIS_PASSWORD = settings.REDIS_PASSWORD
REDIS_DB = settings.REDIS_DB
REDIS_ENABLED = settings.REDIS_ENABLED
REDIS_URL = settings.REDIS_URL

# Puertos
BACKEND_PORT = settings.BACKEND_PORT
FRONTEND_PORT = settings.FRONTEND_PORT

# Seguridad mejorada
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ALLOWED_ALGORITHMS = settings.ALLOWED_ALGORITHMS  # 🔥 NUEVO
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = settings.REFRESH_TOKEN_EXPIRE_DAYS

# JWT mejorado
JWT_ISSUER = settings.JWT_ISSUER
JWT_AUDIENCE = settings.JWT_AUDIENCE
ENABLE_JWE_ENCRYPTION = settings.ENABLE_JWE_ENCRYPTION  # 🔥 NUEVO

# Tokens
TOKEN_BLACKLIST_ENABLED = settings.TOKEN_BLACKLIST_ENABLED

# Rate limiting
RATE_LIMIT_ENABLED = settings.RATE_LIMIT_ENABLED
RATE_LIMIT_STORAGE = settings.RATE_LIMIT_STORAGE
RATE_LIMIT_LOGIN_ATTEMPTS = settings.RATE_LIMIT_LOGIN_ATTEMPTS
RATE_LIMIT_LOGIN_WINDOW = settings.RATE_LIMIT_LOGIN_WINDOW
RATE_LIMIT_GENERAL = settings.RATE_LIMIT_GENERAL
RATE_LIMIT_GENERAL_WINDOW = settings.RATE_LIMIT_GENERAL_WINDOW

# Cache
CACHE_ENABLED = settings.CACHE_ENABLED
CACHE_DEFAULT_TTL = settings.CACHE_DEFAULT_TTL

# Encriptación
ENCRYPTION_KEY = settings.ENCRYPTION_KEY
PASSWORD_SALT = settings.PASSWORD_SALT

# Headers y seguridad
SECURITY_HEADERS_ENABLED = settings.SECURITY_HEADERS_ENABLED
SESSION_SECURE_COOKIES = settings.SESSION_SECURE_COOKIES
SESSION_HTTPONLY_COOKIES = settings.SESSION_HTTPONLY_COOKIES
SESSION_SAMESITE = settings.SESSION_SAMESITE

# Cookies
COOKIE_SECURE = settings.COOKIE_SECURE
COOKIE_SAMESITE = settings.COOKIE_SAMESITE
COOKIE_DOMAIN = settings.COOKIE_DOMAIN

# CORS
CORS_ORIGINS = settings.CORS_ORIGINS_LIST  # Usar la lista procesada
CORS_CREDENTIALS = settings.CORS_CREDENTIALS

# Email
EMAIL_ENABLED = settings.EMAIL_ENABLED
SMTP_HOST = settings.SMTP_HOST
SMTP_PORT = settings.SMTP_PORT
SMTP_TLS = settings.SMTP_TLS
SMTP_USER = settings.SMTP_USER
SMTP_PASSWORD = settings.SMTP_PASSWORD
EMAILS_FROM_EMAIL = settings.EMAILS_FROM_EMAIL
EMAILS_FROM_NAME = settings.EMAILS_FROM_NAME

# Frontend
VITE_API_URL = settings.VITE_API_URL
VITE_FRONTEND_URL = settings.VITE_FRONTEND_URL
FRONTEND_URL = settings.FRONTEND_URL

# Inicialización
INIT_BASE_STRUCTURE = settings.INIT_BASE_STRUCTURE
INIT_DEPARTMENT_DATA = settings.INIT_DEPARTMENT_DATA
INIT_SERVICE_DATA = settings.INIT_SERVICE_DATA
INIT_PERMISSIONS = settings.INIT_PERMISSIONS
INIT_EMAIL_TEMPLATES = settings.INIT_EMAIL_TEMPLATES
INTERACTIVE_ADMIN = settings.INTERACTIVE_ADMIN
START_SERVER = settings.START_SERVER

# Docker Compose
COMPOSE_PROFILES = settings.COMPOSE_PROFILES
BACKEND_VOLUME_SOURCE = settings.BACKEND_VOLUME_SOURCE

# ===== CONFIGURACIONES DERIVADAS =====
# Determinar si estamos en producción
IS_PRODUCTION = ENVIRONMENT == "production"
IS_DEVELOPMENT = ENVIRONMENT == "development"
IS_TESTING = ENVIRONMENT == "testing"

# API Configuration
API_V1_PREFIX = "/api/v1"
API_TITLE = f"{PROJECT_NAME} - API Documentation"
API_DESCRIPTION = "API para el sistema MediaLab de gestión de proyectos y servicios"

# Configuración de logging
LOG_LEVEL = "DEBUG" if DEBUG else "INFO"

# 🔥 NUEVAS FUNCIONES DE VALIDACIÓN
def validate_jwt_config() -> bool:
    """Valida la configuración JWT"""
    try:
        if ALGORITHM not in ALLOWED_ALGORITHMS:
            raise ValueError(f"Algoritmo {ALGORITHM} no permitido")
        
        if len(SECRET_KEY) < 32:
            raise ValueError("SECRET_KEY muy corta")
        
        if ACCESS_TOKEN_EXPIRE_MINUTES < 5:
            raise ValueError("ACCESS_TOKEN_EXPIRE_MINUTES muy bajo")
        
        return True
    except Exception as e:
        print(f"❌ Error en configuración JWT: {e}")
        return False

def get_security_summary() -> dict:
    """Obtiene resumen de configuración de seguridad"""
    return {
        "environment": ENVIRONMENT,
        "jwt_algorithm": ALGORITHM,
        "jwe_encryption": ENABLE_JWE_ENCRYPTION,
        "token_blacklist": TOKEN_BLACKLIST_ENABLED,
        "rate_limiting": RATE_LIMIT_ENABLED,
        "redis_enabled": REDIS_ENABLED,
        "secure_cookies": COOKIE_SECURE,
        "cors_configured": len(CORS_ORIGINS) > 0,
        "email_enabled": EMAIL_ENABLED,
        "debug_mode": DEBUG
    }

# 🔥 NUEVA FUNCIÓN DE DIAGNÓSTICO COMPLETO
def run_configuration_diagnostics() -> dict:
    """Ejecuta diagnósticos completos de configuración"""
    diagnostics = {
        "timestamp": None,
        "environment": ENVIRONMENT,
        "status": "unknown",
        "checks": {},
        "warnings": [],
        "errors": [],
        "recommendations": []
    }
    
    try:
        from datetime import datetime
        diagnostics["timestamp"] = datetime.utcnow().isoformat()
        
        # Check 1: JWT Configuration
        diagnostics["checks"]["jwt_valid"] = validate_jwt_config()
        
        # Check 2: Database connectivity (if possible)
        try:
            import sqlalchemy
            engine = sqlalchemy.create_engine(DATABASE_URL)
            with engine.connect() as conn:
                conn.execute(sqlalchemy.text("SELECT 1"))
            diagnostics["checks"]["database_connection"] = True
        except Exception as e:
            diagnostics["checks"]["database_connection"] = False
            diagnostics["warnings"].append(f"Database connection failed: {str(e)}")
        
        # Check 3: Redis connectivity (if enabled)
        if REDIS_ENABLED:
            try:
                import redis
                r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PASSWORD, db=REDIS_DB)
                r.ping()
                diagnostics["checks"]["redis_connection"] = True
            except Exception as e:
                diagnostics["checks"]["redis_connection"] = False
                diagnostics["warnings"].append(f"Redis connection failed: {str(e)}")
        else:
            diagnostics["checks"]["redis_connection"] = "disabled"
        
        # Check 4: Security configurations
        security_issues = []
        if IS_PRODUCTION and SECRET_KEY == "aUgkMhDGJGsS9TTGFinsLhtF69gOq9au1zEaCzGtKKQ":
            security_issues.append("Default SECRET_KEY in production")
        
        if IS_PRODUCTION and not COOKIE_SECURE:
            security_issues.append("Insecure cookies in production")
        
        if security_issues:
            diagnostics["errors"].extend(security_issues)
            diagnostics["checks"]["security_config"] = False
        else:
            diagnostics["checks"]["security_config"] = True
        
        # Determine overall status
        has_errors = len(diagnostics["errors"]) > 0
        has_critical_failures = not diagnostics["checks"]["jwt_valid"]
        
        if has_errors or has_critical_failures:
            diagnostics["status"] = "error"
        elif len(diagnostics["warnings"]) > 0:
            diagnostics["status"] = "warning"
        else:
            diagnostics["status"] = "healthy"
        
        # Generate recommendations
        if not diagnostics["checks"]["jwt_valid"]:
            diagnostics["recommendations"].append("Fix JWT configuration issues")
        
        if diagnostics["checks"]["redis_connection"] is False:
            diagnostics["recommendations"].append("Check Redis connection and configuration")
        
        if not diagnostics["checks"]["security_config"]:
            diagnostics["recommendations"].append("Review and fix security configuration for production")
        
        if not diagnostics["recommendations"]:
            diagnostics["recommendations"].append("Configuration looks good!")
        
    except Exception as e:
        diagnostics["status"] = "error"
        diagnostics["errors"].append(f"Diagnostic execution failed: {str(e)}")
    
    return diagnostics

# Diagnóstico final al cargar
if DEBUG:
    print(f"\n🚀 Configuración cargada exitosamente para entorno: {ENVIRONMENT}")
    print(f"📊 Variables principales configuradas: {len([k for k in globals() if k.isupper()])}")
    
    # Mostrar características de seguridad
    security_summary = get_security_summary()
    print(f"🔐 Características de seguridad:")
    for feature, enabled in security_summary.items():
        status = "✅" if enabled else "❌"
        print(f"   {status} {feature}: {enabled}")
    
    if REDIS_ENABLED:
        print(f"🔴 Redis habilitado en: {REDIS_HOST}:{REDIS_PORT}")
    if EMAIL_ENABLED:
        print(f"📧 Email habilitado via: {SMTP_HOST}")
    
    print("✅ Settings.py listo para usar con seguridad mejorada\n")
    
    # Ejecutar diagnósticos si es necesario
    if os.getenv("RUN_DIAGNOSTICS", "").lower() == "true":
        print("🔍 Ejecutando diagnósticos de configuración...")
        diag_results = run_configuration_diagnostics()
        print(f"📋 Estado: {diag_results['status'].upper()}")
        if diag_results['errors']:
            print("❌ Errores encontrados:")
            for error in diag_results['errors']:
                print(f"   - {error}")
        if diag_results['warnings']:
            print("⚠️  Advertencias:")
            for warning in diag_results['warnings']:
                print(f"   - {warning}")
        print()

# 🔥 NUEVA EXPORTACIÓN: Funciones de utilidad
__all__ = [
    # Variables principales
    'settings', 'PROJECT_NAME', 'VERSION', 'ENVIRONMENT', 'DEBUG',
    'SECRET_KEY', 'ALGORITHM', 'ALLOWED_ALGORITHMS', 'JWT_ISSUER', 'JWT_AUDIENCE',
    'DATABASE_URL', 'REDIS_URL', 'CORS_ORIGINS',
    
    # Funciones de utilidad
    'validate_jwt_config', 'get_security_summary', 'run_configuration_diagnostics',
    'is_running_in_docker'
]