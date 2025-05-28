# backend/app/api/v1/templates/service_templates.py
"""
🔄 ENDPOINTS DE PLANTILLAS REFACTORIZADOS
Sin SQL directo, toda la lógica delegada al ServiceTemplateController
"""

from typing import List, Any, Dict
from fastapi import APIRouter, Depends, status, Path, Body
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.auth.users import User
from app.schemas.templates.service_templates import (
    ServiceTemplateCreate, 
    ServiceTemplateUpdate, 
    ServiceTemplateInDB,
    ServiceTemplateWithServices
)
from app.controllers.templates.service_template_controller import ServiceTemplateController
from app.utils.error_handler import ErrorHandler
from app.api.deps import has_permission

router = APIRouter()

# ===== OPERACIONES CRUD BÁSICAS =====

@router.get("/", response_model=List[ServiceTemplateInDB])
def read_templates(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("template_view"))
) -> Any:
    """
    Obtiene lista de plantillas de servicios (requiere permiso template_view)
    ✅ REFACTORIZADO: Usa ServiceTemplateController
    """
    return ServiceTemplateController.get_templates_list(db, skip, limit, current_user)

@router.post("/", response_model=ServiceTemplateInDB)
def create_template(
    template_in: ServiceTemplateCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("template_create"))
) -> Any:
    """
    Crea una nueva plantilla de servicios (requiere permiso template_create)
    ✅ REFACTORIZADO: Usa ServiceTemplateController
    """
    return ServiceTemplateController.create_new_template(db, template_in, current_user)

@router.get("/{template_id}", response_model=ServiceTemplateWithServices)
def read_template(
    template_id: int = Path(..., title="ID de la plantilla"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("template_view"))
) -> Any:
    """
    Obtiene una plantilla específica por ID (requiere permiso template_view)
    ✅ REFACTORIZADO: Usa ServiceTemplateController
    """
    return ServiceTemplateController.get_template_by_id(db, template_id, current_user)

@router.patch("/{template_id}", response_model=ServiceTemplateInDB)
def update_template(
    template_id: int = Path(..., title="ID de la plantilla"),
    template_in: ServiceTemplateUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("template_edit"))
) -> Any:
    """
    Actualiza una plantilla existente (requiere permiso template_edit)
    ✅ REFACTORIZADO: Usa ServiceTemplateController
    """
    return ServiceTemplateController.update_template(db, template_id, template_in, current_user)

@router.delete("/{template_id}", response_model=ServiceTemplateInDB)
def delete_template(
    template_id: int = Path(..., title="ID de la plantilla"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("template_delete"))
) -> Any:
    """
    Elimina una plantilla (requiere permiso template_delete)
    ✅ REFACTORIZADO: Usa ServiceTemplateController con verificación de dependencias
    """
    return ServiceTemplateController.delete_template(db, template_id, current_user)

# ===== GESTIÓN DE RELACIONES (SIN SQL DIRECTO) =====

@router.get("/{template_id}/services", response_model=List[Dict[str, Any]])
def get_template_services(
    template_id: int = Path(..., title="ID de la plantilla"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("template_view"))
) -> Any:
    """
    Obtiene los servicios asociados a una plantilla (requiere permiso template_view)
    ✅ REFACTORIZADO: Sin SQL directo, usa ServiceTemplateController
    """
    return ServiceTemplateController.get_template_services(db, template_id, current_user)

@router.get("/{template_id}/subservices", response_model=List[Dict[str, Any]])
def get_template_subservices(
    template_id: int = Path(..., title="ID de la plantilla"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("template_view"))
) -> Any:
    """
    Obtiene los subservicios asociados a una plantilla (requiere permiso template_view)
    ✅ REFACTORIZADO: Sin SQL directo, usa ServiceTemplateController
    """
    return ServiceTemplateController.get_template_subservices(db, template_id, current_user)

# ===== NUEVOS ENDPOINTS PARA GESTIÓN DE RELACIONES =====

@router.post("/{template_id}/services", status_code=status.HTTP_200_OK)
def assign_services_to_template(
    template_id: int = Path(..., title="ID de la plantilla"),
    service_ids: List[int] = Body(..., description="Lista de IDs de servicios a asignar"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("template_edit"))
) -> Any:
    """
    🆕 NUEVO: Asigna servicios a una plantilla (requiere permiso template_edit)
    """
    return ServiceTemplateController.assign_services_to_template(db, template_id, service_ids, current_user)

@router.post("/{template_id}/subservices", status_code=status.HTTP_200_OK)
def assign_subservices_to_template(
    template_id: int = Path(..., title="ID de la plantilla"),
    subservice_ids: List[int] = Body(..., description="Lista de IDs de subservicios a asignar"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("template_edit"))
) -> Any:
    """
    🆕 NUEVO: Asigna subservicios a una plantilla (requiere permiso template_edit)
    """
    return ServiceTemplateController.assign_subservices_to_template(db, template_id, subservice_ids, current_user)

# ===== ENDPOINTS DE ESTADÍSTICAS Y ANÁLISIS =====

@router.get("/{template_id}/statistics", response_model=Dict[str, Any])
def get_template_statistics(
    template_id: int = Path(..., title="ID de la plantilla"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("template_view"))
) -> Any:
    """
    🆕 NUEVO: Obtiene estadísticas completas de una plantilla
    """
    return ServiceTemplateController.get_template_statistics(db, template_id, current_user)