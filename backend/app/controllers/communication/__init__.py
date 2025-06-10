# backend/app/controllers/communication/__init__.py
"""
Controladores de comunicación - SMTP y email
"""

from .smtp_controller import SmtpController

__all__ = [
    "SmtpController"
]