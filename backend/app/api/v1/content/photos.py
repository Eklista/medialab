# app/api/v1/content/photos.py
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.api.deps import get_current_user
from app.models.auth.users import User
from app.controllers.content.photo_controller import PhotoController
from app.schemas.content.photos import (
    PhotoCreate, PhotoUpdate, PhotoInDB,
    PhotoCreateFromUpload, PhotoCreateFromUrl, PhotoBulkCreate, PhotoBulkUpload
)
from app.core.exceptions import ValidationError, NotFoundError, ConflictError
from app.utils.response_util import create_response
from app.utils.image_utils import validate_image_file
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# ==================== CRUD BÁSICO ====================

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_photo(
    photo_data: PhotoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    🆕 Crear nueva foto
    """
    try:
        controller = PhotoController(db)
        photo = controller.create_photo(photo_data, current_user.id)
        
        logger.info(f"✅ Foto creada: {photo.id} por usuario {current_user.id}")
        
        return create_response(
            success=True,
            message="Foto creada exitosamente",
            data=photo.dict(),
            status_code=201
        )
    
    except (ConflictError, ValidationError, NotFoundError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error creando foto: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.get("/", response_model=dict)
def get_photos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    content_id: Optional[str] = Query(None, description="Filtrar por contenido"),
    featured_only: bool = Query(False, description="Solo fotos destacadas"),
    search: Optional[str] = Query(None, description="Buscar fotos"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    📋 Obtener fotos con filtros
    """
    try:
        controller = PhotoController(db)
        
        filters = {
            "content_id": content_id,
            "featured_only": featured_only,
            "featured_content_id": content_id if featured_only else None
        }
        
        if search:
            photos = controller.search_photos(query=search, skip=skip, limit=limit)
            photo_list = photos
            total = len(photos)
            message = f"Búsqueda de fotos: '{search}'"
        else:
            photo_response = controller.get_photos(skip=skip, limit=limit, **filters)
            photo_list = photo_response.photos
            total = photo_response.total
            message = "Fotos obtenidas exitosamente"
        
        return create_response(
            success=True,
            message=message,
            data={
                "photos": [photo.dict() for photo in photo_list],
                "total": total,
                "skip": skip,
                "limit": limit,
                "filters": {k: v for k, v in filters.items() if v is not None},
                "search": search
            }
        )
    
    except Exception as e:
        logger.error(f"💥 Error obteniendo fotos: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.get("/{photo_id}", response_model=dict)
def get_photo_by_id(
    photo_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    📄 Obtener foto por ID
    """
    try:
        controller = PhotoController(db)
        photo = controller.get_photo_by_id(photo_id)
        
        return create_response(
            success=True,
            message="Foto obtenida exitosamente",
            data=photo.dict()
        )
    
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error obteniendo foto {photo_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.put("/{photo_id}", response_model=dict)
def update_photo(
    photo_id: str,
    photo_data: PhotoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    📝 Actualizar foto
    """
    try:
        controller = PhotoController(db)
        photo = controller.update_photo(photo_id, photo_data, current_user.id)
        
        return create_response(
            success=True,
            message="Foto actualizada exitosamente",
            data=photo.dict()
        )
    
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except (ConflictError, ValidationError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error actualizando foto {photo_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.delete("/{photo_id}", response_model=dict)
def delete_photo(
    photo_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    🗑️ Eliminar foto
    """
    try:
        controller = PhotoController(db)
        result = controller.delete_photo(photo_id, current_user.id)
        
        return create_response(
            success=result["success"],
            message=result["message"],
            data={"photo_id": photo_id}
        )
    
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error eliminando foto {photo_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

# ==================== SUBIDA DE ARCHIVOS ====================

@router.post("/upload", response_model=dict, status_code=status.HTTP_201_CREATED)
def upload_photo(
    file: UploadFile = File(...),
    content_id: str = Query(..., description="ID del contenido"),
    caption: Optional[str] = Query(None, description="Descripción de la foto"),
    alt_text: Optional[str] = Query(None, description="Texto alternativo"),
    is_featured: bool = Query(False, description="Si es foto destacada"),
    is_cover: bool = Query(False, description="Si es foto de portada"),
    sort_order: int = Query(0, description="Orden de visualización"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    📁 Subir archivo de foto
    """
    try:
        # Validar tipo de archivo
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Solo se permiten archivos de imagen")
        
        # Guardar archivo (implementar lógica de guardado)
        file_path = f"/uploads/photos/{file.filename}"  # Placeholder
        
        # Validar imagen
        validation = validate_image_file(file_path)
        if not validation["is_valid"]:
            raise HTTPException(status_code=400, detail=f"Imagen inválida: {', '.join(validation['errors'])}")
        
        # Crear datos de upload
        upload_data = PhotoCreateFromUpload(
            content_id=content_id,
            file_path=file_path,
            original_filename=file.filename,
            caption=caption,
            alt_text=alt_text,
            is_featured=is_featured,
            is_cover=is_cover,
            sort_order=sort_order
        )
        
        controller = PhotoController(db)
        photo = controller.create_photo_from_upload(upload_data, current_user.id)
        
        logger.info(f"✅ Foto subida: {photo.id}")
        
        return create_response(
            success=True,
            message="Foto subida exitosamente",
            data=photo.dict(),
            status_code=201
        )
    
    except (ValidationError, NotFoundError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"💥 Error subiendo foto: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.post("/from-url", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_photo_from_url(
    url_data: PhotoCreateFromUrl,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    🌐 Crear foto desde URL externa
    """
    try:
        controller = PhotoController(db)
        photo = controller.create_photo_from_url(url_data, current_user.id)
       
       logger.info(f"✅ Foto creada desde URL: {photo.id}")
       
       return create_response(
           success=True,
           message="Foto creada desde URL exitosamente",
           data=photo.dict(),
           status_code=201
       )
   
   except (ValidationError, NotFoundError) as e:
       raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
   except Exception as e:
       logger.error(f"💥 Error creando foto desde URL: {e}")
       raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.post("/bulk", response_model=dict, status_code=status.HTTP_201_CREATED)
def bulk_create_photos(
   bulk_data: PhotoBulkCreate,
   db: Session = Depends(get_db),
   current_user: User = Depends(get_current_user)
):
   """
   📦 Crear múltiples fotos
   """
   try:
       controller = PhotoController(db)
       photos = controller.bulk_create_photos(bulk_data, current_user.id)
       
       logger.info(f"✅ Creación masiva: {len(photos)} fotos creadas")
       
       return create_response(
           success=True,
           message=f"{len(photos)} fotos creadas exitosamente",
           data={
               "photos": [photo.dict() for photo in photos],
               "created_count": len(photos),
               "requested_count": len(bulk_data.photos)
           },
           status_code=201
       )
   
   except Exception as e:
       logger.error(f"💥 Error en creación masiva: {e}")
       raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.post("/bulk-upload", response_model=dict, status_code=status.HTTP_201_CREATED)
def bulk_upload_photos(
   files: List[UploadFile] = File(...),
   content_id: str = Query(..., description="ID del contenido"),
   db: Session = Depends(get_db),
   current_user: User = Depends(get_current_user)
):
   """
   📦 Subida masiva de fotos
   """
   try:
       # Validar archivos
       for file in files:
           if not file.content_type.startswith('image/'):
               raise HTTPException(status_code=400, detail=f"Solo imágenes: {file.filename}")
       
       # Guardar archivos (placeholder)
       file_paths = [f"/uploads/photos/{file.filename}" for file in files]
       
       # Crear datos de upload masivo
       upload_data = PhotoBulkUpload(
           content_id=content_id,
           file_paths=file_paths
       )
       
       controller = PhotoController(db)
       photos = controller.bulk_upload_photos(upload_data, current_user.id)
       
       logger.info(f"✅ Subida masiva: {len(photos)} fotos subidas")
       
       return create_response(
           success=True,
           message=f"{len(photos)} fotos subidas exitosamente",
           data={
               "photos": [photo.dict() for photo in photos],
               "uploaded_count": len(photos),
               "total_files": len(files)
           },
           status_code=201
       )
   
   except Exception as e:
       logger.error(f"💥 Error en subida masiva: {e}")
       raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

# ==================== OPERACIONES ESPECÍFICAS ====================

@router.get("/content/{content_id}", response_model=dict)
def get_photos_by_content(
   content_id: str,
   skip: int = Query(0, ge=0),
   limit: int = Query(100, ge=1, le=500),
   db: Session = Depends(get_db),
   current_user: User = Depends(get_current_user)
):
   """
   📋 Obtener fotos de un contenido específico
   """
   try:
       controller = PhotoController(db)
       photos = controller.get_photos_by_content(content_id, skip, limit)
       
       return create_response(
           success=True,
           message="Fotos del contenido obtenidas exitosamente",
           data={
               "photos": [photo.dict() for photo in photos],
               "content_id": content_id,
               "total": len(photos),
               "skip": skip,
               "limit": limit
           }
       )
   
   except Exception as e:
       logger.error(f"💥 Error obteniendo fotos del contenido {content_id}: {e}")
       raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.get("/content/{content_id}/gallery", response_model=dict)
def get_gallery_data(
   content_id: str,
   db: Session = Depends(get_db),
   current_user: User = Depends(get_current_user)
):
   """
   🖼️ Obtener datos completos de galería
   """
   try:
       controller = PhotoController(db)
       gallery = controller.get_gallery_data(content_id)
       
       return create_response(
           success=True,
           message="Datos de galería obtenidos exitosamente",
           data=gallery.dict()
       )
   
   except Exception as e:
       logger.error(f"💥 Error obteniendo galería {content_id}: {e}")
       raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.post("/content/{content_id}/set-cover/{photo_id}", response_model=dict)
def set_cover_photo(
   content_id: str,
   photo_id: str,
   db: Session = Depends(get_db),
   current_user: User = Depends(get_current_user)
):
   """
   🖼️ Establecer foto como portada
   """
   try:
       controller = PhotoController(db)
       result = controller.set_cover_photo(content_id, photo_id, current_user.id)
       
       return create_response(
           success=result["success"],
           message=result["message"],
           data={
               "content_id": content_id,
               "photo_id": photo_id,
               "is_cover": True
           }
       )
   
   except (ValidationError, NotFoundError) as e:
       raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
   except Exception as e:
       logger.error(f"💥 Error estableciendo foto de portada: {e}")
       raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.post("/{photo_id}/toggle-featured", response_model=dict)
def toggle_featured_photo(
   photo_id: str,
   db: Session = Depends(get_db),
   current_user: User = Depends(get_current_user)
):
   """
   ⭐ Alternar estado destacado de foto
   """
   try:
       controller = PhotoController(db)
       result = controller.toggle_featured(photo_id, current_user.id)
       
       return create_response(
           success=result["success"],
           message=result["message"],
           data={"photo_id": photo_id}
       )
   
   except (ValidationError, NotFoundError) as e:
       raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
   except Exception as e:
       logger.error(f"💥 Error alternando estado destacado: {e}")
       raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.post("/content/{content_id}/reorder", response_model=dict)
def reorder_photos(
   content_id: str,
   photo_orders: List[Dict[str, int]],
   db: Session = Depends(get_db),
   current_user: User = Depends(get_current_user)
):
   """
   🔀 Reordenar fotos de un contenido
   
   Body ejemplo:
   [
       {"photo_id": "uuid1", "sort_order": 1},
       {"photo_id": "uuid2", "sort_order": 2},
       {"photo_id": "uuid3", "sort_order": 3}
   ]
   """
   try:
       controller = PhotoController(db)
       result = controller.reorder_photos(content_id, photo_orders, current_user.id)
       
       return create_response(
           success=result["success"],
           message=result["message"],
           data={
               "content_id": content_id,
               "reordered_count": result["reordered_count"]
           }
       )
   
   except Exception as e:
       logger.error(f"💥 Error reordenando fotos: {e}")
       raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

# ==================== ADMINISTRACIÓN ====================

@router.get("/admin/stats", response_model=dict)
def get_photos_stats(
   db: Session = Depends(get_db),
   current_user: User = Depends(get_current_user)
):
   """
   📊 Obtener estadísticas de fotos (admin)
   """
   try:
       controller = PhotoController(db)
       stats = controller.get_photos_stats()
       
       return create_response(
           success=True,
           message="Estadísticas obtenidas exitosamente",
           data=stats["data"]
       )
   
   except Exception as e:
       logger.error(f"💥 Error obteniendo estadísticas: {e}")
       raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.post("/admin/cleanup-orphaned", response_model=dict)
def cleanup_orphaned_photos(
   days_old: int = Query(30, ge=1, description="Días de antigüedad mínima"),
   db: Session = Depends(get_db),
   current_user: User = Depends(get_current_user)
):
   """
   🧹 Limpiar fotos huérfanas
   """
   try:
       controller = PhotoController(db)
       result = controller.cleanup_orphaned_photos(days_old, current_user.id)
       
       return create_response(
           success=True,
           message=result["message"],
           data={
               "cleaned_count": result["cleaned_count"],
               "days_old": result["days_old"]
           }
       )
   
   except Exception as e:
       logger.error(f"💥 Error limpiando fotos huérfanas: {e}")
       raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")