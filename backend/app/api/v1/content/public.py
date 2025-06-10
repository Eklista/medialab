# app/api/v1/content/public.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.controllers.content.category_controller import ContentCategoryController
from app.schemas.content.categories import ContentCategoryPublic, DepartmentWithCategories
from app.utils.response_util import create_response
import logging

logger = logging.getLogger(__name__)

# Si es un archivo nuevo:
router = APIRouter()

# Si agregas al public.py existente, simplemente agrega estos endpoints:

@router.get("/content/categories", response_model=dict)
def get_public_categories(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=500, description="Número máximo de registros a retornar"),
    search: Optional[str] = Query(None, description="Buscar por nombre"),
    db: Session = Depends(get_db)
):
    """
    📋 PÚBLICO: Obtener categorías de contenido (sin autenticación)
    
    Endpoint público para obtener las categorías disponibles.
    Usado por el frontend para mostrar filtros y navegación.
    """
    try:
        controller = ContentCategoryController(db)
        
        if search:
            # Para búsqueda pública, usar el método de búsqueda
            all_categories = controller.search_categories(query=search, skip=skip, limit=limit)
            # Convertir a formato público
            categories = [ContentCategoryPublic.from_orm(cat) for cat in all_categories]
            message = f"Búsqueda de categorías: '{search}'"
        else:
            categories = controller.get_public_categories(skip=skip, limit=limit)
            message = "Categorías públicas obtenidas exitosamente"
        
        logger.info(f"📋 [PUBLIC] Categorías solicitadas: {len(categories)} resultados")
        
        return create_response(
            success=True,
            message=message,
            data={
                "categories": [cat.dict() for cat in categories],
                "total": len(categories),
                "skip": skip,
                "limit": limit,
                "search": search,
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            }
        )
    
    except Exception as e:
        logger.error(f"💥 [PUBLIC] Error obteniendo categorías: {e}")
        return create_response(
            success=False,
            message="Error obteniendo categorías",
            data={
                "categories": [],
                "total": 0,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            }
        )

@router.get("/content/categories/{slug}", response_model=dict)
def get_public_category_by_slug(
    slug: str,
    db: Session = Depends(get_db)
):
    """
    🔗 PÚBLICO: Obtener categoría por slug (sin autenticación)
    
    Endpoint público para obtener información de una categoría específica.
    """
    try:
        controller = ContentCategoryController(db)
        category = controller.get_category_by_slug(slug)
        
        # Convertir a formato público
        public_category = ContentCategoryPublic.from_orm(category)
        
        logger.info(f"🔗 [PUBLIC] Categoría solicitada: {slug}")
        
        return create_response(
            success=True,
            message="Categoría obtenida exitosamente",
            data={
                "category": public_category.dict(),
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            }
        )
    
    except Exception as e:
        logger.warning(f"⚠️ [PUBLIC] Categoría no encontrada: {slug}")
        return create_response(
            success=False,
            message=f"Categoría '{slug}' no encontrada",
            data={
                "category": None,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            },
            status_code=404
        )

@router.get("/content/departments-categories", response_model=dict)
def get_public_departments_with_categories(
    db: Session = Depends(get_db)
):
    """
    🏢 PÚBLICO: Obtener departamentos con sus categorías (sin autenticación)
    
    Endpoint público para obtener la estructura de departamentos y sus categorías.
    Usado para navegación y filtros en el frontend.
    """
    try:
        controller = ContentCategoryController(db)
        departments = controller.get_departments_with_categories()
        
        logger.info(f"🏢 [PUBLIC] Departamentos con categorías: {len(departments)} departamentos")
        
        return create_response(
            success=True,
            message="Departamentos con categorías obtenidos exitosamente",
            data={
                "departments": [dept.dict() for dept in departments],
                "total_departments": len(departments),
                "total_categories": sum(len(dept.categories) for dept in departments),
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            }
        )
    
    except Exception as e:
        logger.error(f"💥 [PUBLIC] Error obteniendo departamentos con categorías: {e}")
        return create_response(
            success=False,
            message="Error obteniendo departamentos",
            data={
                "departments": [],
                "total_departments": 0,
                "total_categories": 0,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            }
        )

@router.get("/content/video-types", response_model=dict)
def get_public_video_types(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """
    🎬 PÚBLICO: Obtener tipos de video disponibles (sin autenticación)
    """
    try:
        from app.controllers.content.video_types_controller import VideoTypesController
        from datetime import datetime
        
        controller = VideoTypesController(db)
        types = controller.get_public_video_types(skip=skip, limit=limit)
        
        logger.info(f"🎬 [PUBLIC] Tipos de video solicitados: {len(types)} resultados")
        
        return create_response(
            success=True,
            message="Tipos de video públicos obtenidos exitosamente",
            data={
                "video_types": [t.dict() for t in types],
                "total": len(types),
                "skip": skip,
                "limit": limit,
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            }
        )
    
    except Exception as e:
        logger.error(f"💥 [PUBLIC] Error obteniendo tipos de video: {e}")
        return create_response(
            success=False,
            message="Error obteniendo tipos de video",
            data={
                "video_types": [],
                "total": 0,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            }
        )

@router.get("/content/storage-providers", response_model=dict)
def get_public_storage_providers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    video_type_id: Optional[int] = Query(None, description="Filtrar por tipo de video"),
    db: Session = Depends(get_db)
):
    """
    🏪 PÚBLICO: Obtener proveedores de almacenamiento (sin autenticación)
    """
    try:
        from app.controllers.content.video_types_controller import VideoTypesController
        from datetime import datetime
        
        controller = VideoTypesController(db)
        
        if video_type_id:
            providers = controller.get_providers_by_video_type(video_type_id)
            # Convertir a formato público
            public_providers = [StorageProviderPublic.from_orm(p) for p in providers]
            message = f"Proveedores del tipo de video {video_type_id}"
        else:
            providers = controller.get_public_storage_providers(skip=skip, limit=limit)
            public_providers = providers
            message = "Proveedores públicos obtenidos exitosamente"
        
        logger.info(f"🏪 [PUBLIC] Proveedores solicitados: {len(public_providers)} resultados")
        
        return create_response(
            success=True,
            message=message,
            data={
                "storage_providers": [p.dict() for p in public_providers],
                "total": len(public_providers),
                "skip": skip,
                "limit": limit,
                "video_type_id": video_type_id,
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            }
        )
    
    except Exception as e:
        logger.error(f"💥 [PUBLIC] Error obteniendo proveedores: {e}")
        return create_response(
            success=False,
            message="Error obteniendo proveedores",
            data={
                "storage_providers": [],
                "total": 0,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            }
        )

# Agregar al app/api/v1/system/public.py existente:

@router.get("/content/videos", response_model=dict)
def get_public_videos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    content_id: Optional[str] = Query(None, description="Filtrar por contenido"),
    video_type_id: Optional[int] = Query(None, description="Filtrar por tipo de video"),
    db: Session = Depends(get_db)
):
    """
    🎬 PÚBLICO: Obtener videos (sin autenticación)
    
    Endpoint público para obtener videos del contenido multimedia.
    Usado por el frontend para mostrar videos sin requerir login.
    """
    try:
        from app.controllers.content.video_controller import VideoController
        from datetime import datetime
        
        controller = VideoController(db)
        
        filters = {
            "content_id": content_id,
            "video_type_id": video_type_id,
            "processing_status": "completed"  # Solo videos procesados en público
        }
        
        videos = controller.get_public_videos(skip=skip, limit=limit, **filters)
        
        logger.info(f"🎬 [PUBLIC] Videos solicitados: {len(videos)} resultados")
        
        return create_response(
            success=True,
            message="Videos públicos obtenidos exitosamente",
            data={
                "videos": [video.dict() for video in videos],
                "total": len(videos),
                "skip": skip,
                "limit": limit,
                "filters": {k: v for k, v in filters.items() if v is not None},
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            }
        )
    
    except Exception as e:
        logger.error(f"💥 [PUBLIC] Error obteniendo videos: {e}")
        return create_response(
            success=False,
            message="Error obteniendo videos",
            data={
                "videos": [],
                "total": 0,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            }
        )

@router.get("/content/videos/{video_id}", response_model=dict)
def get_public_video_by_id(
    video_id: str,
    db: Session = Depends(get_db)
):
    """
    📄 PÚBLICO: Obtener video por ID (sin autenticación)
    """
    try:
        from app.controllers.content.video_controller import VideoController
        from datetime import datetime
        
        controller = VideoController(db)
        video = controller.get_public_video_by_id(video_id)
        
        logger.info(f"📄 [PUBLIC] Video solicitado: {video_id}")
        
        return create_response(
            success=True,
            message="Video obtenido exitosamente",
            data={
                "video": video.dict(),
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            }
        )
    
    except Exception as e:
        logger.warning(f"⚠️ [PUBLIC] Video no encontrado: {video_id}")
        return create_response(
            success=False,
            message=f"Video '{video_id}' no encontrado",
            data={
                "video": None,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            },
            status_code=404
        )

@router.get("/content/{content_id}/videos", response_model=dict)
def get_public_videos_by_content(
    content_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """
    📋 PÚBLICO: Obtener videos de un contenido específico (sin autenticación)
    
    Usado para mostrar videos de graduaciones, conferencias, etc.
    """
    try:
        from app.controllers.content.video_controller import VideoController
        from datetime import datetime
        
        controller = VideoController(db)
        videos = controller.get_public_videos(
            skip=skip, 
            limit=limit, 
            content_id=content_id,
            processing_status="completed"
        )
        
        logger.info(f"📋 [PUBLIC] Videos del contenido {content_id}: {len(videos)} resultados")
        
        return create_response(
            success=True,
            message="Videos del contenido obtenidos exitosamente",
            data={
                "videos": [video.dict() for video in videos],
                "content_id": content_id,
                "total": len(videos),
                "skip": skip,
                "limit": limit,
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            }
        )
    
    except Exception as e:
        logger.error(f"💥 [PUBLIC] Error obteniendo videos del contenido {content_id}: {e}")
        return create_response(
            success=False,
            message="Error obteniendo videos del contenido",
            data={
                "videos": [],
                "content_id": content_id,
                "total": 0,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            }
        )

@router.get("/content/{content_id}/main-video", response_model=dict)
def get_public_main_video(
    content_id: str,
    db: Session = Depends(get_db)
):
    """
    ⭐ PÚBLICO: Obtener video principal de un contenido (sin autenticación)
    
    Usado para mostrar el video principal de graduaciones.
    """
    try:
        from app.controllers.content.video_controller import VideoController
        from datetime import datetime
        
        controller = VideoController(db)
        video = controller.get_main_video(content_id)
        
        if not video:
            return create_response(
                success=True,
                message="No hay video principal para este contenido",
                data={
                    "main_video": None,
                    "content_id": content_id,
                    "timestamp": datetime.utcnow().isoformat(),
                    "source": "public_endpoint"
                }
            )
        
        # Convertir a formato público
        public_video = VideoPublic.from_orm(video)
        
        logger.info(f"⭐ [PUBLIC] Video principal del contenido {content_id}: {video.id}")
        
        return create_response(
            success=True,
            message="Video principal obtenido exitosamente",
            data={
                "main_video": public_video.dict(),
                "content_id": content_id,
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            }
        )
    
    except Exception as e:
        logger.error(f"💥 [PUBLIC] Error obteniendo video principal: {e}")
        return create_response(
            success=False,
            message="Error obteniendo video principal",
            data={
                "main_video": None,
                "content_id": content_id,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            }
        )

@router.get("/content/photos", response_model=dict)
def get_public_photos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    content_id: Optional[str] = Query(None, description="Filtrar por contenido"),
    featured_only: bool = Query(False, description="Solo fotos destacadas"),
    db: Session = Depends(get_db)
):
    """
    📸 PÚBLICO: Obtener fotos (sin autenticación)
    """
    try:
        from app.controllers.content.photo_controller import PhotoController
        from datetime import datetime
        
        controller = PhotoController(db)
        
        filters = {
            "content_id": content_id,
            "featured_only": featured_only,
            "featured_content_id": content_id if featured_only else None
        }
        
        photos = controller.get_public_photos(skip=skip, limit=limit, **filters)
        
        logger.info(f"📸 [PUBLIC] Fotos solicitadas: {len(photos)} resultados")
        
        return create_response(
            success=True,
            message="Fotos públicas obtenidas exitosamente",
            data={
                "photos": [photo.dict() for photo in photos],
                "total": len(photos),
                "skip": skip,
                "limit": limit,
                "filters": {k: v for k, v in filters.items() if v is not None},
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            }
        )
    
    except Exception as e:
        logger.error(f"💥 [PUBLIC] Error obteniendo fotos: {e}")
        return create_response(
            success=False,
            message="Error obteniendo fotos",
            data={
                "photos": [],
                "total": 0,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            }
        )

@router.get("/content/{content_id}/photos", response_model=dict)
def get_public_photos_by_content(
    content_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    featured_only: bool = Query(False, description="Solo fotos destacadas"),
    db: Session = Depends(get_db)
):
    """
    📋 PÚBLICO: Obtener fotos de un contenido (sin autenticación)
    """
    try:
        from app.controllers.content.photo_controller import PhotoController
        from datetime import datetime
        
        controller = PhotoController(db)
        
        filters = {
            "content_id": content_id,
            "featured_only": featured_only,
            "featured_content_id": content_id if featured_only else None
        }
        
        photos = controller.get_public_photos(skip=skip, limit=limit, **filters)
        
        logger.info(f"📋 [PUBLIC] Fotos del contenido {content_id}: {len(photos)} resultados")
        
        return create_response(
            success=True,
            message="Fotos del contenido obtenidas exitosamente",
            data={
                "photos": [photo.dict() for photo in photos],
                "content_id": content_id,
                "total": len(photos),
                "skip": skip,
                "limit": limit,
                "featured_only": featured_only,
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            }
        )
    
    except Exception as e:
        logger.error(f"💥 [PUBLIC] Error obteniendo fotos del contenido {content_id}: {e}")
        return create_response(
            success=False,
            message="Error obteniendo fotos del contenido",
            data={
                "photos": [],
                "content_id": content_id,
                "total": 0,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            }
        )

@router.get("/content/{content_id}/gallery", response_model=dict)
def get_public_gallery(
    content_id: str,
    db: Session = Depends(get_db)
):
    """
    🖼️ PÚBLICO: Obtener galería completa de un contenido (sin autenticación)
    """
    try:
        from app.controllers.content.photo_controller import PhotoController
        from datetime import datetime
        
        controller = PhotoController(db)
        gallery = controller.get_gallery_data(content_id)
        
        logger.info(f"🖼️ [PUBLIC] Galería del contenido {content_id}: {gallery.total_photos} fotos")
        
        return create_response(
            success=True,
            message="Galería obtenida exitosamente",
            data={
                **gallery.dict(),
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            }
        )
    
    except Exception as e:
        logger.error(f"💥 [PUBLIC] Error obteniendo galería {content_id}: {e}")
        return create_response(
            success=False,
            message="Error obteniendo galería",
            data={
                "content_id": content_id,
                "cover_photo": None,
                "featured_photos": [],
                "all_photos": [],
                "total_photos": 0,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            }
        )

@router.get("/content/photos/{photo_id}", response_model=dict)
def get_public_photo_by_id(
    photo_id: str,
    db: Session = Depends(get_db)
):
    """
    📄 PÚBLICO: Obtener foto por ID (sin autenticación)
    """
    try:
        from app.controllers.content.photo_controller import PhotoController
        from datetime import datetime
        
        controller = PhotoController(db)
        photo = controller.get_public_photo_by_id(photo_id)
        
        logger.info(f"📄 [PUBLIC] Foto solicitada: {photo_id}")
        
        return create_response(
            success=True,
            message="Foto obtenida exitosamente",
            data={
                "photo": photo.dict(),
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            }
        )
    
    except Exception as e:
        logger.warning(f"⚠️ [PUBLIC] Foto no encontrada: {photo_id}")
        return create_response(
            success=False,
            message=f"Foto '{photo_id}' no encontrada",
            data={
                "photo": None,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "source": "public_endpoint"
            },
            status_code=404
        )