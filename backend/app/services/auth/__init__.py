# backend/app/services/auth/__init__.py
"""
Servicios especializados de autenticación y seguridad
Arquitectura modular que separa responsabilidades
"""

from .password_service import PasswordService
from .token_service import TokenService
from .security_service import SecurityService

# Exportar todos los services para fácil importación
__all__ = [
    "PasswordService",
    "TokenService", 
    "SecurityService"
]

# Información del módulo
__version__ = "2.0.0"
__description__ = "Modular authentication and security services"

# Lista de funcionalidades principales
FEATURES = [
    "Password management with strength validation",
    "Secure token creation and verification", 
    "Comprehensive security monitoring",
    "Rate limiting integration",
    "Hybrid token blacklist system",
    "Emergency security operations",
    "Audit logging and anomaly detection"
]