# ===== backend/app/services/communication/__init__.py =====
"""
Servicios para comunicación y envío de correos
"""

from .email_service import (
    send_email, send_email_with_template, send_welcome_email,
    send_reset_password_email, send_reset_code_email, send_notification_email
)
from .smtp_service import SmtpService

__all__ = [
    "send_email",
    "send_email_with_template", 
    "send_welcome_email",
    "send_reset_password_email",
    "send_reset_code_email",
    "send_notification_email",
    "SmtpService"
]

__version__ = "1.0.0"
__description__ = "Communication and email services"