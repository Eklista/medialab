# app/controllers/content/photo_controller.py
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import logging

from app.services.content.photo_service import PhotoService
from app.schemas.content.photos import (
    PhotoCreate, PhotoUpdate, PhotoInDB, PhotoPublic,
    PhotoCreateFromUpload, PhotoCreateFromUrl, PhotoBulkCreate, PhotoBulkUpload,
    PhotoListResponse, PhotoGalleryResponse
)
from app.models.content.photos import Photo
from app.core.exceptions import ValidationError, NotFoundError, ConflictError

logger = logging.getLogger(__name__)

class PhotoController:
    def __init__(self, db: Session):
        self.db = db
        self.service = PhotoService(db)

    def create_photo(self, photo_data: PhotoCreate, user_id: int) -> PhotoInDB:
        """Crear nueva foto"""
        try:
            photo = self.service.create_photo(photo_data, user_id)
            return PhotoInDB.from_orm(photo)
        except (ValidationError, NotFoundError, ConflictError) as e:
            logger.warning(f"⚠️ Error creando foto: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado creando foto: {e}")
            raise ValidationError(f"Error creando foto: {str(e)}")

    def create_photo_from_upload(self, upload_data: PhotoCreateFromUpload, user_id: int) -> PhotoInDB:
        """Crear foto desde archivo subido"""
        try:
            photo = self.service.create_photo_from_upload(upload_data, user_id)
            return PhotoInDB.from_orm(photo)
        except (ValidationError, NotFoundError) as e:
            logger.warning(f"⚠️ Error creando foto desde archivo: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado creando foto desde archivo: {e}")
            raise ValidationError(f"Error creando foto desde archivo: {str(e)}")

    def create_photo_from_url(self, url_data: PhotoCreateFromUrl, user_id: int) -> PhotoInDB:
        """Crear foto desde URL"""
        try:
            photo = self.service.create_photo_from_url(url_data, user_id)
            return PhotoInDB.from_orm(photo)
        except (ValidationError, NotFoundError) as e:
            logger.warning(f"⚠️ Error creando foto desde URL: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado creando foto desde URL: {e}")
            raise ValidationError(f"Error creando foto desde URL: {str(e)}")

    def bulk_create_photos(self, bulk_data: PhotoBulkCreate, user_id: int) -> List[PhotoInDB]:
        """Crear múltiples fotos"""
        try:
            photos = self.service.bulk_create_photos(bulk_data, user_id)
            return [PhotoInDB.from_orm(photo) for photo in photos]
        except Exception as e:
            logger.error(f"💥 Error en creación masiva de fotos: {e}")
            raise ValidationError(f"Error en creación masiva: {str(e)}")

    def bulk_upload_photos(self, upload_data: PhotoBulkUpload, user_id: int) -> List[PhotoInDB]:
        """Subida masiva de fotos"""
        try:
            photos = self.service.bulk_upload_photos(upload_data, user_id)
            return [PhotoInDB.from_orm(photo) for photo in photos]
        except Exception as e:
            logger.error(f"💥 Error en subida masiva: {e}")
            raise ValidationError(f"Error en subida masiva: {str(e)}")

    def get_photos(self, skip: int = 0, limit: int = 100, **filters) -> PhotoListResponse:
        """Obtener fotos con filtros"""
        try:
            photos = self.service.get_photos(skip=skip, limit=limit, **filters)
            photo_list = [PhotoInDB.from_orm(photo) for photo in photos]
            
            return PhotoListResponse(
                photos=photo_list,
                total=len(photo_list),
                skip=skip,
                limit=limit,
                **{k: v for k, v in filters.items() if v is not None}
            )
        except Exception as e:
            logger.error(f"💥 Error obteniendo fotos: {e}")
            raise

    def get_public_photos(self, skip: int = 0, limit: int = 100, **filters) -> List[PhotoPublic]:
        """Obtener fotos para endpoint público"""
        try:
            photos = self.service.get_photos(skip=skip, limit=limit, **filters)
            return [PhotoPublic.from_orm(photo) for photo in photos]
        except Exception as e:
            logger.error(f"💥 Error obteniendo fotos públicas: {e}")
            raise

    def get_photos_by_content(self, content_id: str, skip: int = 0, limit: int = 100) -> List[PhotoInDB]:
        """Obtener fotos de un contenido específico"""
        try:
            photos = self.service.get_photos(skip=skip, limit=limit, content_id=content_id)
            return [PhotoInDB.from_orm(photo) for photo in photos]
        except Exception as e:
            logger.error(f"💥 Error obteniendo fotos del contenido {content_id}: {e}")
            raise

    def get_photo_by_id(self, photo_id: str) -> PhotoInDB:
        """Obtener foto por ID"""
        try:
            photo = self.service.get_photo_by_id(photo_id)
            return PhotoInDB.from_orm(photo)
        except NotFoundError as e:
            logger.warning(f"⚠️ Foto no encontrada: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error obteniendo foto: {e}")
            raise

    def get_public_photo_by_id(self, photo_id: str) -> PhotoPublic:
        """Obtener foto por ID para endpoint público"""
        try:
            photo = self.service.get_photo_by_id(photo_id)
            return PhotoPublic.from_orm(photo)
        except NotFoundError as e:
            logger.warning(f"⚠️ Foto pública no encontrada: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error obteniendo foto pública: {e}")
            raise

    def get_gallery_data(self, content_id: str) -> PhotoGalleryResponse:
        """Obtener datos completos de galería"""
        try:
            gallery_data = self.service.get_gallery_data(content_id)
            
            # Convertir a formatos públicos
            cover_photo = None
            if gallery_data["cover_photo"]:
                cover_photo = PhotoPublic.from_orm(gallery_data["cover_photo"])
            
            featured_photos = [PhotoPublic.from_orm(photo) for photo in gallery_data["featured_photos"]]
            all_photos = [PhotoPublic.from_orm(photo) for photo in gallery_data["all_photos"]]
            
            return PhotoGalleryResponse(
                content_id=content_id,
                cover_photo=cover_photo,
                featured_photos=featured_photos,
                all_photos=all_photos,
                total_photos=gallery_data["total_photos"],
                has_cover=gallery_data["has_cover"],
                featured_count=gallery_data["featured_count"]
            )
        except Exception as e:
            logger.error(f"💥 Error obteniendo datos de galería: {e}")
            raise

    def update_photo(self, photo_id: str, photo_data: PhotoUpdate, user_id: int) -> PhotoInDB:
        """Actualizar foto"""
        try:
            photo = self.service.update_photo(photo_id, photo_data, user_id)
            return PhotoInDB.from_orm(photo)
        except (ValidationError, NotFoundError, ConflictError) as e:
            logger.warning(f"⚠️ Error actualizando foto: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado actualizando foto: {e}")
            raise

    def delete_photo(self, photo_id: str, user_id: int) -> Dict[str, Any]:
        """Eliminar foto"""
        try:
            success = self.service.delete_photo(photo_id, user_id)
            return {
                "success": success,
                "message": "Foto eliminada exitosamente" if success else "Error eliminando foto",
                "photo_id": photo_id
            }
        except (NotFoundError, ConflictError) as e:
            logger.warning(f"⚠️ Error eliminando foto: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado eliminando foto: {e}")
            raise

    def set_cover_photo(self, content_id: str, photo_id: str, user_id: int) -> Dict[str, Any]:
        """Establecer foto como portada"""
        try:
            success = self.service.set_cover_photo(content_id, photo_id, user_id)
            return {
                "success": success,
                "message": "Foto establecida como portada" if success else "Error estableciendo portada",
                "content_id": content_id,
                "photo_id": photo_id
            }
        except (ValidationError, NotFoundError) as e:
            logger.warning(f"⚠️ Error estableciendo foto de portada: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado estableciendo portada: {e}")
            raise

    def toggle_featured(self, photo_id: str, user_id: int) -> Dict[str, Any]:
        """Alternar estado destacado"""
        try:
            success = self.service.toggle_featured(photo_id, user_id)
            return {
                "success": success,
                "message": "Estado destacado cambiado" if success else "Error cambiando estado",
                "photo_id": photo_id
            }
        except (ValidationError, NotFoundError) as e:
            logger.warning(f"⚠️ Error alternando estado destacado: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado alternando estado: {e}")
            raise

    def reorder_photos(self, content_id: str, photo_orders: List[Dict[str, int]], user_id: int) -> Dict[str, Any]:
        """Reordenar fotos"""
        try:
            success = self.service.reorder_photos(content_id, photo_orders, user_id)
            return {
                "success": success,
                "message": "Fotos reordenadas exitosamente" if success else "Error reordenando fotos",
                "content_id": content_id,
                "reordered_count": len(photo_orders)
            }
        except Exception as e:
            logger.error(f"💥 Error reordenando fotos: {e}")
            raise

    def search_photos(self, query: str, skip: int = 0, limit: int = 100) -> List[PhotoInDB]:
        """Buscar fotos"""
        try:
            photos = self.service.search_photos(query=query, skip=skip, limit=limit)
            return [PhotoInDB.from_orm(photo) for photo in photos]
        except Exception as e:
            logger.error(f"💥 Error buscando fotos: {e}")
            raise

    def get_photos_stats(self) -> Dict[str, Any]:
        """Obtener estadísticas de fotos"""
        try:
            stats = self.service.get_photos_stats()
            return {
                "success": True,
                "message": "Estadísticas obtenidas exitosamente",
                "data": stats
            }
        except Exception as e:
            logger.error(f"💥 Error obteniendo estadísticas: {e}")
            raise

    def cleanup_orphaned_photos(self, days_old: int = 30, user_id: int = None) -> Dict[str, Any]:
        """Limpiar fotos huérfanas"""
        try:
            count = self.service.cleanup_orphaned_photos(days_old, user_id)
            return {
                "success": True,
                "message": f"Limpiadas {count} fotos huérfanas",
                "cleaned_count": count,
                "days_old": days_old
            }
        except Exception as e:
            logger.error(f"💥 Error limpiando fotos huérfanas: {e}")
            raise