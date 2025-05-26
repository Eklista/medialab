# backend/app/api/v1/__init__.py
from fastapi import APIRouter
from app.api.v1 import (
    users, roles, areas, services, departments, department_types,
    public, service_templates, permissions, smtp_config, email_templates,
    health
)
from app.api.v1.auth import auth_router

# Importar router de administración completo
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

# Incluir endpoint de salud (sin autenticación)
api_router.include_router(health.router, tags=["health"])

# Incluir sistema de autenticación mejorado
api_router.include_router(auth_router, prefix="/auth")

# Incluir routers existentes de la aplicación
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(areas.router, prefix="/areas", tags=["areas"])
api_router.include_router(services.router, prefix="/services", tags=["services"])
api_router.include_router(departments.router, prefix="/departments", tags=["departments"])
api_router.include_router(department_types.router, prefix="/department-types", tags=["department_types"])
api_router.include_router(service_templates.router, prefix="/service-templates", tags=["service_templates"])
api_router.include_router(permissions.router, prefix="/permissions", tags=["permissions"])
api_router.include_router(public.router, prefix="/public", tags=["public"])
api_router.include_router(smtp_config.router, prefix="/smtp-config", tags=["smtp_config"])
api_router.include_router(email_templates.router, prefix="/email-templates", tags=["email_templates"])

# Incluir router de administración completo si está disponible
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

# Información del API
API_VERSION = "1.0.0"
API_DESCRIPTION = "MediaLab API - Sistema completo de gestión con autenticación segura"

# Lista de todos los módulos incluidos
INCLUDED_MODULES = [
    "health", "auth", "users", "roles", "areas", "services", 
    "departments", "department_types", "service_templates", 
    "permissions", "public", "smtp_config", "email_templates"
]

if ADMIN_AVAILABLE:
    INCLUDED_MODULES.append("admin (completo)")
elif REDIS_ADMIN_AVAILABLE:
    INCLUDED_MODULES.append("admin (solo Redis)")

# Endpoint para obtener información del API
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
            "services": "Gestión de servicios y proyectos",
            "departments": "Gestión de departamentos",
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

# Endpoint para diagnósticos rápidos
@api_router.get("/diagnostics", tags=["api-info"])
def get_api_diagnostics():
    """
    Diagnósticos rápidos del estado del API
    """
    diagnostics = {
        "timestamp": None,
        "api_status": "operational",
        "modules_loaded": len(INCLUDED_MODULES),
        "admin_available": ADMIN_AVAILABLE,
        "redis_admin_available": REDIS_ADMIN_AVAILABLE,
        "security_status": "enhanced"
    }
    
    # Agregar timestamp
    from datetime import datetime
    diagnostics["timestamp"] = datetime.utcnow().isoformat()
    
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