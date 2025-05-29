# ===== backend/app/services/users/__init__.py =====
"""
Servicios para gestión de usuarios del sistema
"""

from .user_service import UserService
from .institutional_user_service import InstitutionalUserService

__all__ = [
    "UserService",
    "InstitutionalUserService"
]

__version__ = "1.0.0"
__description__ = "User management services"