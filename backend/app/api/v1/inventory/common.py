# ============================================================================
# backend/app/api/v1/inventory/common.py
# ============================================================================

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, status, Body, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import has_permission
from app.repositories.inventory.category_repository import CategoryRepository
from app.repositories.inventory.location_repository import LocationRepository
from app.repositories.inventory.supplier_repository import SupplierRepository
from app.repositories.inventory.equipment_state_repository import EquipmentStateRepository
from app.repositories.inventory.movement_type_repository import MovementTypeRepository
from app.schemas.inventory.common import (
    CategoryCreate, LocationCreate, SupplierCreate, 
    EquipmentStateCreate, MovementTypeCreate
)
from app.models.auth.users import User

router = APIRouter()

# ===== CATEGORÍAS =====

@router.get("/categories")
def get_categories(
    equipment_only: bool = Query(False, description="Solo categorías de equipos"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_view"))
) -> List[Dict[str, Any]]:
    """
    Obtiene todas las categorías activas
    """
    if equipment_only:
        categories = CategoryRepository.get_equipment_categories(db)
    else:
        categories = CategoryRepository.get_all_active(db)
    
    return [
        {
            "id": cat.id,
            "name": cat.name,
            "description": cat.description,
            "is_equipment": cat.is_equipment,
            "is_active": cat.is_active
        }
        for cat in categories
    ]

@router.post("/categories", status_code=status.HTTP_201_CREATED)
def create_category(
    category_data: CategoryCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_admin"))
) -> Dict[str, Any]:
    """
    Crea una nueva categoría
    """
    category = CategoryRepository.create(db, category_data.dict())
    
    return {
        "id": category.id,
        "name": category.name,
        "description": category.description,
        "is_equipment": category.is_equipment,
        "is_active": category.is_active,
        "created_at": category.created_at.isoformat()
    }

# ===== UBICACIONES =====

@router.get("/locations")
def get_locations(
    internal_only: bool = Query(False, description="Solo ubicaciones internas"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_view"))
) -> List[Dict[str, Any]]:
    """
    Obtiene todas las ubicaciones activas
    """
    if internal_only:
        locations = LocationRepository.get_internal_locations(db)
    else:
        locations = LocationRepository.get_all_active(db)
    
    return [
        {
            "id": loc.id,
            "name": loc.name,
            "description": loc.description,
            "is_external": loc.is_external,
            "is_active": loc.is_active
        }
        for loc in locations
    ]

@router.post("/locations", status_code=status.HTTP_201_CREATED)
def create_location(
    location_data: LocationCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_admin"))
) -> Dict[str, Any]:
    """
    Crea una nueva ubicación
    """
    location = LocationRepository.create(db, location_data.dict())
    
    return {
        "id": location.id,
        "name": location.name,
        "description": location.description,
        "is_external": location.is_external,
        "is_active": location.is_active,
        "created_at": location.created_at.isoformat()
    }

# ===== PROVEEDORES =====

@router.get("/suppliers")
def get_suppliers(
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_view"))
) -> List[Dict[str, Any]]:
    """
    Obtiene todos los proveedores activos
    """
    suppliers = SupplierRepository.get_all_active(db)
    
    return [
        {
            "id": sup.id,
            "name": sup.name,
            "contact_person": sup.contact_person,
            "phone": sup.phone,
            "email": sup.email,
            "is_active": sup.is_active
        }
        for sup in suppliers
    ]

# ===== ESTADOS DE EQUIPOS =====

@router.get("/equipment-states")
def get_equipment_states(
    operational_only: bool = Query(False, description="Solo estados operativos"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_view"))
) -> List[Dict[str, Any]]:
    """
    Obtiene todos los estados de equipos
    """
    if operational_only:
        states = EquipmentStateRepository.get_operational_states(db)
    else:
        states = EquipmentStateRepository.get_all_active(db)
    
    return [
        {
            "id": state.id,
            "name": state.name,
            "description": state.description,
            "color": state.color,
            "is_operational": state.is_operational,
            "is_active": state.is_active
        }
        for state in states
    ]

# ===== TIPOS DE MOVIMIENTO =====

@router.get("/movement-types")
def get_movement_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("inventory_view"))
) -> List[Dict[str, Any]]:
    """
    Obtiene todos los tipos de movimiento
    """
    movement_types = MovementTypeRepository.get_all_active(db)
    
    return [
        {
            "id": mt.id,
            "name": mt.name,
            "description": mt.description,
            "affects_stock": mt.affects_stock,
            "is_active": mt.is_active
        }
        for mt in movement_types
    ]
