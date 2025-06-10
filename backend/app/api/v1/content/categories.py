# app/api/v1/content/categories.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.api.deps import get_current_user
from app.models.auth.users import User
from app.controllers.content.category_controller import ContentCategoryController
from app.schemas.content.categories import (
    ContentCategoryCreate, ContentCategoryUpdate, ContentCategoryInDB,
    DepartmentWithCategories
)
from app.core.exceptions import ValidationError, NotFoundError, ConflictError
from app.utils.response_util import create_response
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_category(
    category_data: ContentCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    🆕 Crear nueva categoría de contenido
    """
    try:
        controller = ContentCategoryController(db)
        category = controller.create_category(category_data, current_user.id)
        
        logger.info(f"✅ Categoría creada: {category.name} por usuario {current_user.id}")
        
        return create_response(
            success=True,
            message="Categoría creada exitosamente",
            data=category.dict(),
            status_code=201
        )
    
    except ConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error creando categoría: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.get("/", response_model=dict)
def get_categories(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=500, description="Número máximo de registros a retornar"),
    active_only: bool = Query(True, description="Solo categorías activas"),
    search: Optional[str] = Query(None, description="Buscar por nombre o descripción"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    📋 Obtener lista de categorías de contenido
    """
    try:
        controller = ContentCategoryController(db)
        
        if search:
            categories = controller.search_categories(query=search, skip=skip, limit=limit)
            message = f"Búsqueda de categorías: '{search}'"
        else:
            categories = controller.get_categories(skip=skip, limit=limit, active_only=active_only)
            message = "Lista de categorías obtenida exitosamente"
        
        return create_response(
            success=True,
            message=message,
            data={
                "categories": [cat.dict() for cat in categories],
                "total": len(categories),
                "skip": skip,
                "limit": limit,
                "search": search,
                "active_only": active_only
            }
        )
    
    except Exception as e:
        logger.error(f"💥 Error obteniendo categorías: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.get("/{category_id}", response_model=dict)
def get_category_by_id(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    📄 Obtener categoría por ID
    """
    try:
        controller = ContentCategoryController(db)
        category = controller.get_category_by_id(category_id)
        
        return create_response(
            success=True,
            message="Categoría obtenida exitosamente",
            data=category.dict()
        )
    
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error obteniendo categoría {category_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.get("/slug/{slug}", response_model=dict)
def get_category_by_slug(
    slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    🔗 Obtener categoría por slug
    """
    try:
        controller = ContentCategoryController(db)
        category = controller.get_category_by_slug(slug)
        
        return create_response(
            success=True,
            message="Categoría obtenida exitosamente",
            data=category.dict()
        )
    
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error obteniendo categoría por slug {slug}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.put("/{category_id}", response_model=dict)
def update_category(
    category_id: int,
    category_data: ContentCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    📝 Actualizar categoría
    """
    try:
        controller = ContentCategoryController(db)
        category = controller.update_category(category_id, category_data, current_user.id)
        
        logger.info(f"✅ Categoría {category_id} actualizada por usuario {current_user.id}")
        
        return create_response(
            success=True,
            message="Categoría actualizada exitosamente",
            data=category.dict()
        )
    
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error actualizando categoría {category_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.delete("/{category_id}", response_model=dict)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    🗑️ Eliminar categoría
    """
    try:
        controller = ContentCategoryController(db)
        result = controller.delete_category(category_id, current_user.id)
        
        logger.info(f"✅ Categoría {category_id} eliminada por usuario {current_user.id}")
        
        return create_response(
            success=result["success"],
            message=result["message"],
            data={"category_id": category_id}
        )
    
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error eliminando categoría {category_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

# Endpoints para relación departamento-categoría
@router.post("/departments/{department_id}/assign/{category_id}", response_model=dict)
def assign_category_to_department(
    department_id: int,
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    🔗 Asignar categoría a departamento
    """
    try:
        controller = ContentCategoryController(db)
        result = controller.assign_category_to_department(department_id, category_id, current_user.id)
        
        logger.info(f"✅ Categoría {category_id} asignada a departamento {department_id} por usuario {current_user.id}")
        
        return create_response(
            success=result["success"],
            message=result["message"],
            data={
                "department_id": department_id,
                "category_id": category_id,
                "relation_id": result["relation_id"]
            }
        )
    
    except (NotFoundError, ConflictError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error asignando categoría {category_id} a departamento {department_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.delete("/departments/{department_id}/remove/{category_id}", response_model=dict)
def remove_category_from_department(
    department_id: int,
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    ❌ Remover categoría de departamento
    """
    try:
        controller = ContentCategoryController(db)
        result = controller.remove_category_from_department(department_id, category_id, current_user.id)
        
        logger.info(f"✅ Categoría {category_id} removida de departamento {department_id} por usuario {current_user.id}")
        
        return create_response(
            success=result["success"],
            message=result["message"],
            data={
                "department_id": department_id,
                "category_id": category_id
            }
        )
    
    except Exception as e:
        logger.error(f"💥 Error removiendo categoría {category_id} de departamento {department_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.get("/departments/with-categories", response_model=dict)
def get_departments_with_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    🏢 Obtener departamentos con sus categorías
    """
    try:
        controller = ContentCategoryController(db)
        departments = controller.get_departments_with_categories()
        
        return create_response(
            success=True,
            message="Departamentos con categorías obtenidos exitosamente",
            data={
                "departments": [dept.dict() for dept in departments],
                "total": len(departments)
            }
        )
    
    except Exception as e:
        logger.error(f"💥 Error obteniendo departamentos con categorías: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")