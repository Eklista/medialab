# backend/app/controllers/organization/__init__.py
"""
Controladores de organización - departamentos, áreas y servicios
"""

from .area_controller import AreaController
from .department_controller import DepartmentController
from .department_type_controller import DepartmentTypeController
from .service_controller import ServiceController

__all__ = [
    "AreaController",
    "DepartmentController", 
    "DepartmentTypeController",
    "ServiceController"
]