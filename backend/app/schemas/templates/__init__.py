# ============================================================================
# backend/app/schemas/templates/__init__.py
# ============================================================================
"""
Schemas de plantillas - email y servicios
"""

# Plantillas de email
from .email_template import (
    EmailTemplateBase,
    EmailTemplateCreate,
    EmailTemplateUpdate,
    EmailTemplateInDB
)

# Plantillas de servicios
from .service_templates import (
    ServiceSelection,
    ServiceTemplateBase,
    ServiceTemplateCreate,
    ServiceTemplateUpdate,
    ServiceTemplateInDB,
    ServiceTemplateWithServices
)

__all__ = [
    # Email templates
    "EmailTemplateBase", "EmailTemplateCreate", "EmailTemplateUpdate", "EmailTemplateInDB",
    
    # Service templates
    "ServiceSelection", "ServiceTemplateBase", "ServiceTemplateCreate", 
    "ServiceTemplateUpdate", "ServiceTemplateInDB", "ServiceTemplateWithServices"
]