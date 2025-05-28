# ===== backend/app/api/v1/organization/areas.py =====
"""
Solo routing y validación, lógica delegada al AreaController
"""

from typing import List, Any
from fastapi import APIRouter, Depends, status, Path, Body
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.auth.users import User
from app.schemas.organization.areas import AreaCreate, AreaUpdate, AreaInDB
from app.controllers.organization.area_controller import AreaController
from app.api.deps import has_permission

router = APIRouter()

@router.get("/", response_model=List[AreaInDB])
def read_areas(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("area_view"))
) -> Any:
    """
    Obtiene lista de áreas (requiere permiso area_view)
    ✅ REFACTORIZADO: Usa AreaController
    """
    return AreaController.get_areas_list(db, skip, limit, current_user)

@router.post("/", response_model=AreaInDB)
def create_area(
    area_in: AreaCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("area_create"))
) -> Any:
    """
    Crea una nueva área (requiere permiso area_create)
    ✅ REFACTORIZADO: Usa AreaController
    """
    return AreaController.create_new_area(db, area_in, current_user)

@router.get("/{area_id}", response_model=AreaInDB)
def read_area(
    area_id: int = Path(..., title="ID del área"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("area_view"))
) -> Any:
    """
    Obtiene un área específica por ID (requiere permiso area_view)
    ✅ REFACTORIZADO: Usa AreaController
    """
    return AreaController.get_area_by_id(db, area_id, current_user)

@router.patch("/{area_id}", response_model=AreaInDB)
def update_area(
    area_id: int = Path(..., title="ID del área"),
    area_in: AreaUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("area_edit"))
) -> Any:
    """
    Actualiza un área existente (requiere permiso area_edit)
    ✅ REFACTORIZADO: Usa AreaController
    """
    return AreaController.update_area(db, area_id, area_in, current_user)

@router.delete("/{area_id}", response_model=AreaInDB)
def delete_area(
    area_id: int = Path(..., title="ID del área"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("area_delete"))
) -> Any:
    """
    Elimina un área (requiere permiso area_delete)
    ✅ REFACTORIZADO: Usa AreaController
    """
    return AreaController.delete_area(db, area_id, current_user)