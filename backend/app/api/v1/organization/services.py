# backend/app/api/v1/organization/services.py
from app.controllers.organization.service_controller import ServiceController
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status, Path, Body
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.auth.users import User
from app.schemas.organization.services import (
    ServiceCreate, 
    ServiceUpdate, 
    ServiceInDB,
    ServiceWithSubServices,
    SubServiceCreate,
    SubServiceUpdate,
    SubServiceInDB
)
from app.services.organization.service_service import ServiceService
from app.utils.error_handler import ErrorHandler
from app.api.deps import (
    get_current_active_user,
    has_permission,
    has_any_permission
)

router = APIRouter()

@router.get("/", response_model=List[ServiceWithSubServices])
def read_services(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("service_view"))
) -> Any:
    """
    Obtiene lista de servicios con sus sub-servicios (requiere permiso service_view)
    """
    return ServiceController.get_services_list(db, skip, limit, current_user)

@router.post("/", response_model=ServiceWithSubServices)
def create_service(
    service_in: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("service_create"))
) -> Any:
    """
    Crea un nuevo servicio con sus sub-servicios (requiere permiso service_create)
    """
    return ServiceController.create_service_with_subservices(db, service_in, current_user)

@router.get("/{service_id}", response_model=ServiceWithSubServices)
def read_service(
    service_id: int = Path(..., title="ID del servicio"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("service_view"))
) -> Any:
    """
    Obtiene un servicio específico por ID (requiere permiso service_view)
    """
    return ServiceController.get_service_by_id(db, service_id, current_user)

@router.patch("/{service_id}", response_model=ServiceWithSubServices)
def update_service(
    service_id: int = Path(..., title="ID del servicio"),
    service_in: ServiceUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("service_edit"))
) -> Any:
    """
    Actualiza un servicio existente (requiere permiso service_edit)
    """
    return ServiceController.update_service(db, service_id, service_in, current_user)

@router.delete("/{service_id}", response_model=ServiceInDB)
def delete_service(
    service_id: int = Path(..., title="ID del servicio"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("service_delete"))
) -> Any:
    """
    Elimina un servicio y sus sub-servicios (requiere permiso service_delete)
    """
    return ServiceController.delete_service(db, service_id, current_user)

# Sub-servicios
@router.post("/{service_id}/sub-services", response_model=SubServiceInDB)
def add_sub_service(
    service_id: int = Path(..., title="ID del servicio"),
    sub_service_in: SubServiceCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("service_edit"))
) -> Any:
    """
    Añade un sub-servicio a un servicio existente (requiere permiso service_edit)
    """
    return ServiceController.add_sub_service(db, service_id, sub_service_in, current_user)

@router.patch("/sub-services/{sub_service_id}", response_model=SubServiceInDB)
def update_sub_service(
    sub_service_id: int = Path(..., title="ID del sub-servicio"),
    sub_service_in: SubServiceUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("service_edit"))
) -> Any:
    """
    Actualiza un sub-servicio existente (requiere permiso service_edit)
    """
    return ServiceController.update_sub_service(db, sub_service_id, sub_service_in, current_user)

@router.delete("/sub-services/{sub_service_id}")
def delete_sub_service(
    sub_service_id: int = Path(..., title="ID del sub-servicio"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("service_edit"))
) -> dict:
    """
    Elimina un sub-servicio (requiere permiso service_edit)
    """
    return ServiceController.delete_sub_service(db, sub_service_id, current_user)