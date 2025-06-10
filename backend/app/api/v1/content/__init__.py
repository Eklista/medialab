# backend/app/api/v1/content/__init__.py
"""
Módulo de gestión de contenido multimedia para MediaLab
Contiene endpoints para gestión de categorías, fotos, videos y proveedores
"""

from fastapi import APIRouter
from app.api.v1.content import categories, photos, video, video_types

# Crear el router principal de contenido
content_router = APIRouter()

# Incluir todos los subrouters
content_router.include_router(
    categories.router,
    prefix="/categories", 
    tags=["content-categories"]
)

content_router.include_router(
    photos.router,
    prefix="/photos", 
    tags=["content-photos"]
)

content_router.include_router(
    video.router,
    prefix="/videos", 
    tags=["content-videos"]
)

content_router.include_router(
    video_types.router,
    tags=["content-video-types"]
)

# Función para obtener el estado del módulo de contenido
def get_content_status():
    """
    Obtiene el estado actual del módulo de contenido
    """
    return {
        "status": "operational",
        "modules": ["categories", "photos", "videos", "video-types", "storage-providers"],
        "content_management": "available"
    }

# Información del módulo
__version__ = "1.0.0"
__description__ = "MediaLab Content Management Module with multimedia support"

# Lista de endpoints disponibles
AVAILABLE_ENDPOINTS = [
    # Categorías
    "POST /content/categories/ - Crear nueva categoría",
    "GET /content/categories/ - Obtener lista de categorías",
    "GET /content/categories/{category_id} - Obtener categoría por ID",
    "GET /content/categories/slug/{slug} - Obtener categoría por slug",
    "PUT /content/categories/{category_id} - Actualizar categoría",
    "DELETE /content/categories/{category_id} - Eliminar categoría",
    "POST /content/categories/departments/{department_id}/assign/{category_id} - Asignar categoría a departamento",
    "DELETE /content/categories/departments/{department_id}/remove/{category_id} - Remover categoría de departamento",
    "GET /content/categories/departments/with-categories - Departamentos con sus categorías",
    
    # Fotos
    "POST /content/photos/ - Crear nueva foto",
    "GET /content/photos/ - Obtener fotos con filtros",
    "GET /content/photos/{photo_id} - Obtener foto por ID",
    "PUT /content/photos/{photo_id} - Actualizar foto",
    "DELETE /content/photos/{photo_id} - Eliminar foto",
    "POST /content/photos/upload - Subir archivo de foto",
    "POST /content/photos/from-url - Crear foto desde URL",
    "POST /content/photos/bulk - Crear múltiples fotos",
    "POST /content/photos/bulk-upload - Subida masiva de fotos",
    "GET /content/photos/content/{content_id} - Fotos de un contenido",
    "GET /content/photos/content/{content_id}/gallery - Datos de galería",
    "POST /content/photos/content/{content_id}/set-cover/{photo_id} - Establecer foto de portada",
    "POST /content/photos/{photo_id}/toggle-featured - Alternar estado destacado",
    "POST /content/photos/content/{content_id}/reorder - Reordenar fotos",
    "GET /content/photos/admin/stats - Estadísticas de fotos",
    "POST /content/photos/admin/cleanup-orphaned - Limpiar fotos huérfanas",
    
    # Videos
    "POST /content/videos/ - Crear nuevo video",
    "GET /content/videos/ - Obtener videos con filtros",
    "GET /content/videos/{video_id} - Obtener video por ID",
    "PUT /content/videos/{video_id} - Actualizar video",
    "DELETE /content/videos/{video_id} - Eliminar video",
    "POST /content/videos/from-youtube - Crear video desde YouTube",
    "POST /content/videos/from-vimeo - Crear video desde Vimeo",
    "POST /content/videos/upload - Subir archivo de video",
    "POST /content/videos/bulk - Crear múltiples videos",
    "GET /content/videos/content/{content_id} - Videos de un contenido",
    "GET /content/videos/content/{content_id}/main - Video principal",
    "POST /content/videos/content/{content_id}/set-main/{video_id} - Establecer video principal",
    "PUT /content/videos/{video_id}/processing - Actualizar estado de procesamiento",
    "POST /content/videos/content/{content_id}/reorder - Reordenar videos",
    "GET /content/videos/admin/stats - Estadísticas de videos",
    "GET /content/videos/admin/pending-processing - Videos pendientes",
    "GET /content/videos/admin/failed-processing - Videos fallidos",
    "POST /content/videos/{video_id}/retry-processing - Reintentar procesamiento",
    
    # Tipos de video
    "POST /content/video-types/ - Crear tipo de video",
    "GET /content/video-types/ - Obtener tipos de video",
    "GET /content/video-types/{type_id} - Obtener tipo por ID",
    "PUT /content/video-types/{type_id} - Actualizar tipo",
    "DELETE /content/video-types/{type_id} - Eliminar tipo",
    
    # Proveedores de almacenamiento
    "POST /content/storage-providers/ - Crear proveedor",
    "GET /content/storage-providers/ - Obtener proveedores",
    "GET /content/storage-providers/{provider_id} - Obtener proveedor por ID",
    "PUT /content/storage-providers/{provider_id} - Actualizar proveedor",
    "DELETE /content/storage-providers/{provider_id} - Eliminar proveedor"
]

# Características del módulo
CONTENT_FEATURES = [
    "Content Categories Management - Gestión completa de categorías organizacionales",
    "Photo Galleries - Gestión de fotos con thumbnails y variantes automáticas",
    "Video Management - Soporte para YouTube, Vimeo y archivos locales",
    "Storage Providers - Configuración de múltiples proveedores de almacenamiento",
    "Bulk Operations - Operaciones masivas para fotos y videos",
    "Public Endpoints - Endpoints públicos sin autenticación",
    "Advanced Search - Búsqueda avanzada en todos los tipos de contenido",
    "Processing Status - Seguimiento del estado de procesamiento de videos",
    "Audit Trail - Auditoría completa de todas las operaciones",
    "Department Integration - Integración con la estructura organizacional"
]