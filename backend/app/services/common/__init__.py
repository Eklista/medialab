# ===== backend/app/services/common/__init__.py =====
"""
Servicios comunes reutilizables en todo el sistema
"""

from .validation_service import ValidationService
from .attachment_service import AttachmentService
from .comment_service import CommentService
from .link_service import LinkService
from .status_service import StatusService
from .entity_service import EntityService
from .metadata_service import MetadataService
from .workflow_service import WorkflowService

__all__ = [
    "ValidationService",
    "AttachmentService",
    "CommentService",
    "LinkService",
    "StatusService",
    "EntityService",
    "MetadataService",
    "WorkflowService"
]

__version__ = "1.0.0"
__description__ = "Common reusable services"
