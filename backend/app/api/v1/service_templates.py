# app/api/v1/service_templates.py
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.auth.users import User
from app.schemas.organization.service_templates import (
    ServiceTemplateCreate, 
    ServiceTemplateUpdate, 
    ServiceTemplateInDB,
    ServiceTemplateWithServices
)
from app.services.service_template_service import ServiceTemplateService
from app.utils.error_handler import ErrorHandler
from app.api.deps import get_current_active_superuser, get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[ServiceTemplateInDB])
def read_templates(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtiene lista de plantillas de servicios
    """
    try:
        templates = ServiceTemplateService.get_templates(db=db, skip=skip, limit=limit)
        return templates
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "plantillas")

@router.post("/", response_model=ServiceTemplateInDB)
def create_template(
    template_in: ServiceTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Crea una nueva plantilla de servicios
    """
    try:
        print(f"Datos recibidos en el endpoint: {template_in.dict()}")
        template = ServiceTemplateService.create_template(db=db, template_data=template_in.dict())
        return template
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "crear", "plantilla")

@router.get("/{template_id}", response_model=ServiceTemplateWithServices)
def read_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtiene una plantilla específica por ID
    """
    try:
        template = ServiceTemplateService.get_template_with_services(db=db, template_id=template_id)
        return template
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "plantilla")

@router.patch("/{template_id}", response_model=ServiceTemplateInDB)
def update_template(
    template_id: int,
    template_in: ServiceTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Actualiza una plantilla existente
    """
    try:
        template = ServiceTemplateService.update_template(
            db=db,
            template_id=template_id,
            template_data=template_in.dict(exclude_unset=True)
        )
        return template
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "actualizar", "plantilla")

@router.delete("/{template_id}", response_model=ServiceTemplateInDB)
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Elimina una plantilla
    """
    try:
        template = ServiceTemplateService.delete_template(db=db, template_id=template_id)
        return template
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "eliminar", "plantilla")