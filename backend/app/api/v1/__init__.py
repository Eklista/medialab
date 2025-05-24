# backend/app/api/v1/__init__.py
from fastapi import APIRouter

from app.api.v1 import (
    users, roles, areas, services, departments, department_types, 
    public, service_templates, permissions, smtp_config, email_templates,
    health  # Endpoint de salud
)
from app.api.v1.auth import auth_router

# Importar router de administración Redis
try:
    from app.api.v1.admin import redis as redis_admin
    REDIS_ADMIN_AVAILABLE = True
except ImportError:
    REDIS_ADMIN_AVAILABLE = False

api_router = APIRouter()

# Incluir endpoint de salud (sin autenticación)
api_router.include_router(health.router, tags=["health"])

# Incluir routers existentes
api_router.include_router(auth_router, prefix="/auth")
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

# Incluir router de administración Redis si está disponible
if REDIS_ADMIN_AVAILABLE:
    api_router.include_router(
        redis_admin.router, 
        prefix="/admin/redis", 
        tags=["admin", "redis"]
    )