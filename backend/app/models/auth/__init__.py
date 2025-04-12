# app/models/auth/__init__.py

# Primero importamos las tablas de asociación
from app.models.associations import user_roles, role_permissions

# Luego importamos los modelos
from app.models.auth.users import User
from app.models.auth.roles import Role
from app.models.auth.permissions import Permission

# Aseguramos que todos los modelos estén disponibles al importar este paquete
__all__ = ['User', 'Role', 'Permission']