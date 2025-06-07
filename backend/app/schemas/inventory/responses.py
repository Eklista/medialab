# ============================================================================
# backend/app/schemas/inventory/responses.py
# ============================================================================

from typing import List, Optional, Dict, Any
from pydantic import BaseModel

# ===== DASHBOARD RESPONSES =====
class InventoryMetrics(BaseModel):
    total_equipment: int
    active_equipment: int
    damaged_equipment: int
    assigned_equipment: int
    total_supplies: int
    low_stock_supplies: int

class CategorySummary(BaseModel):
    id: int
    name: str
    count: int
    operational_count: int
    percentage: float

class LocationSummary(BaseModel):
    id: int
    name: str
    count: int
    percentage: float

class InventoryDashboardResponse(BaseModel):
    metrics: InventoryMetrics
    categories_summary: List[CategorySummary]
    locations_summary: List[LocationSummary]
    recent_activity: List[Dict[str, Any]]
    alerts: List[str]
    timestamp: str

# ===== SEARCH RESPONSES =====
class EquipmentSearchFilters(BaseModel):
    categories: List[Dict[str, Any]]
    states: List[Dict[str, Any]]
    locations: List[Dict[str, Any]]
    suppliers: List[Dict[str, Any]]

class EquipmentSearchResponse(BaseModel):
    total_found: int
    results: List[Dict[str, Any]]  # Equipment formateado para lista
    has_more: bool
    next_cursor: Optional[int] = None
    filters_available: Optional[EquipmentSearchFilters] = None

class SupplyStockResponse(BaseModel):
    supply_id: int
    codigo: Optional[str]
    nombre_producto: str
    stock_actual: int
    stock_minimo: int
    status: str  # "ok", "low", "critical", "out"
    last_movement: Optional[Dict[str, Any]] = None

# ===== BULK OPERATIONS =====
class BulkOperationResponse(BaseModel):
    success: bool
    total_processed: int
    successful: int
    failed: int
    errors: List[str]
    results: List[Dict[str, Any]]