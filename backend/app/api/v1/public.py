# app/api/v1/public.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any

from app.database import get_db
from app.models.organization.departments import Department
from app.schemas.organization.departments import DepartmentInDB
from app.models.organization.services import Service
from app.schemas.organization.services import ServiceWithSubServices

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