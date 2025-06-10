# app/api/v1/content/photos.py - VERSIÓN FINAL OPTIMIZADA PARA GALLERYPAGE

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
import tempfile
import shutil
import os
import uuid
import time
from pathlib import Path
from PIL import Image

from app.database import get_db
from app.api.deps import get_current_user
from app.models.auth.users import User
from app.controllers.content.photo_controller import PhotoController
from app.schemas.content.photos import PhotoCreate, PhotoUpdate, PhotoInDB
from app.core.exceptions import ValidationError, NotFoundError
from app.utils.response_util import create_response
from app.utils.advanced_image_processor import AdvancedImageProcessor
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# ==================== LO ESENCIAL PARA GALLERYPAGE ====================

@router.get("/gallery/{content_id}", response_model=dict)
def get_gallery(
    content_id: str,
    db: Session = Depends(get_db)
):
    """
    🖼️ PÚBLICO: Obtener galería completa para GalleryPage
    
    Este es el endpoint principal que usa el frontend público
    """
    try:
        controller = PhotoController(db)
        gallery = controller.get_gallery_data(content_id)
        
        return create_response(
            success=True,
            message="Galería obtenida exitosamente",
            data=gallery.dict()
        )
    except Exception as e:
        logger.error(f"💥 Error obteniendo galería {content_id}: {e}")
        return create_response(
            success=False,
            message="Error obteniendo galería",
            data={
                "content_id": content_id,
                "cover_photo": None,
                "featured_photos": [],
                "all_photos": [],
                "total_photos": 0
            }
        )


# REEMPLAZAR COMPLETAMENTE en backend/app/api/v1/content/photos.py

@router.post("/bulk-upload-gallery", response_model=dict, status_code=status.HTTP_202_ACCEPTED)
async def bulk_upload_gallery(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    content_id: str = Query(..., description="ID de la galería"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    📦 SUBIDA MASIVA PARA GALERÍAS
    
    - Sube múltiples fotos a una galería
    - Genera thumbnails automáticamente
    - Convierte a WebP
    - Procesamiento en background
    """
    try:
        if len(files) > 50:  # Límite razonable
            raise HTTPException(status_code=400, detail="Máximo 50 archivos por lote")
        
        # Validar solo imágenes
        valid_files = [f for f in files if f.content_type and f.content_type.startswith('image/')]
        
        if not valid_files:
            raise HTTPException(status_code=400, detail="No se encontraron imágenes válidas")
        
        task_id = f"gallery_{content_id}_{int(time.time())}"
        
        # Procesar en background
        background_tasks.add_task(
            process_gallery_upload,
            task_id=task_id,
            content_id=content_id,
            files=valid_files,
            user_id=current_user.id
        )
        
        return create_response(
            success=True,
            message="Subida iniciada",
            data={
                "task_id": task_id,
                "files_count": len(valid_files),
                "status": "processing"
            },
            status_code=202
        )
    
    except Exception as e:
        logger.error(f"💥 Error subida masiva: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/upload-status/{task_id}", response_model=dict)
def get_upload_status(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """📊 Estado de subida masiva"""
    try:
        from app.models.content.photos import Photo
        
        # Buscar fotos con el task_id
        photos = db.query(Photo).filter(
            Photo.caption.contains(task_id)
        ).all()
        
        return create_response(
            success=True,
            message="Estado obtenido",
            data={
                "task_id": task_id,
                "status": "completed" if photos else "processing",
                "photos_count": len(photos),
                "photos": [
                    {
                        "id": photo.id,
                        "thumbnail_url": photo.thumbnail_url,
                        "photo_url": photo.photo_url
                    } for photo in photos[:10]  # Solo primeras 10 para preview
                ]
            }
        )
    
    except Exception as e:
        logger.error(f"💥 Error estado: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== CRUD SIMPLIFICADO ====================

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_photo(
    photo_data: PhotoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """🆕 Crear foto individual"""
    try:
        controller = PhotoController(db)
        photo = controller.create_photo(photo_data, current_user.id)
        
        return create_response(
            success=True,
            message="Foto creada",
            data=photo.dict(),
            status_code=201
        )
    except Exception as e:
        logger.error(f"💥 Error creando foto: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{photo_id}", response_model=dict)
def update_photo(
    photo_id: str,
    photo_data: PhotoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """📝 Actualizar foto"""
    try:
        controller = PhotoController(db)
        photo = controller.update_photo(photo_id, photo_data, current_user.id)
        
        return create_response(
            success=True,
            message="Foto actualizada",
            data=photo.dict()
        )
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Foto no encontrada")
    except Exception as e:
        logger.error(f"💥 Error actualizando foto: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{photo_id}", response_model=dict)
def delete_photo(
    photo_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """🗑️ Eliminar foto"""
    try:
        controller = PhotoController(db)
        result = controller.delete_photo(photo_id, current_user.id)
        
        return create_response(
            success=result["success"],
            message=result["message"],
            data={"photo_id": photo_id}
        )
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Foto no encontrada")
    except Exception as e:
        logger.error(f"💥 Error eliminando foto: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=dict)
def get_photos_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    content_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """📋 Admin: Obtener fotos para gestión"""
    try:
        controller = PhotoController(db)
        
        if content_id:
            photos = controller.get_photos_by_content(content_id, skip, limit)
            total = len(photos)
        else:
            photo_response = controller.get_photos(skip=skip, limit=limit)
            photos = photo_response.photos
            total = photo_response.total
        
        return create_response(
            success=True,
            message="Fotos obtenidas",
            data={
                "photos": [photo.dict() for photo in photos],
                "total": total,
                "skip": skip,
                "limit": limit
            }
        )
    except Exception as e:
        logger.error(f"💥 Error obteniendo fotos: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== FUNCIÓN DE PROCESAMIENTO ====================

async def process_gallery_upload(
    task_id: str,
    content_id: str,
    files: List[UploadFile],
    user_id: int
):
    """Procesar subida con directorio externo"""
    try:
        logger.info(f"📂 Procesando en: {settings.upload_photos_path}")
        
        processor = AdvancedImageProcessor()  # Ya usa settings.upload_photos_path
        temp_files = []
        created_photos = []
        
        # 1. Guardar archivos temporalmente
        for i, file in enumerate(files):
            try:
                suffix = Path(file.filename).suffix if file.filename else '.jpg'
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
                
                file.file.seek(0)
                shutil.copyfileobj(file.file, temp_file)
                temp_file.close()
                
                temp_files.append(temp_file.name)
                
            except Exception as e:
                logger.error(f"❌ Error archivo temporal {i+1}: {e}")
                continue
        
        # 2. Procesar imágenes
        if temp_files:
            results = await processor.process_bulk_images(temp_files, max_workers=3)
        else:
            results = []
        
        # 3. Crear registros en BD
        from app.database import get_db
        from app.models.content.photos import Photo
        
        db = next(get_db())
        
        for i, result in enumerate(results):
            if not result:
                continue
                
            try:
                photo_id = str(uuid.uuid4())
                
                # 🔥 USAR URLs PÚBLICAS GENERADAS POR EL PROCESSOR
                photo = Photo(
                    id=photo_id,
                    content_id=content_id,
                    photo_url=processor.get_url_for_file(result.get('medium', ''), 'medium'),
                    thumbnail_url=processor.get_url_for_file(result.get('thumbnail', ''), 'thumbnail'),
                    medium_url=processor.get_url_for_file(result.get('medium', ''), 'medium'),
                    original_filename=files[i].filename if i < len(files) else f"photo_{i}.jpg",
                    file_size=files[i].size if i < len(files) else 0,
                    mime_type='image/webp',
                    sort_order=i + 1,
                    caption=f"Galería - {task_id}",
                    is_featured=False,
                    is_cover=(i == 0),
                    created_by_id=user_id
                )
                
                db.add(photo)
                created_photos.append(photo)
                
            except Exception as e:
                logger.error(f"❌ Error creando foto {i+1}: {e}")
                continue
        
        db.commit()
        
        # 4. Limpiar archivos temporales
        processor.cleanup_temp_files(temp_files)
        
        logger.info(f"✅ Galería {task_id} completada: {len(created_photos)} fotos")
        
    except Exception as e:
        logger.error(f"💥 Error procesando galería {task_id}: {e}")