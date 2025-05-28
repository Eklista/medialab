# backend/app/schemas/auth/__init__.py
"""
Schemas de autenticación y seguridad
Exporta todos los schemas necesarios para el módulo AUTH
"""

# Schemas de usuarios
from backend.app.schemas.users.users import *

# Schemas de roles y permisos  
from backend.app.schemas.security.roles import *
from backend.app.schemas.security.permissions import *

# Schemas de tokens
from .token import *

# 🆕 NUEVOS SCHEMAS DE AUTH
# Schemas de login/autenticación
from .login import (
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    LogoutRequest,
    LogoutResponse,
    LogoutAllResponse,
    TokenValidationResponse,
    PasswordVerifyRequest,
    PasswordVerifyResponse
)

# Schemas de gestión de contraseñas
from .password import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    VerifyCodeRequest,
    VerifyCodeResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    PasswordStrengthRequest,
    PasswordStrengthResponse,
    PasswordChangeRequestResponse,
    PasswordPolicyResponse
)

# Schemas de seguridad y monitoreo
from backend.app.schemas.security.security import (
    SecurityStatusResponse,
    SecurityStatsResponse,
    SecurityEvent,
    RateLimitInfo,
    TokenBlacklistInfo,
    UserSecurityInfo,
    SecurityCleanupResponse,
    EmergencyResetResponse
)

# Lista de todos los schemas disponibles para importación externa
__all__ = [
    # Schemas existentes
    "UserCreate", "UserUpdate", "UserInDB", "UserWithRoles",
    "RoleCreate", "RoleUpdate", "RoleInDB", "RoleWithPermissions", 
    "PermissionResponse", "PermissionCategory",
    "Token", "TokenPayload",
    
    # 🆕 Nuevos schemas de login
    "LoginRequest", "LoginResponse",
    "RefreshTokenRequest", "RefreshTokenResponse", 
    "LogoutRequest", "LogoutResponse", "LogoutAllResponse",
    "TokenValidationResponse",
    "PasswordVerifyRequest", "PasswordVerifyResponse",
    
    # 🆕 Nuevos schemas de password
    "ForgotPasswordRequest", "ForgotPasswordResponse",
    "VerifyCodeRequest", "VerifyCodeResponse",
    "ResetPasswordRequest", "ResetPasswordResponse", 
    "ChangePasswordRequest", "ChangePasswordResponse",
    "PasswordStrengthRequest", "PasswordStrengthResponse",
    "PasswordChangeRequestResponse", "PasswordPolicyResponse",
    
    # 🆕 Nuevos schemas de security
    "SecurityStatusResponse", "SecurityStatsResponse",
    "SecurityEvent", "RateLimitInfo", "TokenBlacklistInfo",
    "UserSecurityInfo", "SecurityCleanupResponse", "EmergencyResetResponse"
]