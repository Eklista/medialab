# app/services/content/photo_service.py
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import logging
import uuid
from datetime import datetime

from app.repositories.content.photo_repository import PhotoRepository
from app.schemas.content.photos import (
    PhotoCreate, PhotoUpdate, PhotoCreateFromUpload, PhotoCreateFromUrl,
    PhotoBulkCreate, PhotoBulkUpload
)
from app.models.content.photos import Photo
from app.services.system.audit_service import AuditService
from app.core.exceptions import ValidationError, NotFoundError, ConflictError
from app.utils.image_utils import get_image_info, generate_thumbnail, resize_image

logger = logging.getLogger(__name__)

class PhotoService:
    def __init__(self, db: Session):
        self.db = db
        self.photo_repo = PhotoRepository(db)

    def create_photo(self, photo_data: PhotoCreate, user_id: int) -> Photo:
        """Crear nueva foto"""
        logger.info(f"🆕 Creando foto para contenido: {photo_data.content_id}")
        
        # Generar ID único para la foto
        photo_dict = photo_data.dict()
        photo_dict['id'] = str(uuid.uuid4())
        photo_dict['created_by_id'] = user_id
        
        # Crear foto
        photo = Photo(**photo_dict)
        self.db.add(photo)
        self.db.commit()
        self.db.refresh(photo)
        
        # Audit log
        AuditService.log_action(
            db=self.db,
            action="create",
            entity_type="photo",
            entity_id=photo.id,
            user_id=user_id,
            new_values=photo_data.dict(),
            details=f"Foto creada para contenido {photo_data.content_id}"
        )
        
        logger.info(f"✅ Foto creada: ID {photo.id}")
        return photo

    def create_photo_from_upload(self, upload_data: PhotoCreateFromUpload, user_id: int) -> Photo:
        """Crear foto desde archivo subido"""
        logger.info(f"📁 Creando foto desde archivo: {upload_data.original_filename}")
        
        # Obtener información de la imagen
        image_info = get_image_info(upload_data.file_path)
        
        # Generar thumbnail y versión media
        thumbnail_path = generate_thumbnail(upload_data.file_path)
        medium_path = resize_image(upload_data.file_path, max_width=800)
        
        # Crear datos de la foto
        photo_create = PhotoCreate(
            content_id=upload_data.content_id,
            photo_url=upload_data.file_path,
            thumbnail_url=thumbnail_path,
            medium_url=medium_path,
            original_filename=upload_data.original_filename,
            file_size=image_info.get("file_size"),
            mime_type=image_info.get("mime_type"),
            width=image_info.get("width"),
            height=image_info.get("height"),
            caption=upload_data.caption,
            alt_text=upload_data.alt_text,
            is_featured=upload_data.is_featured,
            is_cover=upload_data.is_cover,
            sort_order=upload_data.sort_order
        )
        
        return self.create_photo(photo_create, user_id)

    def create_photo_from_url(self, url_data: PhotoCreateFromUrl, user_id: int) -> Photo:
        """Crear foto desde URL externa"""
        logger.info(f"🌐 Creando foto desde URL: {url_data.photo_url}")
        
        # Crear datos de la foto
        photo_create = PhotoCreate(
            content_id=url_data.content_id,
            photo_url=url_data.photo_url,
            caption=url_data.caption,
            alt_text=url_data.alt_text,
            is_featured=url_data.is_featured,
            is_cover=url_data.is_cover,
            sort_order=url_data.sort_order
        )
        
        return self.create_photo(photo_create, user_id)

    def bulk_create_photos(self, bulk_data: PhotoBulkCreate, user_id: int) -> List[Photo]:
        """Crear múltiples fotos"""
        logger.info(f"📦 Creando {len(bulk_data.photos)} fotos para contenido {bulk_data.content_id}")
        
        created_photos = []
        for i, photo_data in enumerate(bulk_data.photos):
            try:
                photo_data.content_id = bulk_data.content_id
                if photo_data.sort_order == 0:
                    photo_data.sort_order = i + 1
                
                photo = self.create_photo(photo_data, user_id)
                created_photos.append(photo)
            except Exception as e:
                logger.error(f"Error creando foto {i+1}: {e}")
                continue
        
        logger.info(f"✅ Creadas {len(created_photos)} de {len(bulk_data.photos)} fotos")
        return created_photos

    def bulk_upload_photos(self, upload_data: PhotoBulkUpload, user_id: int) -> List[Photo]:
        """Subida masiva de fotos"""
        logger.info(f"📦 Subida masiva: {len(upload_data.file_paths)} archivos")
        
        created_photos = []
        for i, file_path in enumerate(upload_data.file_paths):
            try:
                caption = None
                if upload_data.captions and i < len(upload_data.captions):
                    caption = upload_data.captions[i]
                
                # Obtener nombre del archivo
                import os
                filename = os.path.basename(file_path)
                
                upload_photo = PhotoCreateFromUpload(
                    content_id=upload_data.content_id,
                    file_path=file_path,
                    original_filename=filename,
                    caption=caption,
                    sort_order=i + 1
                )
                
                photo = self.create_photo_from_upload(upload_photo, user_id)
                created_photos.append(photo)
            except Exception as e:
                logger.error(f"Error subiendo foto {i+1}: {e}")
                continue
        
        logger.info(f"✅ Subidas {len(created_photos)} de {len(upload_data.file_paths)} fotos")
        return created_photos

    def get_photos(self, skip: int = 0, limit: int = 100, **filters) -> List[Photo]:
        """Obtener fotos con filtros"""
        if content_id := filters.get('content_id'):
            return self.photo_repo.get_by_content(content_id, skip, limit)
        elif filters.get('featured_only'):
            content_id = filters.get('featured_content_id')
            if content_id:
                return self.photo_repo.get_featured_photos(content_id, limit)
        elif search_query := filters.get('search'):
            return self.photo_repo.search_photos(search_query, skip, limit)
        else:
            return self.photo_repo.get_multi(skip=skip, limit=limit)

    def get_photo_by_id(self, photo_id: str) -> Photo:
        """Obtener foto por ID con contenido"""
        photo = self.photo_repo.get_with_content(photo_id)
        if not photo:
            raise NotFoundError(f"Foto con ID {photo_id} no encontrada")
        return photo

    def get_cover_photo(self, content_id: str) -> Optional[Photo]:
        """Obtener foto de portada de un contenido"""
        return self.photo_repo.get_cover_photo(content_id)

    def get_featured_photos(self, content_id: str, limit: int = 10) -> List[Photo]:
        """Obtener fotos destacadas de un contenido"""
        return self.photo_repo.get_featured_photos(content_id, limit)

    def get_gallery_data(self, content_id: str) -> Dict[str, Any]:
        """Obtener datos completos de galería"""
        return self.photo_repo.get_gallery_data(content_id)

    def update_photo(self, photo_id: str, photo_data: PhotoUpdate, user_id: int) -> Photo:
        """Actualizar foto"""
        logger.info(f"📝 Actualizando foto: {photo_id}")
        
        photo = self.get_photo_by_id(photo_id)
        old_values = {
            "caption": photo.caption,
            "is_featured": photo.is_featured,
            "is_cover": photo.is_cover
        }
        
        # Actualizar
        photo_data_dict = photo_data.dict(exclude_unset=True)
        photo_data_dict['updated_by_id'] = user_id
        
        updated_photo = self.photo_repo.update(photo, photo_data)
        
        # Audit log
        AuditService.log_action(
            db=self.db,
            action="update",
            entity_type="photo",
            entity_id=photo_id,
            user_id=user_id,
            old_values=old_values,
            new_values=photo_data.dict(exclude_unset=True),
            details=f"Foto actualizada: {photo_id}"
        )
        
        logger.info(f"✅ Foto actualizada: {photo_id}")
        return updated_photo

    def delete_photo(self, photo_id: str, user_id: int) -> bool:
        """Eliminar foto (soft delete)"""
        logger.info(f"🗑️ Eliminando foto: {photo_id}")
        
        photo = self.get_photo_by_id(photo_id)
        
        # Marcar como eliminada
        photo.deleted_at = datetime.utcnow()
        photo.deleted_by_id = user_id
        self.db.commit()
        
        # Audit log
        AuditService.log_action(
            db=self.db,
            action="delete",
            entity_type="photo",
            entity_id=photo_id,
            user_id=user_id,
            details=f"Foto eliminada: {photo_id}"
        )
        
        logger.info(f"✅ Foto eliminada: {photo_id}")
        return True

    def set_cover_photo(self, content_id: str, photo_id: str, user_id: int) -> bool:
        """Establecer foto como portada"""
        logger.info(f"🖼️ Estableciendo foto de portada: {photo_id} para contenido {content_id}")
        
        # Verificar que la foto existe y pertenece al contenido
        photo = self.get_photo_by_id(photo_id)
        if photo.content_id != content_id:
            raise ValidationError("La foto no pertenece al contenido especificado")
        
        success = self.photo_repo.set_cover_photo(content_id, photo_id)
        
        if success:
            # Audit log
            AuditService.log_action(
                db=self.db,
                action="set_cover",
                entity_type="photo",
                entity_id=photo_id,
                user_id=user_id,
                details=f"Foto establecida como portada: {photo_id}"
            )
            logger.info(f"✅ Foto de portada establecida: {photo_id}")
        
        return success

    def toggle_featured(self, photo_id: str, user_id: int) -> bool:
        """Alternar estado destacado de una foto"""
        logger.info(f"⭐ Alternando estado destacado: {photo_id}")
        
        photo = self.get_photo_by_id(photo_id)
        old_featured = photo.is_featured
        
        success = self.photo_repo.toggle_featured(photo_id)
        
        if success:
            new_featured = not old_featured
            # Audit log
            AuditService.log_action(
                db=self.db,
                action="toggle_featured",
                entity_type="photo",
                entity_id=photo_id,
                user_id=user_id,
                old_values={"is_featured": old_featured},
                new_values={"is_featured": new_featured},
                details=f"Estado destacado cambiado: {photo_id}"
            )
        
        return success

    def reorder_photos(self, content_id: str, photo_orders: List[Dict[str, int]], user_id: int) -> bool:
        """Reordenar fotos de un contenido"""
        logger.info(f"🔀 Reordenando fotos del contenido: {content_id}")
        
        success = self.photo_repo.reorder_photos(content_id, photo_orders)
        
        if success:
            # Audit log
            AuditService.log_action(
                db=self.db,
                action="reorder",
                entity_type="photo",
                entity_id=content_id,
                user_id=user_id,
                new_values={"photo_orders": photo_orders},
                details=f"Fotos reordenadas para contenido {content_id}"
            )
        
        return success

    def search_photos(self, query: str, skip: int = 0, limit: int = 100) -> List[Photo]:
        """Buscar fotos"""
        return self.photo_repo.search_photos(query=query, skip=skip, limit=limit)

    def get_photos_stats(self) -> Dict[str, Any]:
        """Obtener estadísticas de fotos"""
        return self.photo_repo.get_photos_stats()

    def cleanup_orphaned_photos(self, days_old: int = 30, user_id: int = None) -> int:
        """Limpiar fotos huérfanas"""
        logger.info(f"🧹 Limpiando fotos huérfanas de más de {days_old} días")
        
        count = self.photo_repo.cleanup_orphaned_photos(days_old)
        
        if count > 0 and user_id:
            # Audit log
            AuditService.log_action(
                db=self.db,
                action="cleanup",
                entity_type="photo",
                entity_id="bulk",
                user_id=user_id,
                details=f"Limpiadas {count} fotos huérfanas"
            )
        
        logger.info(f"✅ Limpiadas {count} fotos huérfanas")
        return count