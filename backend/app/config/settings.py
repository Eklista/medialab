# backend/app/config/settings.py
import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Configuración de la aplicación"""
    
    # ===== CONFIGURACIÓN GENERAL =====
    PROJECT_NAME: str = "MediaLab API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # ===== CONFIGURACIÓN DE BASE DE DATOS =====
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_USER: str = os.getenv("DB_USER", "medialab_user")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "MediaLab2025Db$3cur3")
    DB_NAME: str = os.getenv("DB_NAME", "medialab_db")
    
    # ===== CONFIGURACIÓN DE REDIS =====
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_PASSWORD: Optional[str] = os.getenv("REDIS_PASSWORD", None)
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))
    REDIS_ENABLED: bool = os.getenv("REDIS_ENABLED", "true").lower() == "true"
    
    # ===== CONFIGURACIÓN DE SEGURIDAD =====
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-here-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # ===== CONFIGURACIÓN DE COOKIES =====
    COOKIE_SECURE: bool = ENVIRONMENT == "production"
    COOKIE_SAMESITE: str = "lax" if ENVIRONMENT == "development" else "strict"
    COOKIE_DOMAIN: Optional[str] = None if ENVIRONMENT == "development" else os.getenv("COOKIE_DOMAIN")
    
    # ===== CONFIGURACIÓN DE TOKENS =====
    TOKEN_BLACKLIST_ENABLED: bool = os.getenv("TOKEN_BLACKLIST_ENABLED", "true").lower() == "true"
    
    # ===== CONFIGURACIÓN DE RATE LIMITING =====
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
    RATE_LIMIT_STORAGE: str = os.getenv("RATE_LIMIT_STORAGE", "redis")  # redis o memory
    
    # ===== CONFIGURACIÓN DE CACHE =====
    CACHE_ENABLED: bool = os.getenv("CACHE_ENABLED", "true").lower() == "true"
    CACHE_DEFAULT_TTL: int = int(os.getenv("CACHE_DEFAULT_TTL", "300"))  # 5 minutos
    
    # ===== CONFIGURACIÓN DE EMAIL =====
    EMAIL_ENABLED: bool = os.getenv("EMAIL_ENABLED", "true").lower() == "true"
    
    @property
    def DATABASE_URL(self) -> str:
        """Construye la URL de la base de datos"""
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    @property
    def REDIS_URL(self) -> str:
        """Construye la URL de Redis"""
        auth = f":{self.REDIS_PASSWORD}@" if self.REDIS_PASSWORD else ""
        return f"redis://{auth}{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Instancia global de configuración
settings = Settings()

# Variables exportadas para compatibilidad
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
DATABASE_URL = settings.DATABASE_URL

# Redis
REDIS_HOST = settings.REDIS_HOST
REDIS_PORT = settings.REDIS_PORT
REDIS_PASSWORD = settings.REDIS_PASSWORD
REDIS_DB = settings.REDIS_DB
REDIS_ENABLED = settings.REDIS_ENABLED
REDIS_URL = settings.REDIS_URL

# Seguridad
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = settings.REFRESH_TOKEN_EXPIRE_DAYS

# Cookies
COOKIE_SECURE = settings.COOKIE_SECURE
COOKIE_SAMESITE = settings.COOKIE_SAMESITE
COOKIE_DOMAIN = settings.COOKIE_DOMAIN

# Tokens
TOKEN_BLACKLIST_ENABLED = settings.TOKEN_BLACKLIST_ENABLED

# Rate limiting
RATE_LIMIT_ENABLED = settings.RATE_LIMIT_ENABLED
RATE_LIMIT_STORAGE = settings.RATE_LIMIT_STORAGE

# Cache
CACHE_ENABLED = settings.CACHE_ENABLED
CACHE_DEFAULT_TTL = settings.CACHE_DEFAULT_TTL

# Email
EMAIL_ENABLED = settings.EMAIL_ENABLED