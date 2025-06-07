# ============================================================================
# backend/app/controllers/inventory/__init__.py - ACTUALIZADO
# ============================================================================

from .equipment_controller import EquipmentController
from .supply_controller import SupplyController
from .dashboard_controller import DashboardController
from .search_controller import SearchController
from .activity_controller import ActivityController  
__all__ = [
    "EquipmentController",
    "SupplyController",
    "DashboardController", 
    "SearchController",
    "ActivityController"  
]
