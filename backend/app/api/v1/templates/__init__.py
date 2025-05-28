# ===== templates/__init__.py =====
from fastapi import APIRouter
from app.api.v1.templates import email_templates, service_templates

templates_router = APIRouter()
templates_router.include_router(email_templates.router, prefix="/email-templates", tags=["email-templates"])
templates_router.include_router(service_templates.router, prefix="/service-templates", tags=["service-templates"])