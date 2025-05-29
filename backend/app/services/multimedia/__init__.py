# ===== backend/app/services/multimedia/__init__.py =====
"""
Servicios para gestión de contenido multimedia
"""

from .podcast_service import PodcastService
from .course_service import CourseService

__all__ = [
    "PodcastService",
    "CourseService"
]

__version__ = "1.0.0"
__description__ = "Multimedia content management services"