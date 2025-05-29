# ============================================================================
# backend/app/schemas/organization/__init__.py
# ============================================================================
"""
Schemas de organización - departamentos, áreas y servicios
"""

# Schemas de áreas
from .areas import (
    AreaBase,
    AreaCreate,
    AreaUpdate,
    AreaInDB
)

# Schemas de departamentos
from .departments import (
    DepartmentTypeBase,
    DepartmentTypeCreate,
    DepartmentTypeUpdate,
    DepartmentTypeInDB,
    DepartmentBase,
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentInDB,
    DepartmentWithType
)

# Schemas de servicios
from .services import (
    SubServiceBase,
    SubServiceCreate,
    SubServiceUpdate,
    SubServiceInDB,
    ServiceBase,
    ServiceCreate,
    ServiceUpdate,
    ServiceInDB,
    ServiceWithSubServices
)

__all__ = [
    # Áreas
    "AreaBase", "AreaCreate", "AreaUpdate", "AreaInDB",
    
    # Departamentos
    "DepartmentTypeBase", "DepartmentTypeCreate", "DepartmentTypeUpdate", "DepartmentTypeInDB",
    "DepartmentBase", "DepartmentCreate", "DepartmentUpdate", "DepartmentInDB", "DepartmentWithType",
    
    # Servicios
    "SubServiceBase", "SubServiceCreate", "SubServiceUpdate", "SubServiceInDB",
    "ServiceBase", "ServiceCreate", "ServiceUpdate", "ServiceInDB", "ServiceWithSubServices"
]