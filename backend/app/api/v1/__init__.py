from fastapi import APIRouter

from app.api.v1 import users, roles, areas, services, departments, department_types, public, service_templates, permissions, smtp_config, email_templates
from app.api.v1.auth import auth_router

api_router = APIRouter()

#  Incluir routers
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
