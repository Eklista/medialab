# ===================================================================
# backend/app/utils/user_transforms.py - 🔄 ACTUALIZADO
# ===================================================================
"""
ACTUALIZACIÓN: Mantiene compatibilidad pero delega al nuevo formatter
"""

from app.utils.user_formatters import UserFormatter
from typing import Dict, Any

def transform_user_with_roles(user) -> Dict[str, Any]:
    """
    """
    return UserFormatter.format_with_roles(user)

# Alias para compatibilidad
def format_user_for_response(user, include_roles: bool = True) -> Dict[str, Any]:
    """Alias para migration gradual"""
    if include_roles:
        return UserFormatter.format_with_roles(user)
    else:
        return UserFormatter.format_detailed(user)