# app/api/v1/content/video_types.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.api.deps import get_current_user
from app.models.auth.users import User
from app.controllers.content.video_types_controller import VideoTypesController
from app.schemas.content.video_types import (
    VideoTypeCreate, VideoTypeUpdate, VideoTypeInDB,
    StorageProviderCreate, StorageProviderUpdate, StorageProviderInDB
)
from app.core.exceptions import ValidationError, NotFoundError, ConflictError
from app.utils.response_util import create_response
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# ==================== VIDEO TYPES ====================

@router.post("/video-types/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_video_type(
    type_data: VideoTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    🆕 Crear nuevo tipo de video
    """
    try:
        controller = VideoTypesController(db)
        video_type = controller.create_video_type(type_data, current_user.id)
        
        logger.info(f"✅ Tipo de video creado: {video_type.name} por usuario {current_user.id}")
        
        return create_response(
            success=True,
            message="Tipo de video creado exitosamente",
            data=video_type.dict(),
            status_code=201
        )
    
    except ConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error creando tipo de video: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.get("/video-types/", response_model=dict)
def get_video_types(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    active_only: bool = Query(True),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    📋 Obtener tipos de video
    """
    try:
        controller = VideoTypesController(db)
        
        if search:
            types = controller.search_video_types(query=search, skip=skip, limit=limit)
            message = f"Búsqueda de tipos de video: '{search}'"
        else:
            types = controller.get_video_types(skip=skip, limit=limit, active_only=active_only)
            message = "Tipos de video obtenidos exitosamente"
        
        return create_response(
            success=True,
            message=message,
            data={
                "video_types": [t.dict() for t in types],
                "total": len(types),
                "skip": skip,
                "limit": limit,
                "active_only": active_only,
                "search": search
            }
        )
    
    except Exception as e:
        logger.error(f"💥 Error obteniendo tipos de video: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.get("/video-types/{type_id}", response_model=dict)
def get_video_type_by_id(
    type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    📄 Obtener tipo de video por ID
    """
    try:
        controller = VideoTypesController(db)
        video_type = controller.get_video_type_by_id(type_id)
        
        return create_response(
            success=True,
            message="Tipo de video obtenido exitosamente",
            data=video_type.dict()
        )
    
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error obteniendo tipo de video {type_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.put("/video-types/{type_id}", response_model=dict)
def update_video_type(
    type_id: int,
    type_data: VideoTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    📝 Actualizar tipo de video
    """
    try:
        controller = VideoTypesController(db)
        video_type = controller.update_video_type(type_id, type_data, current_user.id)
        
        return create_response(
            success=True,
            message="Tipo de video actualizado exitosamente",
            data=video_type.dict()
        )
    
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error actualizando tipo de video {type_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.delete("/video-types/{type_id}", response_model=dict)
def delete_video_type(
    type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    🗑️ Eliminar tipo de video
    """
    try:
        controller = VideoTypesController(db)
        result = controller.delete_video_type(type_id, current_user.id)
        
        return create_response(
            success=result["success"],
            message=result["message"],
            data={"type_id": type_id}
        )
    
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error eliminando tipo de video {type_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

# ==================== STORAGE PROVIDERS ====================

@router.post("/storage-providers/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_storage_provider(
    provider_data: StorageProviderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    🆕 Crear nuevo proveedor de almacenamiento
    """
    try:
        controller = VideoTypesController(db)
        provider = controller.create_storage_provider(provider_data, current_user.id)
        
        logger.info(f"✅ Proveedor creado: {provider.name} por usuario {current_user.id}")
        
        return create_response(
            success=True,
            message="Proveedor de almacenamiento creado exitosamente",
            data=provider.dict(),
            status_code=201
        )
    
    except ConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error creando proveedor: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.get("/storage-providers/", response_model=dict)
def get_storage_providers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    active_only: bool = Query(True),
    video_type_id: Optional[int] = Query(None, description="Filtrar por tipo de video"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    📋 Obtener proveedores de almacenamiento
    """
    try:
        controller = VideoTypesController(db)
        
        if video_type_id:
            providers = controller.get_providers_by_video_type(video_type_id)
            message = f"Proveedores del tipo de video {video_type_id}"
        elif search:
            providers = controller.search_storage_providers(query=search, skip=skip, limit=limit)
            message = f"Búsqueda de proveedores: '{search}'"
        else:
            providers = controller.get_storage_providers(skip=skip, limit=limit, active_only=active_only)
            message = "Proveedores obtenidos exitosamente"
        
        return create_response(
            success=True,
            message=message,
            data={
                "storage_providers": [p.dict() for p in providers],
                "total": len(providers),
                "skip": skip,
                "limit": limit,
                "active_only": active_only,
                "video_type_id": video_type_id,
                "search": search
            }
        )
    
    except Exception as e:
        logger.error(f"💥 Error obteniendo proveedores: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.get("/storage-providers/{provider_id}", response_model=dict)
def get_storage_provider_by_id(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    📄 Obtener proveedor por ID
    """
    try:
        controller = VideoTypesController(db)
        provider = controller.get_storage_provider_by_id(provider_id)
        
        return create_response(
            success=True,
            message="Proveedor obtenido exitosamente",
            data=provider.dict()
        )
    
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error obteniendo proveedor {provider_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.put("/storage-providers/{provider_id}", response_model=dict)
def update_storage_provider(
    provider_id: int,
    provider_data: StorageProviderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    📝 Actualizar proveedor
    """
    try:
        controller = VideoTypesController(db)
        provider = controller.update_storage_provider(provider_id, provider_data, current_user.id)
        
        return create_response(
            success=True,
            message="Proveedor actualizado exitosamente",
            data=provider.dict()
        )
    
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error actualizando proveedor {provider_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.delete("/storage-providers/{provider_id}", response_model=dict)
def delete_storage_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    🗑️ Eliminar proveedor
    """
    try:
        controller = VideoTypesController(db)
        result = controller.delete_storage_provider(provider_id, current_user.id)
        
        return create_response(
            success=result["success"],
            message=result["message"],
            data={"provider_id": provider_id}
        )
    
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error eliminando proveedor {provider_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")