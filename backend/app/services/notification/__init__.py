# ===== backend/app/services/notification/__init__.py =====
"""
Servicios para gestión de notificaciones
"""

from .notificacion_service import NotificationService

__all__ = [
    "NotificationService"
]

__version__ = "1.0.0"
__description__ = "Notification management services"