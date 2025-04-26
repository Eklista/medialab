from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
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
from app.services.service_service import ServiceService
from app.utils.error_handler import ErrorHandler
from app.api.deps import get_current_active_user, get_current_active_superuser

router = APIRouter()

@router.get("/", response_model=List[ServiceWithSubServices])
def read_services(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> Any:
    """
    Obtiene lista de servicios con sus sub-servicios
    """
    try:
        services = ServiceService.get_services(db=db, skip=skip, limit=limit)
        return services
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "servicios")

@router.post("/", response_model=ServiceWithSubServices)
def create_service(
    service_in: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)  # Requiere ser superusuario
) -> Any:
    """
    Crea un nuevo servicio con sus sub-servicios
    """
    try:
        # Separar datos del servicio y sub-servicios
        sub_services_data = [sub.dict() for sub in service_in.sub_services] if service_in.sub_services else []
        service_data = service_in.dict(exclude={"sub_services"})
        
        service = ServiceService.create_service(
            db=db,
            service_data=service_data,
            sub_services_data=sub_services_data
        )
        return service
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "crear", "servicio")

@router.get("/{service_id}", response_model=ServiceWithSubServices)
def read_service(
    service_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """
    Obtiene un servicio específico por ID
    """
    try:
        service = ServiceService.get_service_by_id(db=db, service_id=service_id)
        return service
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "servicio")

@router.patch("/{service_id}", response_model=ServiceWithSubServices)
def update_service(
    service_id: int,
    service_in: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)  # Requiere ser superusuario
) -> Any:
    """
    Actualiza un servicio existente
    """
    try:
        service = ServiceService.update_service(
            db=db,
            service_id=service_id,
            service_data=service_in.dict(exclude_unset=True)
        )
        return service
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "actualizar", "servicio")

@router.delete("/{service_id}", response_model=ServiceInDB)
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)  # Requiere ser superusuario
) -> Any:
    """
    Elimina un servicio y sus sub-servicios
    """
    try:
        service = ServiceService.delete_service(db=db, service_id=service_id)
        return service
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "eliminar", "servicio")

# Endpoints para sub-servicios
@router.post("/{service_id}/sub-services", response_model=SubServiceInDB)
def add_sub_service(
    service_id: int,
    sub_service_in: SubServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)  # Requiere ser superusuario
) -> Any:
    """
    Añade un sub-servicio a un servicio existente
    """
    try:
        sub_service = ServiceService.add_sub_service(
            db=db,
            service_id=service_id,
            sub_service_data=sub_service_in.dict()
        )
        return sub_service
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "crear", "sub-servicio")

@router.patch("/sub-services/{sub_service_id}", response_model=SubServiceInDB)
def update_sub_service(
    sub_service_id: int,
    sub_service_in: SubServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)  # Requiere ser superusuario
) -> Any:
    """
    Actualiza un sub-servicio existente
    """
    try:
        sub_service = ServiceService.update_sub_service(
            db=db,
            sub_service_id=sub_service_id,
            sub_service_data=sub_service_in.dict(exclude_unset=True)
        )
        return sub_service
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "actualizar", "sub-servicio")

@router.delete("/sub-services/{sub_service_id}")
def delete_sub_service(
    sub_service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)  # Requiere ser superusuario
) -> dict:
    """
    Elimina un sub-servicio
    """
    try:
        ServiceService.delete_sub_service(db=db, sub_service_id=sub_service_id)
        return {"message": "Sub-servicio eliminado exitosamente"}
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "eliminar", "sub-servicio")