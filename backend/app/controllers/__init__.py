# backend/app/controllers/__init__.py
"""
Controladores de la aplicación
Capa intermedia entre APIs y Services
"""

from .auth import LoginController, PasswordController

__all__ = [
    "LoginController",
    "PasswordController"
]

__version__ = "1.0.0"
__description__ = "Application controllers layer"