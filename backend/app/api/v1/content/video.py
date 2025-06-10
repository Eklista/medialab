# app/api/v1/content/videos.py
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.api.deps import get_current_user
from app.models.auth.users import User
from app.controllers.content.video_controller import VideoController
from app.schemas.content.videos import (
    VideoCreate, VideoUpdate, VideoInDB,
    VideoCreateFromYouTube, VideoCreateFromVimeo, VideoCreateFromUpload,
    VideoBulkCreate, VideoProcessingUpdate
)
from app.core.exceptions import ValidationError, NotFoundError, ConflictError
from app.utils.response_util import create_response
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# ==================== CRUD BÁSICO ====================

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_video(
    video_data: VideoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    🆕 Crear nuevo video
    """
    try:
        controller = VideoController(db)
        video = controller.create_video(video_data, current_user.id)
        
        logger.info(f"✅ Video creado: {video.id} por usuario {current_user.id}")
        
        return create_response(
            success=True,
            message="Video creado exitosamente",
            data=video.dict(),
            status_code=201
        )
    
    except (ConflictError, ValidationError, NotFoundError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error creando video: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.get("/", response_model=dict)
def get_videos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    content_id: Optional[str] = Query(None, description="Filtrar por contenido"),
    video_type_id: Optional[int] = Query(None, description="Filtrar por tipo de video"),
    processing_status: Optional[str] = Query(None, description="Filtrar por estado de procesamiento"),
    storage_provider_id: Optional[int] = Query(None, description="Filtrar por proveedor"),
    search: Optional[str] = Query(None, description="Buscar videos"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    📋 Obtener videos con filtros
    """
    try:
        controller = VideoController(db)
        
        filters = {
            "content_id": content_id,
            "video_type_id": video_type_id,
            "processing_status": processing_status,
            "storage_provider_id": storage_provider_id
        }
        
        if search:
            videos = controller.search_videos(query=search, skip=skip, limit=limit)
            video_list = videos
            total = len(videos)
            message = f"Búsqueda de videos: '{search}'"
        else:
            video_response = controller.get_videos(skip=skip, limit=limit, **filters)
            video_list = video_response.videos
            total = video_response.total
            message = "Videos obtenidos exitosamente"
        
        return create_response(
            success=True,
            message=message,
            data={
                "videos": [video.dict() for video in video_list],
                "total": total,
                "skip": skip,
                "limit": limit,
                "filters": {k: v for k, v in filters.items() if v is not None},
                "search": search
            }
        )
    
    except Exception as e:
        logger.error(f"💥 Error obteniendo videos: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.get("/{video_id}", response_model=dict)
def get_video_by_id(
    video_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    📄 Obtener video por ID
    """
    try:
        controller = VideoController(db)
        video = controller.get_video_by_id(video_id)
        
        return create_response(
            success=True,
            message="Video obtenido exitosamente",
            data=video.dict()
        )
    
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error obteniendo video {video_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.put("/{video_id}", response_model=dict)
def update_video(
    video_id: str,
    video_data: VideoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    📝 Actualizar video
    """
    try:
        controller = VideoController(db)
        video = controller.update_video(video_id, video_data, current_user.id)
        
        return create_response(
            success=True,
            message="Video actualizado exitosamente",
            data=video.dict()
        )
    
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except (ConflictError, ValidationError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error actualizando video {video_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.delete("/{video_id}", response_model=dict)
def delete_video(
    video_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    🗑️ Eliminar video
    """
    try:
        controller = VideoController(db)
        result = controller.delete_video(video_id, current_user.id)
        
        return create_response(
            success=result["success"],
            message=result["message"],
            data={"video_id": video_id}
        )
    
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error eliminando video {video_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

# ==================== CREACIÓN ESPECÍFICA POR PLATAFORMA ====================

@router.post("/from-youtube", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_video_from_youtube(
    youtube_data: VideoCreateFromYouTube,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    🎬 Crear video desde URL de YouTube
    """
    try:
        controller = VideoController(db)
        video = controller.create_video_from_youtube(youtube_data, current_user.id)
        
        logger.info(f"✅ Video de YouTube creado: {video.id}")
        
        return create_response(
            success=True,
            message="Video de YouTube creado exitosamente",
            data=video.dict(),
            status_code=201
        )
    
    except (ValidationError, NotFoundError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error creando video de YouTube: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.post("/from-vimeo", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_video_from_vimeo(
    vimeo_data: VideoCreateFromVimeo,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    🎭 Crear video desde URL de Vimeo
    """
    try:
        controller = VideoController(db)
        video = controller.create_video_from_vimeo(vimeo_data, current_user.id)
        
        logger.info(f"✅ Video de Vimeo creado: {video.id}")
        
        return create_response(
            success=True,
            message="Video de Vimeo creado exitosamente",
            data=video.dict(),
            status_code=201
        )
    
    except (ValidationError, NotFoundError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error creando video de Vimeo: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.post("/upload", response_model=dict, status_code=status.HTTP_201_CREATED)
def upload_video_file(
    file: UploadFile = File(...),
    content_id: str = Query(..., description="ID del contenido"),
    is_main: bool = Query(False, description="Si es video principal"),
    sort_order: int = Query(0, description="Orden de visualización"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    📁 Subir archivo de video
    """
    try:
        # Validar tipo de archivo
        if not file.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="Solo se permiten archivos de video")
        
        # Guardar archivo (implementar lógica de guardado)
        file_path = f"/uploads/videos/{file.filename}"  # Placeholder
        
        # Crear datos de upload
        upload_data = VideoCreateFromUpload(
            content_id=content_id,
            file_path=file_path,
            original_filename=file.filename,
            is_main=is_main,
            sort_order=sort_order
        )
        
        controller = VideoController(db)
        video = controller.create_video_from_upload(upload_data, current_user.id)
        
        logger.info(f"✅ Video subido: {video.id}")
        
        return create_response(
            success=True,
            message="Video subido exitosamente",
            data=video.dict(),
            status_code=201
        )
    
    except (ValidationError, NotFoundError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error subiendo video: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.post("/bulk", response_model=dict, status_code=status.HTTP_201_CREATED)
def bulk_create_videos(
    bulk_data: VideoBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    📦 Crear múltiples videos
    """
    try:
        controller = VideoController(db)
        videos = controller.bulk_create_videos(bulk_data, current_user.id)
        
        logger.info(f"✅ Creación masiva: {len(videos)} videos creados")
        
        return create_response(
            success=True,
            message=f"{len(videos)} videos creados exitosamente",
            data={
                "videos": [video.dict() for video in videos],
                "created_count": len(videos),
                "requested_count": len(bulk_data.videos)
            },
            status_code=201
        )
    
    except Exception as e:
        logger.error(f"💥 Error en creación masiva: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

# ==================== OPERACIONES ESPECÍFICAS ====================

@router.get("/content/{content_id}", response_model=dict)
def get_videos_by_content(
    content_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    📋 Obtener videos de un contenido específico
    """
    try:
        controller = VideoController(db)
        videos = controller.get_videos_by_content(content_id, skip, limit)
        
        return create_response(
            success=True,
            message="Videos del contenido obtenidos exitosamente",
            data={
                "videos": [video.dict() for video in videos],
                "content_id": content_id,
                "total": len(videos),
                "skip": skip,
                "limit": limit
            }
        )
    
    except Exception as e:
        logger.error(f"💥 Error obteniendo videos del contenido {content_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.get("/content/{content_id}/main", response_model=dict)
def get_main_video(
    content_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    ⭐ Obtener video principal de un contenido
    """
    try:
        controller = VideoController(db)
        video = controller.get_main_video(content_id)
        
        if not video:
            return create_response(
                success=True,
                message="No hay video principal para este contenido",
                data={"main_video": None, "content_id": content_id}
            )
        
        return create_response(
            success=True,
            message="Video principal obtenido exitosamente",
            data={"main_video": video.dict(), "content_id": content_id}
        )
    
    except Exception as e:
        logger.error(f"💥 Error obteniendo video principal: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.post("/content/{content_id}/set-main/{video_id}", response_model=dict)
def set_main_video(
    content_id: str,
    video_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    ⭐ Establecer video como principal
    """
    try:
        controller = VideoController(db)
        result = controller.set_main_video(content_id, video_id, current_user.id)
        
        return create_response(
            success=result["success"],
            message=result["message"],
            data={
                "content_id": content_id,
                "video_id": video_id,
                "is_main": True
            }
        )
    
    except (ValidationError, NotFoundError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error estableciendo video principal: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.put("/{video_id}/processing", response_model=dict)
def update_processing_status(
    video_id: str,
    status_data: VideoProcessingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    🔄 Actualizar estado de procesamiento
    """
    try:
        controller = VideoController(db)
        result = controller.update_processing_status(video_id, status_data, current_user.id)
        
        return create_response(
            success=result["success"],
            message=result["message"],
            data={
                "video_id": video_id,
                "processing_status": status_data.processing_status
            }
        )
    
    except (ValidationError, NotFoundError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error actualizando estado de procesamiento: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

# Continuación del archivo app/api/v1/content/videos.py

@router.post("/content/{content_id}/reorder", response_model=dict)
def reorder_videos(
   content_id: str,
   video_orders: List[Dict[str, int]],
   db: Session = Depends(get_db),
   current_user: User = Depends(get_current_user)
):
   """
   🔀 Reordenar videos de un contenido
   
   Body ejemplo:
   [
       {"video_id": "uuid1", "sort_order": 1},
       {"video_id": "uuid2", "sort_order": 2},
       {"video_id": "uuid3", "sort_order": 3}
   ]
   """
   try:
       controller = VideoController(db)
       result = controller.reorder_videos(content_id, video_orders, current_user.id)
       
       return create_response(
           success=result["success"],
           message=result["message"],
           data={
               "content_id": content_id,
               "reordered_count": result["reordered_count"]
           }
       )
   
   except Exception as e:
       logger.error(f"💥 Error reordenando videos: {e}")
       raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

# ==================== ADMINISTRACIÓN Y MONITOREO ====================

@router.get("/admin/stats", response_model=dict)
def get_videos_stats(
   db: Session = Depends(get_db),
   current_user: User = Depends(get_current_user)
):
   """
   📊 Obtener estadísticas de videos (admin)
   """
   try:
       controller = VideoController(db)
       stats = controller.get_videos_stats()
       
       return create_response(
           success=True,
           message="Estadísticas obtenidas exitosamente",
           data=stats["data"]
       )
   
   except Exception as e:
       logger.error(f"💥 Error obteniendo estadísticas: {e}")
       raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.get("/admin/pending-processing", response_model=dict)
def get_pending_processing(
   limit: int = Query(50, ge=1, le=200),
   db: Session = Depends(get_db),
   current_user: User = Depends(get_current_user)
):
   """
   ⏳ Obtener videos pendientes de procesamiento
   """
   try:
       controller = VideoController(db)
       videos = controller.get_pending_processing(limit=limit)
       
       return create_response(
           success=True,
           message="Videos pendientes obtenidos exitosamente",
           data={
               "pending_videos": [video.dict() for video in videos],
               "total": len(videos),
               "limit": limit
           }
       )
   
   except Exception as e:
       logger.error(f"💥 Error obteniendo videos pendientes: {e}")
       raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.get("/admin/failed-processing", response_model=dict)
def get_failed_processing(
   limit: int = Query(50, ge=1, le=200),
   db: Session = Depends(get_db),
   current_user: User = Depends(get_current_user)
):
   """
   ❌ Obtener videos con error en procesamiento
   """
   try:
       controller = VideoController(db)
       videos = controller.get_failed_processing(limit=limit)
       
       return create_response(
           success=True,
           message="Videos fallidos obtenidos exitosamente",
           data={
               "failed_videos": [video.dict() for video in videos],
               "total": len(videos),
               "limit": limit
           }
       )
   
   except Exception as e:
       logger.error(f"💥 Error obteniendo videos fallidos: {e}")
       raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.post("/{video_id}/retry-processing", response_model=dict)
def retry_failed_processing(
   video_id: str,
   db: Session = Depends(get_db),
   current_user: User = Depends(get_current_user)
):
   """
   🔄 Reintentar procesamiento de video fallido
   """
   try:
       controller = VideoController(db)
       result = controller.retry_failed_processing(video_id, current_user.id)
       
       return create_response(
           success=result["success"],
           message=result["message"],
           data={"video_id": video_id}
       )
   
   except (ValidationError, NotFoundError) as e:
       raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
   except Exception as e:
       logger.error(f"💥 Error reintentando procesamiento: {e}")
       raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")