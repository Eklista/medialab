# app/repositories/content/video_repository.py
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, asc
from typing import List, Optional, Dict, Any
import logging

from app.models.content.videos import Video
from app.schemas.content.videos import VideoCreate, VideoUpdate
from app.repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)

class VideoRepository(BaseRepository[Video, VideoCreate, VideoUpdate]):
    def __init__(self, db: Session):
        super().__init__(Video, db)

    def get_with_relations(self, video_id: str) -> Optional[Video]:
        """Obtener video con sus relaciones"""
        return self.db.query(Video).options(
            joinedload(Video.content),
            joinedload(Video.video_type),
            joinedload(Video.storage_provider)
        ).filter(Video.id == video_id).first()

    def get_by_content(self, content_id: str, skip: int = 0, limit: int = 100) -> List[Video]:
        """Obtener videos de un contenido específico"""
        return self.db.query(Video).options(
            joinedload(Video.video_type),
            joinedload(Video.storage_provider)
        ).filter(
            Video.content_id == content_id
        ).order_by(Video.sort_order, Video.created_at).offset(skip).limit(limit).all()

    def get_main_video(self, content_id: str) -> Optional[Video]:
        """Obtener video principal de un contenido"""
        return self.db.query(Video).filter(
            and_(
                Video.content_id == content_id,
                Video.is_main == True
            )
        ).first()

    def get_by_video_type(self, video_type_id: int, skip: int = 0, limit: int = 100) -> List[Video]:
        """Obtener videos por tipo"""
        return self.db.query(Video).options(
            joinedload(Video.content),
            joinedload(Video.storage_provider)
        ).filter(
            Video.video_type_id == video_type_id
        ).order_by(desc(Video.created_at)).offset(skip).limit(limit).all()

    def get_by_processing_status(self, status: str, skip: int = 0, limit: int = 100) -> List[Video]:
        """Obtener videos por estado de procesamiento"""
        return self.db.query(Video).options(
            joinedload(Video.content),
            joinedload(Video.video_type)
        ).filter(
            Video.processing_status == status
        ).order_by(Video.created_at).offset(skip).limit(limit).all()

    def get_by_storage_provider(self, provider_id: int, skip: int = 0, limit: int = 100) -> List[Video]:
        """Obtener videos por proveedor de almacenamiento"""
        return self.db.query(Video).options(
            joinedload(Video.content),
            joinedload(Video.video_type)
        ).filter(
            Video.storage_provider_id == provider_id
        ).order_by(desc(Video.created_at)).offset(skip).limit(limit).all()

    def search_videos(self, query: str, skip: int = 0, limit: int = 100) -> List[Video]:
        """Buscar videos por filename o video_id"""
        search_term = f"%{query}%"
        return self.db.query(Video).options(
            joinedload(Video.content),
            joinedload(Video.video_type)
        ).filter(
            or_(
                Video.original_filename.ilike(search_term),
                Video.video_id.ilike(search_term),
                Video.video_url.ilike(search_term)
            )
        ).order_by(desc(Video.created_at)).offset(skip).limit(limit).all()

    def get_pending_processing(self, limit: int = 50) -> List[Video]:
        """Obtener videos pendientes de procesamiento"""
        return self.db.query(Video).filter(
            Video.processing_status.in_(['pending', 'processing'])
        ).order_by(Video.created_at).limit(limit).all()

    def get_failed_processing(self, limit: int = 50) -> List[Video]:
        """Obtener videos con error en procesamiento"""
        return self.db.query(Video).filter(
            Video.processing_status == 'error'
        ).order_by(desc(Video.updated_at)).limit(limit).all()

    def set_main_video(self, content_id: str, video_id: str) -> bool:
        """Establecer video como principal (y quitar flag de otros)"""
        try:
            # Quitar flag is_main de todos los videos del contenido
            self.db.query(Video).filter(
                Video.content_id == content_id
            ).update({"is_main": False})
            
            # Establecer el video específico como principal
            result = self.db.query(Video).filter(
                and_(
                    Video.content_id == content_id,
                    Video.id == video_id
                )
            ).update({"is_main": True})
            
            self.db.commit()
            return result > 0
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error estableciendo video principal: {e}")
            return False

    def update_processing_status(self, video_id: str, status: str, error_message: Optional[str] = None) -> bool:
        """Actualizar estado de procesamiento"""
        try:
            update_data = {"processing_status": status}
            if error_message:
                update_data["error_message"] = error_message
            if status == "completed":
                update_data["is_processed"] = True
                update_data["error_message"] = None
            
            result = self.db.query(Video).filter(
                Video.id == video_id
            ).update(update_data)
            
            self.db.commit()
            return result > 0
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error actualizando estado de procesamiento: {e}")
            return False

    def get_videos_stats(self) -> Dict[str, Any]:
        """Obtener estadísticas de videos"""
        from sqlalchemy import func
        
        stats = self.db.query(
            func.count(Video.id).label('total'),
            func.count(Video.id).filter(Video.is_processed == True).label('processed'),
            func.count(Video.id).filter(Video.processing_status == 'pending').label('pending'),
            func.count(Video.id).filter(Video.processing_status == 'error').label('failed'),
            func.sum(Video.file_size).label('total_size')
        ).first()
        
        return {
            "total_videos": stats.total or 0,
            "processed_videos": stats.processed or 0,
            "pending_videos": stats.pending or 0,
            "failed_videos": stats.failed or 0,
            "total_size_bytes": stats.total_size or 0
        }

    def reorder_videos(self, content_id: str, video_orders: List[Dict[str, int]]) -> bool:
        """Reordenar videos de un contenido"""
        try:
            for order_data in video_orders:
                self.db.query(Video).filter(
                    and_(
                        Video.content_id == content_id,
                        Video.id == order_data["video_id"]
                    )
                ).update({"sort_order": order_data["sort_order"]})
            
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error reordenando videos: {e}")
            return False