# ============================================================================
# backend/app/api/v1/inventory/search.py
# ============================================================================

from typing import Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import has_permission
from app.controllers.inventory.search_controller import SearchController
from app.models.auth.users import User

router = APIRouter()

@router.get("/unified")
def unified_inventory_search(
    q: str = Query(..., min_length=2, description="Término de búsqueda"),
    search_type: str = Query("all", description="Tipo de búsqueda: equipment, supplies, all"),
    limit: int = Query(50, ge=1, le=100, description="Número máximo de resultados"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_view"))
) -> Dict[str, Any]:
    """
    Búsqueda unificada en todo el inventario
    """
    return SearchController.unified_search(
        db=db,
        query=q,
        search_type=search_type,
        limit=limit
    )

@router.get("/filters")
def get_search_filters(
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_view"))
) -> Dict[str, Any]:
    """
    Obtiene filtros disponibles para búsquedas
    """
    return SearchController.get_search_filters(db)
