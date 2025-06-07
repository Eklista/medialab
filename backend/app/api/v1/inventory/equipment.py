# ============================================================================
# backend/app/api/v1/inventory/equipment.py
# ============================================================================

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, status, Query, Path, Body
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_active_user, has_permission
from app.controllers.inventory.equipment_controller import EquipmentController
from app.schemas.inventory.equipment import EquipmentCreate, EquipmentUpdate, EquipmentWithDetails
from app.schemas.inventory.responses import EquipmentSearchResponse
from app.models.auth.users import User

router = APIRouter()

# ===== LISTADO Y BÚSQUEDA =====

@router.get("/", response_model=List[Dict[str, Any]])
def get_equipment_list(
    skip: int = Query(0, ge=0, description="Registros a omitir"),
    limit: int = Query(25, ge=1, le=100, description="Número máximo de registros"),
    format_type: str = Query("list", description="Tipo de formato: minimal, list, dropdown"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_view"))
) -> List[Dict[str, Any]]:
    """
    Obtiene lista de equipos con paginación
    """
    return EquipmentController.get_equipment_list(
        db=db,
        skip=skip,
        limit=limit,
        format_type=format_type
    )

@router.get("/search")
def search_equipment(
    q: str = Query(..., min_length=2, description="Término de búsqueda"),
    category_id: Optional[int] = Query(None, description="Filtrar por categoría"),
    state_id: Optional[int] = Query(None, description="Filtrar por estado"),
    location_id: Optional[int] = Query(None, description="Filtrar por ubicación"),
    assigned_user_id: Optional[int] = Query(None, description="Filtrar por usuario asignado"),
    supplier_id: Optional[int] = Query(None, description="Filtrar por proveedor"),
    cursor: int = Query(0, ge=0, description="Cursor para paginación"),
    limit: int = Query(25, ge=1, le=100, description="Número máximo de resultados"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_view"))
) -> Dict[str, Any]:
    """
    Búsqueda avanzada de equipos con filtros
    """
    filters = {
        "category_id": category_id,
        "state_id": state_id,
        "location_id": location_id,
        "assigned_user_id": assigned_user_id,
        "supplier_id": supplier_id
    }
    
    # Filtrar valores None
    filters = {k: v for k, v in filters.items() if v is not None}
    
    return EquipmentController.search_equipment(
        db=db,
        search_query=q,
        filters=filters,
        cursor=cursor,
        limit=limit
    )

# ===== OPERACIONES CRUD =====

@router.get("/{equipment_id}", response_model=Dict[str, Any])
def get_equipment_by_id(
    equipment_id: int = Path(..., description="ID del equipo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_view"))
) -> Dict[str, Any]:
    """
    Obtiene un equipo específico por ID
    """
    return EquipmentController.get_equipment_by_id(db, equipment_id)

@router.post("/", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_equipment(
    equipment_data: EquipmentCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_create"))
) -> Dict[str, Any]:
    """
    Crea un nuevo equipo
    """
    return EquipmentController.create_equipment(
        db=db,
        equipment_data=equipment_data,
        current_user_id=current_user.id
    )

@router.patch("/{equipment_id}", response_model=Dict[str, Any])
def update_equipment(
    equipment_id: int = Path(..., description="ID del equipo"),
    equipment_data: EquipmentUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_edit"))
) -> Dict[str, Any]:
    """
    Actualiza un equipo existente
    """
    return EquipmentController.update_equipment(
        db=db,
        equipment_id=equipment_id,
        equipment_data=equipment_data,
        current_user_id=current_user.id
    )

@router.delete("/{equipment_id}")
def delete_equipment(
    equipment_id: int = Path(..., description="ID del equipo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_delete"))
) -> Dict[str, str]:
    """
    Elimina un equipo (soft delete)
    """
    return EquipmentController.delete_equipment(
        db=db,
        equipment_id=equipment_id,
        current_user_id=current_user.id
    )

# ===== ASIGNACIONES =====

@router.post("/{equipment_id}/assign")
def assign_equipment(
    equipment_id: int = Path(..., description="ID del equipo"),
    user_id: int = Body(..., embed=True, description="ID del usuario a asignar"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_assign"))
) -> Dict[str, Any]:
    """
    Asigna un equipo a un usuario
    """
    return EquipmentController.assign_equipment(
        db=db,
        equipment_id=equipment_id,
        user_id=user_id,
        current_user_id=current_user.id
    )

@router.post("/{equipment_id}/unassign")
def unassign_equipment(
    equipment_id: int = Path(..., description="ID del equipo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_assign"))
) -> Dict[str, Any]:
    """
    Desasigna un equipo
    """
    return EquipmentController.unassign_equipment(
        db=db,
        equipment_id=equipment_id,
        current_user_id=current_user.id
    )
