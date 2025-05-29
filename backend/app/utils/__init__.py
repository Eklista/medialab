# ============================================================================
# backend/app/utils/__init__.py
# ============================================================================
"""
Utilidades de la aplicación
Funciones auxiliares, helpers y herramientas transversales
"""

# Manejo de errores
from .error_handler import ErrorHandler

# Encriptación y seguridad
from .encryption import encrypt_value, decrypt_value, get_encryption_key

# Sistema de blacklist de tokens (híbrido)
from .token_blacklist import (
    token_blacklist,
    HybridTokenBlacklist,
    redis_token_blacklist_instance
)

# Blacklist de tokens específico para Redis
from .redis_token_blacklist import redis_token_blacklist

# Rate limiting con Redis
from .redis_rate_limiter import redis_rate_limiter, rate_limit

# Rate limiting simple (sin dependencias)
from .simple_rate_limit import check_rate_limit

# Transformaciones de usuarios
from .user_transforms import transform_user_with_roles

__all__ = [
    # Manejo de errores
    "ErrorHandler",
    
    # Encriptación
    "encrypt_value",
    "decrypt_value", 
    "get_encryption_key",
    
    # Token blacklist (sistema híbrido)
    "token_blacklist",
    "HybridTokenBlacklist",
    "redis_token_blacklist_instance",
    "redis_token_blacklist",
    
    # Rate limiting
    "redis_rate_limiter",
    "rate_limit",
    "check_rate_limit",
    
    # Transformaciones
    "transform_user_with_roles"
]

__version__ = "1.0.0"
__description__ = "Application utilities and helpers"