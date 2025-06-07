# ============================================================================
# backend/app/api/v1/inventory/supplies.py
# ============================================================================

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, status, Query, Path, Body
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_active_user, has_permission
from app.controllers.inventory.supply_controller import SupplyController
from app.schemas.inventory.supplies import SupplyCreate, SupplyUpdate, SupplyMovementCreate
from app.models.auth.users import User

router = APIRouter()

# ===== LISTADO Y BÚSQUEDA =====

@router.get("/", response_model=List[Dict[str, Any]])
def get_supplies_list(
    skip: int = Query(0, ge=0, description="Registros a omitir"),
    limit: int = Query(25, ge=1, le=100, description="Número máximo de registros"),
    format_type: str = Query("list", description="Tipo de formato"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_view"))
) -> List[Dict[str, Any]]:
    """
    Obtiene lista de suministros
    """
    return SupplyController.get_supplies_list(
        db=db,
        skip=skip,
        limit=limit,
        format_type=format_type
    )

@router.get("/search")
def search_supplies(
    q: str = Query(..., min_length=2, description="Término de búsqueda"),
    category_id: Optional[int] = Query(None, description="Filtrar por categoría"),
    location_id: Optional[int] = Query(None, description="Filtrar por ubicación"),
    low_stock_only: bool = Query(False, description="Solo mostrar stock bajo"),
    cursor: int = Query(0, ge=0, description="Cursor para paginación"),
    limit: int = Query(25, ge=1, le=100, description="Número máximo de resultados"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_view"))
) -> Dict[str, Any]:
    """
    Búsqueda de suministros
    """
    filters = {
        "category_id": category_id,
        "location_id": location_id,
        "low_stock_only": low_stock_only
    }
    
    return SupplyController.search_supplies(
        db=db,
        search_query=q,
        filters=filters,
        cursor=cursor,
        limit=limit
    )

# ===== MOVIMIENTOS DE STOCK =====

@router.post("/{supply_id}/movements", status_code=status.HTTP_201_CREATED)
def create_supply_movement(
    supply_id: int = Path(..., description="ID del suministro"),
    movement_type_id: int = Body(..., description="ID del tipo de movimiento"),
    cantidad: int = Body(..., gt=0, description="Cantidad del movimiento"),
    numero_envio: Optional[str] = Body(None, description="Número de envío"),
    user_receives_id: Optional[int] = Body(None, description="Usuario que recibe"),
    user_delivers_to_id: Optional[int] = Body(None, description="Usuario al que se entrega"),
    observaciones: Optional[str] = Body(None, description="Observaciones"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_stock_manage"))
) -> Dict[str, Any]:
    """
    Crea un movimiento de suministro (entrada/salida)
    """
    movement_data = {
        "numero_envio": numero_envio,
        "user_receives_id": user_receives_id,
        "user_delivers_to_id": user_delivers_to_id,
        "observaciones": observaciones
    }
    
    return SupplyController.create_supply_movement(
        db=db,
        supply_id=supply_id,
        movement_type_id=movement_type_id,
        cantidad=cantidad,
        movement_data=movement_data,
        current_user_id=current_user.id
    )

@router.get("/{supply_id}/stock")
def get_supply_stock_status(
    supply_id: int = Path(..., description="ID del suministro"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_view"))
) -> Dict[str, Any]:
    """
    Obtiene el estado del stock de un suministro
    """
    return SupplyController.get_supply_stock_status(db, supply_id)

# ===== ALERTAS DE STOCK =====

@router.get("/low-stock")
def get_low_stock_supplies(
    limit: int = Query(50, ge=1, le=100, description="Número máximo de resultados"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_view"))
) -> List[Dict[str, Any]]:
    """
    Obtiene suministros con stock bajo
    """
    filters = {"low_stock_only": True}
    
    result = SupplyController.search_supplies(
        db=db,
        search_query="",
        filters=filters,
        cursor=0,
        limit=limit
    )
    
    return result.get("results", [])