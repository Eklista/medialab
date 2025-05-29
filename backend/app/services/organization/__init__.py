# ===== backend/app/services/organization/__init__.py =====
"""
Servicios para gestión de estructura organizacional
"""

from .area_service import AreaService
from .department_service import DepartmentService
from .department_type_service import DepartmentTypeService
from .service_service import ServiceService

__all__ = [
    "AreaService",
    "DepartmentService",
    "DepartmentTypeService",
    "ServiceService"
]

__version__ = "1.0.0"
__description__ = "Organizational structure management services"