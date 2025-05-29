# ============================================================================
# backend/app/schemas/communication/__init__.py
# ============================================================================
"""
Schemas de comunicación - configuración de email
"""

from .email_config import (
    SmtpConfigurationBase,
    SmtpConfigurationCreate,
    SmtpConfigurationUpdate,
    SmtpConfigurationInDB,
    SmtpTestRequest
)

__all__ = [
    "SmtpConfigurationBase",
    "SmtpConfigurationCreate",
    "SmtpConfigurationUpdate", 
    "SmtpConfigurationInDB",
    "SmtpTestRequest"
]
