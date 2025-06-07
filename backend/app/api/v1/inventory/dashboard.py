# ============================================================================
# backend/app/api/v1/inventory/dashboard.py
# ============================================================================

from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import has_permission
from app.controllers.inventory.dashboard_controller import DashboardController
from app.schemas.inventory.responses import InventoryDashboardResponse
from app.models.auth.users import User

router = APIRouter()

@router.get("/", response_model=Dict[str, Any])
def get_inventory_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_view"))
) -> Dict[str, Any]:
    """
    Obtiene datos completos del dashboard de inventario
    """
    return DashboardController.get_dashboard_data(db)

@router.get("/stats")
def get_quick_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_view"))
) -> Dict[str, Any]:
    """
    Obtiene estadísticas rápidas para widgets
    """
    return DashboardController.get_quick_stats(db)