# Archivo: app/api/v1/permissions.py
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.auth.users import User
from app.models.auth.permissions import Permission
from app.schemas.auth.permissions import PermissionResponse
from app.api.deps import has_permission

router = APIRouter()

@router.get("/", response_model=List[PermissionResponse])
def read_permissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("role_view"))
) -> Any:
    """
    Obtiene todos los permisos disponibles en el sistema
    """
    try:
        permissions = db.query(Permission).all()
        return permissions
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener permisos: {str(e)}"
        )