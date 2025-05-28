# app/api/v1/public.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any

from app.database import get_db
from app.models.organization.departments import Department
from app.schemas.organization.departments import DepartmentInDB
from app.models.organization.services import Service
from app.schemas.organization.services import ServiceWithSubServices
from app.schemas.templates.service_templates import ServiceTemplateWithServices
from app.services.templates.service_template_service import ServiceTemplateService

router = APIRouter()

@router.get("/departments", response_model=List[DepartmentInDB])
def read_public_departments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> Any:
    """
    Endpoint público para obtener departamentos (no requiere autenticación)
    """
    try:
        departments = db.query(Department).offset(skip).limit(limit).all()
        return departments
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener departamentos: {str(e)}"
        )

@router.get("/services", response_model=List[ServiceWithSubServices])
def read_public_services(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> Any:
    """
    Endpoint público para obtener servicios con sus sub-servicios (no requiere autenticación)
    """
    try:
        from sqlalchemy.orm import joinedload
        services = db.query(Service).options(joinedload(Service.sub_services)).offset(skip).limit(limit).all()
        return services
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener servicios: {str(e)}"
        )

@router.get("/templates", response_model=List[ServiceTemplateWithServices])
def read_public_templates(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> Any:
    """
    Obtiene lista de plantillas de servicios públicas (sin autenticación)
    """
    templates = ServiceTemplateService.get_public_templates(db=db, skip=skip, limit=limit)
    return templates

@router.get("/templates/{template_id}/services")
def get_public_template_services(
    template_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """
    Obtiene los servicios asociados a una plantilla pública (sin autenticación)
    """
    try:
        # Verificar que la plantilla sea pública
        template = db.query(ServiceTemplate).filter(
            ServiceTemplate.id == template_id,
            ServiceTemplate.is_public == True
        ).first()
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plantilla no encontrada o no es pública"
            )
        
        # Usar el mismo servicio de templates pero añadiendo validación de plantilla pública
        return ServiceTemplateService.get_template_service_relations(db=db, template_id=template_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener servicios de plantilla: {str(e)}"
        )

@router.get("/templates/{template_id}/subservices")
def get_public_template_subservices(
    template_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """
    Obtiene los subservicios asociados a una plantilla pública (sin autenticación)
    """
    try:
        # Verificar que la plantilla sea pública
        template = db.query(ServiceTemplate).filter(
            ServiceTemplate.id == template_id,
            ServiceTemplate.is_public == True
        ).first()
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plantilla no encontrada o no es pública"
            )
        
        # Usar el mismo servicio de templates pero añadiendo validación de plantilla pública
        return ServiceTemplateService.get_template_subservice_relations(db=db, template_id=template_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener subservicios de plantilla: {str(e)}"
        )