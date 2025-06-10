# app/services/content/video_service.py
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any, Tuple
import logging
import re
import uuid

from app.repositories.content.video_repository import VideoRepository
from app.repositories.content.video_types_repository import VideoTypeRepository, StorageProviderRepository
from app.schemas.content.videos import (
    VideoCreate, VideoUpdate, VideoCreateFromYouTube, VideoCreateFromVimeo,
    VideoCreateFromUpload, VideoBulkCreate, VideoProcessingUpdate
)
from app.models.content.videos import Video
from app.services.system.audit_service import AuditService
from app.core.exceptions import ValidationError, NotFoundError, ConflictError
from app.utils.video_utils import extract_youtube_id, extract_vimeo_id, get_youtube_thumbnail

logger = logging.getLogger(__name__)

class VideoService:
    def __init__(self, db: Session):
        self.db = db
        self.video_repo = VideoRepository(db)
        self.video_type_repo = VideoTypeRepository(db)
        self.provider_repo = StorageProviderRepository(db)

    def create_video(self, video_data: VideoCreate, user_id: int) -> Video:
        """Crear nuevo video"""
        logger.info(f"🆕 Creando video para contenido: {video_data.content_id}")
        
        # Verificar que existen las dependencias
        video_type = self.video_type_repo.get(video_data.video_type_id)
        if not video_type:
            raise NotFoundError(f"Tipo de video {video_data.video_type_id} no encontrado")
        
        provider = self.provider_repo.get(video_data.storage_provider_id)
        if not provider:
            raise NotFoundError(f"Proveedor {video_data.storage_provider_id} no encontrado")
        
        # Verificar que el proveedor pertenece al tipo de video
        if provider.video_type_id != video_data.video_type_id:
            raise ValidationError("El proveedor no pertenece al tipo de video especificado")
        
        # Generar ID único para el video
        video_dict = video_data.dict()
        video_dict['id'] = str(uuid.uuid4())
        video_dict['created_by_id'] = user_id
        
        # Crear video
        video = Video(**video_dict)
        self.db.add(video)
        self.db.commit()
        self.db.refresh(video)
        
        # Audit log
        AuditService.log_action(
            db=self.db,
            action="create",
            entity_type="video",
            entity_id=video.id,
            user_id=user_id,
            new_values=video_data.dict(),
            details=f"Video creado para contenido {video_data.content_id}"
        )
        
        logger.info(f"✅ Video creado: ID {video.id}")
        return video

    def create_video_from_youtube(self, youtube_data: VideoCreateFromYouTube, user_id: int) -> Video:
        """Crear video desde URL de YouTube"""
        logger.info(f"🎬 Creando video desde YouTube: {youtube_data.youtube_url}")
        
        # Extraer ID de YouTube
        youtube_id = extract_youtube_id(youtube_data.youtube_url)
        if not youtube_id:
            raise ValidationError("URL de YouTube inválida")
        
        # Obtener tipo y proveedor de YouTube
        youtube_type = self.video_type_repo.get_by_name("youtube")
        if not youtube_type:
            raise NotFoundError("Tipo de video YouTube no configurado")
        
        youtube_provider = self.provider_repo.get_by_video_type(youtube_type.id)
        if not youtube_provider:
            raise NotFoundError("Proveedor de YouTube no configurado")
        
        # Crear datos del video
        video_create = VideoCreate(
            content_id=youtube_data.content_id,
            video_type_id=youtube_type.id,
            storage_provider_id=youtube_provider[0].id,  # Primer proveedor disponible
            video_url=youtube_data.youtube_url,
            video_id=youtube_id,
            thumbnail_url=get_youtube_thumbnail(youtube_id),
            is_main=youtube_data.is_main,
            sort_order=youtube_data.sort_order,
            processing_status="completed",  # YouTube ya está procesado
            is_processed=True
        )
        
        return self.create_video(video_create, user_id)

    def create_video_from_vimeo(self, vimeo_data: VideoCreateFromVimeo, user_id: int) -> Video:
        """Crear video desde URL de Vimeo"""
        logger.info(f"🎭 Creando video desde Vimeo: {vimeo_data.vimeo_url}")
        
        # Extraer ID de Vimeo
        vimeo_id = extract_vimeo_id(vimeo_data.vimeo_url)
        if not vimeo_id:
            raise ValidationError("URL de Vimeo inválida")
        
        # Obtener tipo y proveedor de Vimeo
        vimeo_type = self.video_type_repo.get_by_name("vimeo")
        if not vimeo_type:
            raise NotFoundError("Tipo de video Vimeo no configurado")
        
        vimeo_provider = self.provider_repo.get_by_video_type(vimeo_type.id)
        if not vimeo_provider:
            raise NotFoundError("Proveedor de Vimeo no configurado")
        
        # Crear datos del video
        video_create = VideoCreate(
            content_id=vimeo_data.content_id,
            video_type_id=vimeo_type.id,
            storage_provider_id=vimeo_provider[0].id,
            video_url=vimeo_data.vimeo_url,
            video_id=vimeo_id,
            is_main=vimeo_data.is_main,
            sort_order=vimeo_data.sort_order,
            processing_status="completed",
            is_processed=True
        )
        
        return self.create_video(video_create, user_id)

    def create_video_from_upload(self, upload_data: VideoCreateFromUpload, user_id: int) -> Video:
        """Crear video desde archivo subido"""
        logger.info(f"📁 Creando video desde archivo: {upload_data.original_filename}")
        
        # Obtener tipo local
        local_type = self.video_type_repo.get_by_name("local")
        if not local_type:
            raise NotFoundError("Tipo de video local no configurado")
        
        local_provider = self.provider_repo.get_by_video_type(local_type.id)
        if not local_provider:
            raise NotFoundError("Proveedor local no configurado")
        
        # Crear datos del video
        video_create = VideoCreate(
            content_id=upload_data.content_id,
            video_type_id=local_type.id,
            storage_provider_id=local_provider[0].id,
            video_url=upload_data.file_path,
            original_filename=upload_data.original_filename,
            is_main=upload_data.is_main,
            sort_order=upload_data.sort_order,
            processing_status="pending",  # Necesita procesamiento
            is_processed=False
        )
        
        return self.create_video(video_create, user_id)

    def bulk_create_videos(self, bulk_data: VideoBulkCreate, user_id: int) -> List[Video]:
        """Crear múltiples videos"""
        logger.info(f"📦 Creando {len(bulk_data.videos)} videos para contenido {bulk_data.content_id}")
        
        created_videos = []
        for i, video_data in enumerate(bulk_data.videos):
            try:
                video_data.content_id = bulk_data.content_id
                if video_data.sort_order == 0:
                    video_data.sort_order = i + 1
                
                video = self.create_video(video_data, user_id)
                created_videos.append(video)
            except Exception as e:
                logger.error(f"Error creando video {i+1}: {e}")
                # Continuar con el siguiente video
                continue
        
        logger.info(f"✅ Creados {len(created_videos)} de {len(bulk_data.videos)} videos")
        return created_videos

    def get_videos(self, skip: int = 0, limit: int = 100, **filters) -> List[Video]:
        """Obtener videos con filtros"""
        if content_id := filters.get('content_id'):
            return self.video_repo.get_by_content(content_id, skip, limit)
        elif video_type_id := filters.get('video_type_id'):
            return self.video_repo.get_by_video_type(video_type_id, skip, limit)
        elif processing_status := filters.get('processing_status'):
            return self.video_repo.get_by_processing_status(processing_status, skip, limit)
        elif provider_id := filters.get('storage_provider_id'):
            return self.video_repo.get_by_storage_provider(provider_id, skip, limit)
        else:
            return self.video_repo.get_multi(skip=skip, limit=limit)

    def get_video_by_id(self, video_id: str) -> Video:
        """Obtener video por ID con relaciones"""
        video = self.video_repo.get_with_relations(video_id)
        if not video:
            raise NotFoundError(f"Video con ID {video_id} no encontrado")
        return video

    def get_main_video(self, content_id: str) -> Optional[Video]:
        """Obtener video principal de un contenido"""
        return self.video_repo.get_main_video(content_id)

    def update_video(self, video_id: str, video_data: VideoUpdate, user_id: int) -> Video:
        """Actualizar video"""
        logger.info(f"📝 Actualizando video: {video_id}")
        
        video = self.get_video_by_id(video_id)
        old_values = {
            "video_url": video.video_url,
            "processing_status": video.processing_status,
            "is_main": video.is_main
        }
        
        # Verificar dependencias si cambiaron
        if video_data.video_type_id and video_data.video_type_id != video.video_type_id:
            if not self.video_type_repo.get(video_data.video_type_id):
                raise NotFoundError(f"Tipo de video {video_data.video_type_id} no encontrado")
        
        if video_data.storage_provider_id and video_data.storage_provider_id != video.storage_provider_id:
            if not self.provider_repo.get(video_data.storage_provider_id):
                raise NotFoundError(f"Proveedor {video_data.storage_provider_id} no encontrado")
        
        # Actualizar
        video_data_dict = video_data.dict(exclude_unset=True)
        video_data_dict['updated_by_id'] = user_id
        
        updated_video = self.video_repo.update(video, video_data)
        
        # Audit log
        AuditService.log_action(
            db=self.db,
            action="update",
            entity_type="video",
            entity_id=video_id,
            user_id=user_id,
            old_values=old_values,
            new_values=video_data.dict(exclude_unset=True),
            details=f"Video actualizado: {video_id}"
        )
        
        logger.info(f"✅ Video actualizado: {video_id}")
        return updated_video

    def delete_video(self, video_id: str, user_id: int) -> bool:
        """Eliminar video (soft delete)"""
        logger.info(f"🗑️ Eliminando video: {video_id}")
        
        video = self.get_video_by_id(video_id)
        
        # Marcar como eliminado
        video.deleted_at = datetime.utcnow()
        video.deleted_by_id = user_id
        self.db.commit()
        
        # Audit log
        AuditService.log_action(
            db=self.db,
            action="delete",
            entity_type="video",
            entity_id=video_id,
            user_id=user_id,
            details=f"Video eliminado: {video_id}"
        )
        
        logger.info(f"✅ Video eliminado: {video_id}")
        return True

    def set_main_video(self, content_id: str, video_id: str, user_id: int) -> bool:
        """Establecer video como principal"""
        logger.info(f"⭐ Estableciendo video principal: {video_id} para contenido {content_id}")
        
        # Verificar que el video existe y pertenece al contenido
        video = self.get_video_by_id(video_id)
        if video.content_id != content_id:
            raise ValidationError("El video no pertenece al contenido especificado")
        
        success = self.video_repo.set_main_video(content_id, video_id)
        
        if success:
            # Audit log
            AuditService.log_action(
                db=self.db,
                action="set_main",
                entity_type="video",
                entity_id=video_id,
                user_id=user_id,
                details=f"Video establecido como principal: {video_id}"
            )
            logger.info(f"✅ Video principal establecido: {video_id}")
        
        return success

    def update_processing_status(self, video_id: str, status_data: VideoProcessingUpdate, user_id: int) -> bool:
        """Actualizar estado de procesamiento"""
        logger.info(f"🔄 Actualizando estado de procesamiento: {video_id} -> {status_data.processing_status}")
        
        video = self.get_video_by_id(video_id)
        
        # Actualizar campos específicos de procesamiento
        update_data = status_data.dict(exclude_unset=True)
        update_data['updated_by_id'] = user_id
        
        for field, value in update_data.items():
            if hasattr(video, field):
                setattr(video, field, value)
        
        self.db.commit()
        
        # Audit log
        AuditService.log_action(
            db=self.db,
            action="process_update",
            entity_type="video",
            entity_id=video_id,
            user_id=user_id,
            new_values=update_data,
            details=f"Estado de procesamiento actualizado: {status_data.processing_status}"
        )
        
        return True

    def reorder_videos(self, content_id: str, video_orders: List[Dict[str, int]], user_id: int) -> bool:
        """Reordenar videos de un contenido"""
        logger.info(f"🔀 Reordenando videos del contenido: {content_id}")
        
        success = self.video_repo.reorder_videos(content_id, video_orders)
        
        if success:
            # Audit log
            AuditService.log_action(
                db=self.db,
                action="reorder",
                entity_type="video",
                entity_id=content_id,
                user_id=user_id,
                new_values={"video_orders": video_orders},
                details=f"Videos reordenados para contenido {content_id}"
            )
        
        return success

    def search_videos(self, query: str, skip: int = 0, limit: int = 100) -> List[Video]:
        """Buscar videos"""
        return self.video_repo.search_videos(query=query, skip=skip, limit=limit)

    def get_pending_processing(self, limit: int = 50) -> List[Video]:
        """Obtener videos pendientes de procesamiento"""
        return self.video_repo.get_pending_processing(limit=limit)

    def get_failed_processing(self, limit: int = 50) -> List[Video]:
        """Obtener videos con error en procesamiento"""
        return self.video_repo.get_failed_processing(limit=limit)

    def get_videos_stats(self) -> Dict[str, Any]:
        """Obtener estadísticas de videos"""
        return self.video_repo.get_videos_stats()

    def retry_failed_processing(self, video_id: str, user_id: int) -> bool:
        """Reintentar procesamiento de video fallido"""
        logger.info(f"🔄 Reintentando procesamiento: {video_id}")
        
        video = self.get_video_by_id(video_id)
        if video.processing_status != 'error':
            raise ValidationError("Solo se pueden reintentar videos con error")
        
        # Resetear estado
        video.processing_status = 'pending'
        video.error_message = None
        video.is_processed = False
        video.updated_by_id = user_id
        
        self.db.commit()
        
        # Audit log
        AuditService.log_action(
            db=self.db,
            action="retry_processing",
            entity_type="video",
            entity_id=video_id,
            user_id=user_id,
            details=f"Procesamiento reintentado: {video_id}"
        )
        
        return True