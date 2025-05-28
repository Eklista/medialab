# backend/app/api/v1/__init__.py
from fastapi import APIRouter
from datetime import datetime

# ✅ IMPORTAR DESDE MÓDULOS ORGANIZADOS
from app.api.v1.auth import auth_router
from app.api.v1.users import users_router
from app.api.v1.organization import organization_router
from app.api.v1.security import security_router
from app.api.v1.templates import templates_router
from app.api.v1.communication import communication_router
from app.api.v1.system import system_router

# Importar router de administración completo (sin cambios)
try:
    from app.api.v1.admin import admin_router
    ADMIN_AVAILABLE = True
except ImportError as e:
    ADMIN_AVAILABLE = False
    print(f"⚠️  Módulo admin no disponible: {e}")

# También mantener compatibilidad con la importación directa de Redis
try:
    from app.api.v1.admin import redis as redis_admin
    REDIS_ADMIN_AVAILABLE = True
except ImportError:
    REDIS_ADMIN_AVAILABLE = False

api_router = APIRouter()

# ✅ SISTEMA - health sin prefijo (mantiene /health)
api_router.include_router(system_router)

# ✅ AUTH - mantiene /auth/*
api_router.include_router(auth_router, prefix="/auth")

# ✅ USERS - mantiene /users/*
api_router.include_router(users_router, prefix="/users", tags=["users"])

# ✅ ORGANIZATION - SIN PREFIJO ADICIONAL para mantener URLs originales
# Esto mantiene: /areas/, /departments/, /department-types/, /services/
api_router.include_router(organization_router)

# ✅ SECURITY - SIN PREFIJO ADICIONAL para mantener URLs originales  
# Esto mantiene: /roles/, /permissions/
api_router.include_router(security_router)

# ✅ TEMPLATES - SIN PREFIJO ADICIONAL para mantener URLs originales
# Esto mantiene: /service-templates/, /email-templates/
api_router.include_router(templates_router)

# ✅ COMMUNICATION - SIN PREFIJO ADICIONAL para mantener URLs originales
# Esto mantiene: /smtp-config/
api_router.include_router(communication_router)

# Incluir router de administración completo si está disponible (sin cambios)
if ADMIN_AVAILABLE:
    api_router.include_router(
        admin_router,
        prefix="/admin",
        tags=["administration"]
    )
    print("✅ Módulo de administración cargado exitosamente")
elif REDIS_ADMIN_AVAILABLE:
    # Fallback: cargar solo Redis admin si el módulo completo no está disponible
    api_router.include_router(
        redis_admin.router,
        prefix="/admin/redis",
        tags=["admin", "redis"]
    )
    print("✅ Redis admin cargado como fallback")
else:
    print("⚠️  No hay módulos de administración disponibles")

# Información del API (actualizada)
API_VERSION = "1.0.0"
API_DESCRIPTION = "MediaLab API - Sistema modular con autenticación segura"

# Lista de todos los módulos incluidos (actualizada)
INCLUDED_MODULES = [
    "health", "auth", "users", "organization", "security", 
    "templates", "communication"
]

if ADMIN_AVAILABLE:
    INCLUDED_MODULES.append("admin (completo)")
elif REDIS_ADMIN_AVAILABLE:
    INCLUDED_MODULES.append("admin (solo Redis)")

# Endpoint para obtener información del API (mejorado)
@api_router.get("/", tags=["api-info"])
def get_api_info():
    """
    Información general del API MediaLab
    """
    admin_status = "No disponible"
    if ADMIN_AVAILABLE:
        try:
            from app.api.v1.admin import get_admin_status
            admin_status = get_admin_status()
        except ImportError:
            admin_status = "Módulo admin cargado pero sin estado detallado"
    elif REDIS_ADMIN_AVAILABLE:
        admin_status = "Solo Redis admin disponible"
    
    return {
        "api": "MediaLab API",
        "version": API_VERSION,
        "description": API_DESCRIPTION,
        "status": "operational",
        "modules": {
            "total": len(INCLUDED_MODULES),
            "list": INCLUDED_MODULES
        },
        "admin": admin_status,
        "endpoints": {
            "auth": "Autenticación con cookies httpOnly y sistema híbrido de blacklist",
            "users": "Gestión de usuarios del sistema",
            "areas": "Gestión de áreas organizacionales",
            "departments": "Gestión de departamentos y tipos",
            "services": "Gestión de servicios y proyectos",
            "roles": "Gestión de roles del sistema",
            "permissions": "Gestión de permisos",
            "service-templates": "Plantillas de servicios",
            "email-templates": "Plantillas de correo electrónico",
            "smtp-config": "Configuración SMTP",
            "public": "Endpoints públicos",
            "admin": "Administración avanzada del sistema (si está disponible)",
            "health": "Monitoreo de salud del sistema"
        },
        "security_features": [
            "httpOnly Cookies",
            "Hybrid Token Blacklist (Redis + MySQL)",
            "Rate Limiting",
            "JWE Token Encryption",
            "Password Strength Validation",
            "Failed Attempt Tracking",
            "Session Management",
            "CORS Protection"
        ]
    }

# Endpoint para diagnósticos rápidos (sin cambios)
@api_router.get("/diagnostics", tags=["api-info"])
def get_api_diagnostics():
    """
    Diagnósticos rápidos del estado del API
    """
    diagnostics = {
        "timestamp": datetime.utcnow().isoformat(),
        "api_status": "operational",
        "modules_loaded": len(INCLUDED_MODULES),
        "admin_available": ADMIN_AVAILABLE,
        "redis_admin_available": REDIS_ADMIN_AVAILABLE,
        "security_status": "enhanced"
    }
    
    # Verificar configuración de seguridad
    try:
        from app.config.settings import (
            TOKEN_BLACKLIST_ENABLED, RATE_LIMIT_ENABLED, 
            REDIS_ENABLED, ENVIRONMENT
        )
        diagnostics["security_config"] = {
            "token_blacklist": TOKEN_BLACKLIST_ENABLED,
            "rate_limiting": RATE_LIMIT_ENABLED,
            "redis_enabled": REDIS_ENABLED,
            "environment": ENVIRONMENT
        }
    except ImportError:
        diagnostics["security_config"] = "No disponible"
    
    return diagnostics

print(f"🚀 MediaLab API v{API_VERSION} inicializado con {len(INCLUDED_MODULES)} módulos")