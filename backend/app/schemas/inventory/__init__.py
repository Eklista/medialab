# ============================================================================
# backend/app/schemas/inventory/__init__.py
# ============================================================================

from .equipment import (
    EquipmentBase, EquipmentCreate, EquipmentUpdate, EquipmentInDB, EquipmentWithDetails,
    EquipmentLabBase, EquipmentLabCreate, EquipmentLabUpdate, EquipmentLabInDB
)
from .supplies import (
    SupplyBase, SupplyCreate, SupplyUpdate, SupplyInDB, SupplyWithDetails,
    SupplyMovementBase, SupplyMovementCreate, SupplyMovementInDB, SupplyMovementWithDetails
)
from .common import (
    CategoryBase, CategoryCreate, CategoryUpdate, CategoryInDB,
    LocationBase, LocationCreate, LocationUpdate, LocationInDB,
    SupplierBase, SupplierCreate, SupplierUpdate, SupplierInDB,
    EquipmentStateBase, EquipmentStateCreate, EquipmentStateUpdate, EquipmentStateInDB,
    MovementTypeBase, MovementTypeCreate, MovementTypeUpdate, MovementTypeInDB
)
from .responses import (
    InventoryDashboardResponse, EquipmentSearchResponse, SupplyStockResponse,
    InventoryMetrics, CategorySummary, LocationSummary, EquipmentSearchFilters,
    BulkOperationResponse
)

__all__ = [
    # Equipment
    "EquipmentBase", "EquipmentCreate", "EquipmentUpdate", "EquipmentInDB", "EquipmentWithDetails",
    "EquipmentLabBase", "EquipmentLabCreate", "EquipmentLabUpdate", "EquipmentLabInDB",
    # Supplies  
    "SupplyBase", "SupplyCreate", "SupplyUpdate", "SupplyInDB", "SupplyWithDetails",
    "SupplyMovementBase", "SupplyMovementCreate", "SupplyMovementInDB", "SupplyMovementWithDetails",
    # Common
    "CategoryBase", "CategoryCreate", "CategoryUpdate", "CategoryInDB",
    "LocationBase", "LocationCreate", "LocationUpdate", "LocationInDB", 
    "SupplierBase", "SupplierCreate", "SupplierUpdate", "SupplierInDB",
    "EquipmentStateBase", "EquipmentStateCreate", "EquipmentStateUpdate", "EquipmentStateInDB",
    "MovementTypeBase", "MovementTypeCreate", "MovementTypeUpdate", "MovementTypeInDB",
    # Responses
    "InventoryDashboardResponse", "EquipmentSearchResponse", "SupplyStockResponse",
    "InventoryMetrics", "CategorySummary", "LocationSummary", "EquipmentSearchFilters",
    "BulkOperationResponse"
]
