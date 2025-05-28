# backend/app/controllers/auth/__init__.py
"""
Controladores de autenticación
Lógica de control pura, independiente de FastAPI
"""

from .login_controller import LoginController
from .password_controller import PasswordController

__all__ = [
    "LoginController",
    "PasswordController"
]