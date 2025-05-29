# ============================================================================
# backend/app/repositories/templates/__init__.py
# ============================================================================
"""
Repositorios de plantillas - email y servicios
"""

# Repositorios de plantillas de email
from .email_template_repository import EmailTemplateRepository

# Repositorios de plantillas de servicios
from .service_template_repository import ServiceTemplateRepository

__all__ = [
    'EmailTemplateRepository',
    'ServiceTemplateRepository'
]