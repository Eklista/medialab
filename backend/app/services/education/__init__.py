# ===== backend/app/services/education/__init__.py =====
"""
Servicios para gestión educativa
"""

from .professor_service import ProfessorService

__all__ = [
    "ProfessorService"
]

__version__ = "1.0.0"
__description__ = "Educational management services"