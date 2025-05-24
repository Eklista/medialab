# backend/app/api/v1/auth/__init__.py
from fastapi import APIRouter

from app.api.v1.auth import login, password

# Crear el router principal de autenticación
auth_router = APIRouter()

# Incluir todos los subrouters
auth_router.include_router(
    login.router, 
    tags=["authentication"], 
    prefix="",  # Sin prefijo adicional ya que viene de /auth
)

auth_router.include_router(
    password.router, 
    tags=["password-management"], 
    prefix="",  # Sin prefijo adicional ya que viene de /auth
)

# Opcional: agregar metadatos del módulo
__version__ = "2.0.0"
__description__ = "Authentication API with hybrid token blacklist and robust security"

# Lista de todos los endpoints disponibles
AVAILABLE_ENDPOINTS = [
    # Authentication endpoints
    "POST /login - Iniciar sesión con cookies httpOnly",
    "POST /refresh - Renovar access token",
    "POST /logout - Cerrar sesión actual",
    "POST /logout-all - Cerrar todas las sesiones",
    "GET /me - Información del usuario actual",
    "POST /validate-token - Validar token actual",
    "POST /verify-password - Verificar contraseña actual",
    "GET /security/status - Estado de seguridad del sistema",
    
    # Password management endpoints
    "POST /forgot-password - Solicitar código de recuperación",
    "POST /verify-code - Verificar código de recuperación",
    "POST /reset-password - Restablecer contraseña con código",
    "POST /change-password - Cambiar contraseña (autenticado)",
    "POST /check-password-strength - Evaluar fortaleza de contraseña",
    "POST /request-password-change - Solicitar cambio de contraseña",
    "GET /password-policy - Obtener política de contraseñas"
]

# Configuración de seguridad aplicada
SECURITY_FEATURES = [
    "httpOnly Cookies - Tokens no accesibles desde JavaScript",
    "Hybrid Token Blacklist - Redis + MySQL para máxima confiabilidad",
    "Rate Limiting - Protección contra ataques de fuerza bruta",
    "JWE Encryption - Tokens encriptados para mayor seguridad",
    "Robust JTI Extraction - Manejo inteligente de tokens problemáticos",
    "Password Strength Validation - Políticas de contraseña segura",
    "Session Management - Control completo de sesiones",
    "Failed Attempt Tracking - Monitoreo de intentos fallidos",
    "Global User Invalidation - Capacidad de invalidar todas las sesiones",
    "Automatic Cleanup - Limpieza automática de datos expirados"
]