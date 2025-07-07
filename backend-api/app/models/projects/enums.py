"""
Enums para proyectos
"""

import enum


class ProjectStatus(enum.Enum):
    """Estados de proyecto"""
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ProjectPriority(enum.Enum):
    """Prioridades de proyecto"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
