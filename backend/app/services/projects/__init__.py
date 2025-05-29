# ===== backend/app/services/projects/__init__.py =====
"""
Servicios para gestión de proyectos y tareas
"""

from .project_service import ProjectService
from .task_service import TaskService

__all__ = [
    "ProjectService",
    "TaskService"
]

__version__ = "1.0.0"
__description__ = "Project and task management services"