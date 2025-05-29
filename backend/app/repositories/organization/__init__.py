# ============================================================================
# backend/app/repositories/organization/__init__.py
# ============================================================================
"""
Repositorios de organización - departamentos, áreas y servicios
"""

# Repositorios de áreas
from .area_repository import AreaRepository

# Repositorios de departamentos
from .department_repository import DepartmentRepository
from .department_type_repository import DepartmentTypeRepository

# Repositorios de servicios
from .service_repository import ServiceRepository

__all__ = [
    # Áreas
    'AreaRepository',
    
    # Departamentos
    'DepartmentRepository',
    'DepartmentTypeRepository',
    
    # Servicios
    'ServiceRepository'
]
