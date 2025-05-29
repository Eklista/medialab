# ============================================================================
# backend/app/schemas/security/__init__.py
# ============================================================================
"""
Schemas de seguridad - roles, permisos y monitoreo
"""

# Schemas de roles
from .roles import (
    RoleBase,
    RoleCreate,
    RoleUpdate,
    RoleInDB,
    RoleWithPermissions
)

# Schemas de permisos
from .permissions import (
    PermissionBase,
    PermissionCreate,
    PermissionUpdate,
    PermissionResponse,
    PermissionCategory,
    PermissionCheck,
    PermissionStats
)

# Schemas de seguridad y monitoreo
from .security import (
    SecurityStatusResponse,
    SecurityStatsResponse,
    SecurityEvent,
    RateLimitInfo,
    TokenBlacklistInfo,
    UserSecurityInfo,
    SecurityCleanupResponse,
    EmergencyResetResponse
)

__all__ = [
    # Roles
    "RoleBase", "RoleCreate", "RoleUpdate", "RoleInDB", "RoleWithPermissions",
    
    # Permisos
    "PermissionBase", "PermissionCreate", "PermissionUpdate", "PermissionResponse",
    "PermissionCategory", "PermissionCheck", "PermissionStats",
    
    # Seguridad
    "SecurityStatusResponse", "SecurityStatsResponse", "SecurityEvent",
    "RateLimitInfo", "TokenBlacklistInfo", "UserSecurityInfo",
    "SecurityCleanupResponse", "EmergencyResetResponse"
]
