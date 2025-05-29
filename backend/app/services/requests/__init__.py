# ===== backend/app/services/requests/__init__.py =====
"""
Servicios para gestión de solicitudes y eventos
"""

from .request_service import RequestService
from .event_service import EventService
from .recurrence_service import RecurrenceService
from .request_completion_service import RequestCompletionService

__all__ = [
    "RequestService",
    "EventService",
    "RecurrenceService",
    "RequestCompletionService"
]

__version__ = "1.0.0"
__description__ = "Request and event management services"