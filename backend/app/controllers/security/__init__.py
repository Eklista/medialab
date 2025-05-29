# ============================================================================
# backend/app/controllers/security/__init__.py (NUEVO)
# ============================================================================
"""
Controladores de seguridad - roles y permisos
"""

from .role_controller import RoleController

__all__ = [
    "RoleController"
]