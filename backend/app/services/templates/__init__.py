# ===== backend/app/services/templates/__init__.py =====
"""
Servicios para gestión de plantillas del sistema
"""

from .service_template_service import ServiceTemplateService
from .email_template_service import EmailTemplateService

__all__ = [
    "ServiceTemplateService",
    "EmailTemplateService"
]

__version__ = "1.0.0"
__description__ = "Template management services"
