# ============================================================================
# backend/app/api/v1/inventory/activities.py
# ============================================================================

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query, Path, Body
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import has_permission
from app.controllers.inventory.activity_controller import ActivityController
from app.models.auth.users import User

router = APIRouter()

@router.get("/")
def get_activity_feed(
    limit: int = Query(50, ge=1, le=100, description="Número máximo de actividades"),
    activity_types: Optional[str] = Query(None, description="Tipos de actividad separados por coma"),
    user_id: Optional[int] = Query(None, description="Filtrar por usuario específico"),
    days_back: int = Query(30, ge=1, le=90, description="Días hacia atrás"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_view"))
) -> Dict[str, Any]:
    """
    Obtiene feed de actividades del inventario
    
    Tipos de actividad disponibles:
    - equipment_created, equipment_updated, equipment_assigned, equipment_unassigned
    - supply_created, supply_movement, supply_low_stock
    """
    return ActivityController.get_activity_feed(
        db=db,
        limit=limit,
        activity_types=activity_types,
        user_id=user_id,
        days_back=days_back
    )

@router.get("/types")
def get_activity_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_view"))
) -> List[Dict[str, Any]]:
    """
    Obtiene tipos de actividades disponibles para filtros
    """
    return ActivityController.get_activity_types(db)

@router.get("/summary")
def get_activity_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_view"))
) -> Dict[str, Any]:
    """
    Obtiene resumen de actividad reciente para dashboard
    """
    return ActivityController.get_activity_summary(db)

@router.post("/{activity_id}/read")
def mark_activity_as_read(
    activity_id: str = Path(..., description="ID de la actividad"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_view"))
) -> Dict[str, Any]:
    """
    Marca una actividad como leída (para futuras implementaciones)
    """
    return ActivityController.mark_activity_read(
        db=db,
        activity_id=activity_id,
        user_id=current_user.id
    )