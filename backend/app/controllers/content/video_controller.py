# app/controllers/content/video_controller.py
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import logging

from app.services.content.video_service import VideoService
from app.schemas.content.videos import (
    VideoCreate, VideoUpdate, VideoInDB, VideoPublic,
    VideoCreateFromYouTube, VideoCreateFromVimeo, VideoCreateFromUpload,
    VideoBulkCreate, VideoProcessingUpdate, VideoListResponse, VideoWithContent
)
from app.models.content.videos import Video
from app.core.exceptions import ValidationError, NotFoundError, ConflictError

logger = logging.getLogger(__name__)

class VideoController:
    def __init__(self, db: Session):
        self.db = db
        self.service = VideoService(db)

    def create_video(self, video_data: VideoCreate, user_id: int) -> VideoInDB:
        """Crear nuevo video"""
        try:
            video = self.service.create_video(video_data, user_id)
            return VideoInDB.from_orm(video)
        except (ValidationError, NotFoundError, ConflictError) as e:
            logger.warning(f"⚠️ Error creando video: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado creando video: {e}")
            raise ValidationError(f"Error creando video: {str(e)}")

    def create_video_from_youtube(self, youtube_data: VideoCreateFromYouTube, user_id: int) -> VideoInDB:
        """Crear video desde YouTube"""
        try:
            video = self.service.create_video_from_youtube(youtube_data, user_id)
            return VideoInDB.from_orm(video)
        except (ValidationError, NotFoundError) as e:
            logger.warning(f"⚠️ Error creando video de YouTube: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado creando video de YouTube: {e}")
            raise ValidationError(f"Error creando video de YouTube: {str(e)}")

    def create_video_from_vimeo(self, vimeo_data: VideoCreateFromVimeo, user_id: int) -> VideoInDB:
        """Crear video desde Vimeo"""
        try:
            video = self.service.create_video_from_vimeo(vimeo_data, user_id)
            return VideoInDB.from_orm(video)
        except (ValidationError, NotFoundError) as e:
            logger.warning(f"⚠️ Error creando video de Vimeo: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado creando video de Vimeo: {e}")
            raise ValidationError(f"Error creando video de Vimeo: {str(e)}")

    def create_video_from_upload(self, upload_data: VideoCreateFromUpload, user_id: int) -> VideoInDB:
        """Crear video desde archivo subido"""
        try:
            video = self.service.create_video_from_upload(upload_data, user_id)
            return VideoInDB.from_orm(video)
        except (ValidationError, NotFoundError) as e:
            logger.warning(f"⚠️ Error creando video desde archivo: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado creando video desde archivo: {e}")
            raise ValidationError(f"Error creando video desde archivo: {str(e)}")

    def bulk_create_videos(self, bulk_data: VideoBulkCreate, user_id: int) -> List[VideoInDB]:
        """Crear múltiples videos"""
        try:
            videos = self.service.bulk_create_videos(bulk_data, user_id)
            return [VideoInDB.from_orm(video) for video in videos]
        except Exception as e:
            logger.error(f"💥 Error en creación masiva de videos: {e}")
            raise ValidationError(f"Error en creación masiva: {str(e)}")

    def get_videos(self, skip: int = 0, limit: int = 100, **filters) -> VideoListResponse:
        """Obtener videos con filtros"""
        try:
            videos = self.service.get_videos(skip=skip, limit=limit, **filters)
            video_list = [VideoInDB.from_orm(video) for video in videos]
            
            return VideoListResponse(
                videos=video_list,
                total=len(video_list),
                skip=skip,
                limit=limit,
                **{k: v for k, v in filters.items() if v is not None}
            )
        except Exception as e:
            logger.error(f"💥 Error obteniendo videos: {e}")
            raise

    def get_public_videos(self, skip: int = 0, limit: int = 100, **filters) -> List[VideoPublic]:
        """Obtener videos para endpoint público"""
        try:
            videos = self.service.get_videos(skip=skip, limit=limit, **filters)
            return [VideoPublic.from_orm(video) for video in videos]
        except Exception as e:
            logger.error(f"💥 Error obteniendo videos públicos: {e}")
            raise

    def get_videos_by_content(self, content_id: str, skip: int = 0, limit: int = 100) -> List[VideoInDB]:
        """Obtener videos de un contenido específico"""
        try:
            videos = self.service.get_videos(skip=skip, limit=limit, content_id=content_id)
            return [VideoInDB.from_orm(video) for video in videos]
        except Exception as e:
            logger.error(f"💥 Error obteniendo videos del contenido {content_id}: {e}")
            raise

    def get_video_by_id(self, video_id: str) -> VideoInDB:
        """Obtener video por ID"""
        try:
            video = self.service.get_video_by_id(video_id)
            return VideoInDB.from_orm(video)
        except NotFoundError as e:
            logger.warning(f"⚠️ Video no encontrado: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error obteniendo video: {e}")
            raise

    def get_public_video_by_id(self, video_id: str) -> VideoPublic:
        """Obtener video por ID para endpoint público"""
        try:
            video = self.service.get_video_by_id(video_id)
            return VideoPublic.from_orm(video)
        except NotFoundError as e:
            logger.warning(f"⚠️ Video público no encontrado: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error obteniendo video público: {e}")
            raise

    def get_main_video(self, content_id: str) -> Optional[VideoInDB]:
        """Obtener video principal de un contenido"""
        try:
            video = self.service.get_main_video(content_id)
            return VideoInDB.from_orm(video) if video else None
        except Exception as e:
            logger.error(f"💥 Error obteniendo video principal: {e}")
            raise

    def update_video(self, video_id: str, video_data: VideoUpdate, user_id: int) -> VideoInDB:
        """Actualizar video"""
        try:
            video = self.service.update_video(video_id, video_data, user_id)
            return VideoInDB.from_orm(video)
        except (ValidationError, NotFoundError, ConflictError) as e:
            logger.warning(f"⚠️ Error actualizando video: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado actualizando video: {e}")
            raise

    def delete_video(self, video_id: str, user_id: int) -> Dict[str, Any]:
        """Eliminar video"""
        try:
            success = self.service.delete_video(video_id, user_id)
            return {
                "success": success,
                "message": "Video eliminado exitosamente" if success else "Error eliminando video",
                "video_id": video_id
            }
        except (NotFoundError, ConflictError) as e:
            logger.warning(f"⚠️ Error eliminando video: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado eliminando video: {e}")
            raise

    def set_main_video(self, content_id: str, video_id: str, user_id: int) -> Dict[str, Any]:
        """Establecer video como principal"""
        try:
            success = self.service.set_main_video(content_id, video_id, user_id)
            return {
                "success": success,
                "message": "Video establecido como principal" if success else "Error estableciendo video principal",
                "content_id": content_id,
                "video_id": video_id
            }
        except (ValidationError, NotFoundError) as e:
            logger.warning(f"⚠️ Error estableciendo video principal: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado estableciendo video principal: {e}")
            raise

    def update_processing_status(self, video_id: str, status_data: VideoProcessingUpdate, user_id: int) -> Dict[str, Any]:
        """Actualizar estado de procesamiento"""
        try:
            success = self.service.update_processing_status(video_id, status_data, user_id)
            return {
                "success": success,
                "message": "Estado de procesamiento actualizado" if success else "Error actualizando estado",
                "video_id": video_id,
                "status": status_data.processing_status
            }
        except (NotFoundError, ValidationError) as e:
            logger.warning(f"⚠️ Error actualizando estado de procesamiento: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado actualizando estado: {e}")
            raise

    def reorder_videos(self, content_id: str, video_orders: List[Dict[str, int]], user_id: int) -> Dict[str, Any]:
        """Reordenar videos de un contenido"""
        try:
            success = self.service.reorder_videos(content_id, video_orders, user_id)
            return {
                "success": success,
                "message": "Videos reordenados exitosamente" if success else "Error reordenando videos",
                "content_id": content_id,
                "reordered_count": len(video_orders)
            }
        except Exception as e:
            logger.error(f"💥 Error reordenando videos: {e}")
            raise

    def search_videos(self, query: str, skip: int = 0, limit: int = 100) -> List[VideoInDB]:
        """Buscar videos"""
        try:
            videos = self.service.search_videos(query=query, skip=skip, limit=limit)
            return [VideoInDB.from_orm(video) for video in videos]
        except Exception as e:
            logger.error(f"💥 Error buscando videos: {e}")
            raise

    def get_pending_processing(self, limit: int = 50) -> List[VideoInDB]:
        """Obtener videos pendientes de procesamiento"""
        try:
            videos = self.service.get_pending_processing(limit=limit)
            return [VideoInDB.from_orm(video) for video in videos]
        except Exception as e:
            logger.error(f"💥 Error obteniendo videos pendientes: {e}")
            raise

    def get_failed_processing(self, limit: int = 50) -> List[VideoInDB]:
        """Obtener videos con error en procesamiento"""
        try:
            videos = self.service.get_failed_processing(limit=limit)
            return [VideoInDB.from_orm(video) for video in videos]
        except Exception as e:
            logger.error(f"💥 Error obteniendo videos fallidos: {e}")
            raise

    def get_videos_stats(self) -> Dict[str, Any]:
        """Obtener estadísticas de videos"""
        try:
            stats = self.service.get_videos_stats()
            return {
                "success": True,
                "message": "Estadísticas obtenidas exitosamente",
                "data": stats
            }
        except Exception as e:
            logger.error(f"💥 Error obteniendo estadísticas: {e}")
            raise

    def retry_failed_processing(self, video_id: str, user_id: int) -> Dict[str, Any]:
        """Reintentar procesamiento de video fallido"""
        try:
            success = self.service.retry_failed_processing(video_id, user_id)
            return {
                "success": success,
                "message": "Procesamiento reintentado" if success else "Error reintentando procesamiento",
                "video_id": video_id
            }
        except (ValidationError, NotFoundError) as e:
            logger.warning(f"⚠️ Error reintentando procesamiento: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado reintentando procesamiento: {e}")
            raise