# ============================================================================
# backend/app/repositories/communication/__init__.py
# ============================================================================
"""
Repositorios de comunicación - configuración de email
"""

from .smtp_repository import SmtpRepository

__all__ = [
    'SmtpRepository'
]
