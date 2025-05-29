# ============================================================================
# backend/app/repositories/__init__.py
# ============================================================================
"""
Repositorios principales de la aplicación
Exporta todos los repositorios organizados por módulos
"""

# Repositorios de usuarios
from .users.user_repository import UserRepository

# Repositorios de autenticación
from .auth.auth_repository import AuthRepository

# Repositorios de seguridad
from .security.role_repository import RoleRepository

# Repositorios de organización
from .organization.area_repository import AreaRepository
from .organization.service_repository import ServiceRepository
from .organization.department_repository import DepartmentRepository
from .organization.department_type_repository import DepartmentTypeRepository

# Repositorios de comunicación
from .communication.smtp_repository import SmtpRepository

# Repositorios de plantillas
from .templates.email_template_repository import EmailTemplateRepository
from .templates.service_template_repository import ServiceTemplateRepository

# Lista de todos los repositorios disponibles
__all__ = [
    # Usuarios
    'UserRepository',
    
    # Autenticación
    'AuthRepository',
    
    # Seguridad
    'RoleRepository',
    
    # Organización
    'AreaRepository',
    'ServiceRepository',
    'DepartmentRepository',
    'DepartmentTypeRepository',
    
    # Comunicación
    'SmtpRepository',
    
    # Plantillas
    'EmailTemplateRepository',
    'ServiceTemplateRepository'
]