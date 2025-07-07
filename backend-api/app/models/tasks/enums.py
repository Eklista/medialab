"""
Enums para tareas
"""

import enum


class TaskStatus(enum.Enum):
    """Estados de tarea"""
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    BLOCKED = "blocked"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TaskPriority(enum.Enum):
    """Prioridades de tarea"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TaskType(enum.Enum):
    """Tipos de tarea"""
    DEVELOPMENT = "development"
    RESEARCH = "research"
    DESIGN = "design"
    TESTING = "testing"
    DOCUMENTATION = "documentation"
    MAINTENANCE = "maintenance"
    MEETING = "meeting"
    OTHER = "other"
