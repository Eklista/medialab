# ============================================================================
# backend/app/tasks/__init__.py (NUEVO)
# ============================================================================
"""
Tareas programadas y procesos en segundo plano
Limpieza automática, mantenimiento y jobs asincrónicos
"""

# Tareas de limpieza de Redis
from .redis_cleanup_tasks import (
    RedisCleanupTasks,
    redis_cleanup_tasks
)

__all__ = [
    # Tareas de Redis
    "RedisCleanupTasks",
    "redis_cleanup_tasks"
]

__version__ = "1.0.0"
__description__ = "Background tasks and scheduled jobs"