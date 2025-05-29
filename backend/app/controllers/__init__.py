# ============================================================================
# backend/app/controllers/__init__.py
# ============================================================================
"""
Controladores de la aplicación
Capa intermedia entre APIs y Services
"""

# Controladores de autenticación
from .auth import LoginController, PasswordController

# Controladores de usuarios
from .users.user_controller import UserController

# Controladores de organización
from .organization.area_controller import AreaController

# Controladores de seguridad
from .security.role_controller import RoleController

# Controladores de plantillas
from .templates.service_template_controller import ServiceTemplateController

__all__ = [
    # Auth
    "LoginController",
    "PasswordController",
    
    # Users
    "UserController",
    
    # Organization
    "AreaController",
    
    # Security
    "RoleController",
    
    # Templates
    "ServiceTemplateController"
]

__version__ = "1.0.0"
__description__ = "Application controllers layer"