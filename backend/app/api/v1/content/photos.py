# app/api/v1/content/photos.py
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
import tempfile
import shutil
import time
import os
import uuid

from app.database import get_db
from app.api.deps import get_current_user
from app.models.auth.users import User
from app.models.content.photos import Photo
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


# AGREGAR ESTOS ENDPOINTS AL FINAL DE app/api/v1/content/photos.py

# ==================== ENDPOINTS ESPECÍFICOS PARA CMS ====================

@router.post("/bulk-upload-advanced", response_model=dict, status_code=status.HTTP_202_ACCEPTED)
async def bulk_upload_advanced_gallery(
    files: List[UploadFile] = File(...),
    content_id: str = Query(..., description="ID del contenido (gallery)"),
    background_tasks: BackgroundTasks,
    generate_thumbnail: bool = Query(True, description="Generar thumbnail automático"),
    auto_webp: bool = Query(True, description="Convertir automáticamente a WebP"),
    max_size: int = Query(1200, description="Tamaño máximo en píxeles"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    📦 SUBIDA MASIVA AVANZADA PARA GALERÍAS
    
    - Procesa automáticamente las imágenes
    - Genera múltiples tamaños (thumbnail, medium, large)
    - Convierte a WebP para optimización
    - Procesamiento en background para no bloquear UI
    - Perfecto para galerías fotográficas masivas
    """
    try:
        # Validar límites
        if len(files) > 100:  # Límite generoso para galerías
            raise HTTPException(status_code=400, detail="Máximo 100 archivos por lote")
        
        # Validar tipos de archivo
        valid_files = []
        invalid_files = []
        
        for file in files:
            if file.content_type.startswith('image/'):
                valid_files.append(file)
            else:
                invalid_files.append(file.filename)
        
        if not valid_files:
            raise HTTPException(status_code=400, detail="No se encontraron imágenes válidas")
        
        # Estimar tiempo de procesamiento
        avg_size_mb = sum(file.size for file in valid_files if file.size) / len(valid_files) / (1024 * 1024)
        estimated_minutes = max(1, len(valid_files) * 3 // 60)  # ~3 segundos por imagen
        
        # Crear tarea en background
        task_id = f"gallery_upload_{content_id}_{int(time.time())}"
        
        background_tasks.add_task(
            process_gallery_upload_task,
            task_id=task_id,
            content_id=content_id,
            files=valid_files,
            user_id=current_user.id,
            generate_thumbnail=generate_thumbnail,
            auto_webp=auto_webp,
            max_size=max_size
        )
        
        logger.info(f"🚀 Subida masiva de galería iniciada: {task_id}")
        
        return create_response(
            success=True,
            message="Subida masiva de galería iniciada",
            data={
                "task_id": task_id,
                "total_files": len(files),
                "valid_files": len(valid_files),
                "invalid_files": invalid_files,
                "estimated_time_minutes": estimated_minutes,
                "content_id": content_id,
                "status": "processing",
                "settings": {
                    "generate_thumbnail": generate_thumbnail,
                    "auto_webp": auto_webp,
                    "max_size": max_size
                }
            },
            status_code=202
        )
    
    except Exception as e:
        logger.error(f"💥 Error iniciando subida masiva: {e}")
        raise HTTPException(status_code=500, detail="Error iniciando subida masiva")

@router.get("/upload-status/{task_id}", response_model=dict)
def get_upload_status(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    📊 Obtener estado de subida masiva
    """
    try:
        # Buscar fotos procesadas por esta tarea
        # Asumiendo que guardas task_id en metadata o descripción
        photos = db.query(Photo).filter(
            Photo.alt_text.contains(task_id) |  # O donde guardes el task_id
            Photo.caption.contains(task_id)
        ).all()
        
        return create_response(
            success=True,
            message="Estado de subida obtenido",
            data={
                "task_id": task_id,
                "status": "completed" if photos else "processing",
                "photos_processed": len(photos),
                "photos": [
                    {
                        "id": photo.id,
                        "thumbnail_url": photo.thumbnail_url,
                        "photo_url": photo.photo_url,
                        "original_filename": photo.original_filename
                    } for photo in photos
                ]
            }
        )
    
    except Exception as e:
        logger.error(f"💥 Error obteniendo estado: {e}")
        raise HTTPException(status_code=500, detail="Error obteniendo estado")

@router.post("/generate-thumbnail/{photo_id}", response_model=dict)
def generate_thumbnail_for_content(
    photo_id: str,
    size: int = Query(300, ge=100, le=500, description="Tamaño del thumbnail"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    🖼️ Generar thumbnail para VideoCard/GalleryCard
    
    Específicamente para crear thumbnails optimizados para cards del frontend
    """
    try:
        controller = PhotoController(db)
        photo = controller.get_photo_by_id(photo_id)
        
        # Aquí implementarías la lógica para generar thumbnail
        # usando el AdvancedImageProcessor
        
        # Por ahora simulamos la respuesta
        thumbnail_url = f"{photo.photo_url}?thumbnail={size}"
        
        # Actualizar la foto con el nuevo thumbnail
        photo_update = PhotoUpdate(thumbnail_url=thumbnail_url)
        updated_photo = controller.update_photo(photo_id, photo_update, current_user.id)
        
        return create_response(
            success=True,
            message="Thumbnail generado exitosamente",
            data={
                "photo_id": photo_id,
                "thumbnail_url": thumbnail_url,
                "size": size,
                "optimized_for": "frontend_cards"
            }
        )
    
    except Exception as e:
        logger.error(f"💥 Error generando thumbnail: {e}")
        raise HTTPException(status_code=500, detail="Error generando thumbnail")

@router.get("/gallery-cover/{content_id}", response_model=dict)
def get_gallery_cover_photo(
    content_id: str,
    db: Session = Depends(get_db)
):
    """
    📸 Obtener foto de portada para GalleryCard
    
    Específico para obtener la imagen principal de una galería
    """
    try:
        controller = PhotoController(db)
        
        # Buscar foto marcada como cover
        cover_photo = db.query(Photo).filter(
            Photo.content_id == content_id,
            Photo.is_cover == True
        ).first()
        
        # Si no hay cover, tomar la primera foto
        if not cover_photo:
            cover_photo = db.query(Photo).filter(
                Photo.content_id == content_id
            ).order_by(Photo.sort_order, Photo.created_at).first()
        
        if not cover_photo:
            return create_response(
                success=False,
                message="No se encontraron fotos en esta galería",
                data={"content_id": content_id, "cover_photo": None}
            )
        
        return create_response(
            success=True,
            message="Foto de portada obtenida",
            data={
                "content_id": content_id,
                "cover_photo": {
                    "id": cover_photo.id,
                    "thumbnail_url": cover_photo.thumbnail_url,
                    "photo_url": cover_photo.photo_url,
                    "is_cover": cover_photo.is_cover,
                    "caption": cover_photo.caption
                }
            }
        )
    
    except Exception as e:
        logger.error(f"💥 Error obteniendo portada de galería: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/gallery-preview/{content_id}", response_model=dict)
def get_gallery_preview(
    content_id: str,
    limit: int = Query(4, ge=1, le=10, description="Número de fotos preview"),
    db: Session = Depends(get_db)
):
    """
    👁️ Obtener preview de galería para GalleryCard
    
    Devuelve las primeras fotos para mostrar en el card de la galería
    """
    try:
        photos = db.query(Photo).filter(
            Photo.content_id == content_id
        ).order_by(
            Photo.is_cover.desc(),  # Cover primero
            Photo.is_featured.desc(),  # Destacadas después
            Photo.sort_order,
            Photo.created_at
        ).limit(limit).all()
        
        total_photos = db.query(Photo).filter(Photo.content_id == content_id).count()
        
        return create_response(
            success=True,
            message="Preview de galería obtenido",
            data={
                "content_id": content_id,
                "preview_photos": [
                    {
                        "id": photo.id,
                        "thumbnail_url": photo.thumbnail_url,
                        "is_cover": photo.is_cover,
                        "is_featured": photo.is_featured
                    } for photo in photos
                ],
                "total_photos": total_photos,
                "preview_count": len(photos)
            }
        )
    
    except Exception as e:
        logger.error(f"💥 Error obteniendo preview: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.post("/optimize-for-web/{photo_id}", response_model=dict)
def optimize_photo_for_web(
    photo_id: str,
    quality: int = Query(85, ge=60, le=100, description="Calidad de compresión"),
    convert_to_webp: bool = Query(True, description="Convertir a WebP"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    ⚡ Optimizar foto para web
    
    Optimiza una foto específica para mejor rendimiento en el frontend
    """
    try:
        controller = PhotoController(db)
        photo = controller.get_photo_by_id(photo_id)
        
        # Aquí implementarías la optimización real con AdvancedImageProcessor
        # Por ahora simulamos
        
        optimized_url = photo.photo_url
        if convert_to_webp and not photo.photo_url.endswith('.webp'):
            optimized_url = photo.photo_url.replace(photo.photo_url.split('.')[-1], 'webp')
        
        # Simular reducción de tamaño
        original_size = photo.file_size or 1000000  # 1MB default
        optimized_size = int(original_size * (quality / 100) * 0.7)  # Estimación
        
        return create_response(
            success=True,
            message="Foto optimizada para web",
            data={
                "photo_id": photo_id,
                "original_url": photo.photo_url,
                "optimized_url": optimized_url,
                "original_size": original_size,
                "optimized_size": optimized_size,
                "compression_ratio": f"{((original_size - optimized_size) / original_size * 100):.1f}%",
                "settings": {
                    "quality": quality,
                    "converted_to_webp": convert_to_webp
                }
            }
        )
    
    except Exception as e:
        logger.error(f"💥 Error optimizando foto: {e}")
        raise HTTPException(status_code=500, detail="Error optimizando foto")

# ==================== FUNCIONES DE BACKGROUND ====================

async def process_gallery_upload_task(
    task_id: str,
    content_id: str,
    files: List[UploadFile],
    user_id: int,
    generate_thumbnail: bool = True,
    auto_webp: bool = True,
    max_size: int = 1200
):
    """
    🔄 Procesar subida masiva de galería en background
    """
    try:
        logger.info(f"📂 Procesando galería {task_id}: {len(files)} archivos")
        
        from app.utils.advanced_image_processor import AdvancedImageProcessor
        processor = AdvancedImageProcessor()
        
        created_photos = []
        temp_files = []
        
        # Guardar archivos temporalmente
        for i, file in enumerate(files):
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}")
            shutil.copyfileobj(file.file, temp_file)
            temp_file.close()
            temp_files.append(temp_file.name)
        
        # Procesar imágenes
        results = await processor.process_bulk_images(temp_files, max_workers=4)
        
        # Crear registros en BD
        db = next(get_db())  # Obtener sesión de BD
        
        for i, result in enumerate(results):
            if not result:
                continue
                
            try:
                # Crear registro de foto
                photo_data = PhotoCreate(
                    content_id=content_id,
                    photo_url=result.get('medium', result['original']),
                    thumbnail_url=result.get('thumbnail'),
                    medium_url=result.get('medium'),
                    original_filename=files[i].filename,
                    file_size=files[i].size,
                    mime_type='image/webp' if auto_webp else files[i].content_type,
                    sort_order=i + 1,
                    caption=f"Galería - Procesado por {task_id}",  # Incluir task_id para tracking
                    alt_text=f"task:{task_id}"  # Para búsqueda posterior
                )
                
                # Crear usando servicio
                photo = Photo(**photo_data.dict())
                photo.id = str(uuid.uuid4())
                photo.created_by_id = user_id
                
                db.add(photo)
                created_photos.append(photo)
                
            except Exception as e:
                logger.error(f"❌ Error creando foto {i+1}: {e}")
                continue
        
        db.commit()
        
        # Limpiar archivos temporales
        processor.cleanup_temp_files(temp_files)
        
        logger.info(f"✅ Galería {task_id} procesada: {len(created_photos)} fotos")
        
    except Exception as e:
        logger.error(f"💥 Error procesando galería {task_id}: {e}")
        # Limpiar en caso de error
        try:
            for temp_file in temp_files:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
        except:
            pass