# app/repositories/content/photo_repository.py
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, asc
from typing import List, Optional, Dict, Any
import logging

from app.models.content.photos import Photo
from app.schemas.content.photos import PhotoCreate, PhotoUpdate
from app.repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)

class PhotoRepository(BaseRepository[Photo, PhotoCreate, PhotoUpdate]):
    def __init__(self, db: Session):
        super().__init__(Photo, db)

    def get_with_content(self, photo_id: str) -> Optional[Photo]:
        """Obtener foto con su contenido asociado"""
        return self.db.query(Photo).options(
            joinedload(Photo.content)
        ).filter(Photo.id == photo_id).first()

    def get_by_content(self, content_id: str, skip: int = 0, limit: int = 100) -> List[Photo]:
        """Obtener fotos de un contenido específico"""
        return self.db.query(Photo).filter(
            Photo.content_id == content_id
        ).order_by(Photo.sort_order, Photo.created_at).offset(skip).limit(limit).all()

    def get_featured_photos(self, content_id: str, limit: int = 10) -> List[Photo]:
        """Obtener fotos destacadas de un contenido"""
        return self.db.query(Photo).filter(
            and_(
                Photo.content_id == content_id,
                Photo.is_featured == True
            )
        ).order_by(Photo.sort_order, Photo.created_at).limit(limit).all()

    def get_cover_photo(self, content_id: str) -> Optional[Photo]:
        """Obtener foto de portada de un contenido"""
        return self.db.query(Photo).filter(
            and_(
                Photo.content_id == content_id,
                Photo.is_cover == True
            )
        ).first()

    def search_photos(self, query: str, skip: int = 0, limit: int = 100) -> List[Photo]:
        """Buscar fotos por filename, caption o alt_text"""
        search_term = f"%{query}%"
        return self.db.query(Photo).options(
            joinedload(Photo.content)
        ).filter(
            or_(
                Photo.original_filename.ilike(search_term),
                Photo.caption.ilike(search_term),
                Photo.alt_text.ilike(search_term)
            )
        ).order_by(desc(Photo.created_at)).offset(skip).limit(limit).all()

    def get_photos_by_size(self, min_width: int = 0, min_height: int = 0, skip: int = 0, limit: int = 100) -> List[Photo]:
        """Obtener fotos por tamaño mínimo"""
        return self.db.query(Photo).filter(
            and_(
                Photo.width >= min_width,
                Photo.height >= min_height
            )
        ).order_by(desc(Photo.created_at)).offset(skip).limit(limit).all()

    def set_cover_photo(self, content_id: str, photo_id: str) -> bool:
        """Establecer foto como portada (y quitar flag de otras)"""
        try:
            # Quitar flag is_cover de todas las fotos del contenido
            self.db.query(Photo).filter(
                Photo.content_id == content_id
            ).update({"is_cover": False})
            
            # Establecer la foto específica como portada
            result = self.db.query(Photo).filter(
                and_(
                    Photo.content_id == content_id,
                    Photo.id == photo_id
                )
            ).update({"is_cover": True})
            
            self.db.commit()
            return result > 0
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error estableciendo foto de portada: {e}")
            return False

    def toggle_featured(self, photo_id: str) -> bool:
        """Alternar estado destacado de una foto"""
        try:
            photo = self.db.query(Photo).filter(Photo.id == photo_id).first()
            if not photo:
                return False
            
            photo.is_featured = not photo.is_featured
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error alternando estado destacado: {e}")
            return False

    def reorder_photos(self, content_id: str, photo_orders: List[Dict[str, int]]) -> bool:
        """Reordenar fotos de un contenido"""
        try:
            for order_data in photo_orders:
                self.db.query(Photo).filter(
                    and_(
                        Photo.content_id == content_id,
                        Photo.id == order_data["photo_id"]
                    )
                ).update({"sort_order": order_data["sort_order"]})
            
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error reordenando fotos: {e}")
            return False

    def get_photos_stats(self) -> Dict[str, Any]:
        """Obtener estadísticas de fotos"""
        from sqlalchemy import func
        
        stats = self.db.query(
            func.count(Photo.id).label('total'),
            func.count(Photo.id).filter(Photo.is_featured == True).label('featured'),
            func.count(Photo.id).filter(Photo.is_cover == True).label('covers'),
            func.sum(Photo.file_size).label('total_size'),
            func.avg(Photo.width).label('avg_width'),
            func.avg(Photo.height).label('avg_height')
        ).first()
        
        return {
            "total_photos": stats.total or 0,
            "featured_photos": stats.featured or 0,
            "cover_photos": stats.covers or 0,
            "total_size_bytes": stats.total_size or 0,
            "average_width": int(stats.avg_width or 0),
            "average_height": int(stats.avg_height or 0)
        }

    def get_gallery_data(self, content_id: str) -> Dict[str, Any]:
        """Obtener datos completos de galería para un contenido"""
        # Foto de portada
        cover_photo = self.get_cover_photo(content_id)
        
        # Fotos destacadas
        featured_photos = self.get_featured_photos(content_id, limit=20)
        
        # Todas las fotos
        all_photos = self.get_by_content(content_id, limit=1000)
        
        return {
            "cover_photo": cover_photo,
            "featured_photos": featured_photos,
            "all_photos": all_photos,
            "total_photos": len(all_photos),
            "has_cover": cover_photo is not None,
            "featured_count": len(featured_photos)
        }

    def bulk_update_metadata(self, photo_ids: List[str], metadata: Dict[str, Any]) -> int:
        """Actualizar metadata en lote"""
        try:
            result = self.db.query(Photo).filter(
                Photo.id.in_(photo_ids)
            ).update(metadata, synchronize_session=False)
            
            self.db.commit()
            return result
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error actualizando metadata en lote: {e}")
            return 0

    def get_orphaned_photos(self, limit: int = 100) -> List[Photo]:
        """Obtener fotos sin contenido asociado"""
        return self.db.query(Photo).filter(
            Photo.content_id.is_(None)
        ).limit(limit).all()

    def cleanup_orphaned_photos(self, days_old: int = 30) -> int:
        """Limpiar fotos huérfanas antiguas"""
        from datetime import datetime, timedelta
        
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_old)
            
            result = self.db.query(Photo).filter(
                and_(
                    Photo.content_id.is_(None),
                    Photo.created_at < cutoff_date
                )
            ).delete(synchronize_session=False)
            
            self.db.commit()
            return result
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error limpiando fotos huérfanas: {e}")
            return 0