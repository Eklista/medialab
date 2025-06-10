# app/repositories/content/video_types_repository.py
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from typing import List, Optional, Dict, Any

from app.models.content.video_types import VideoType, StorageProvider
from app.schemas.content.video_types import VideoTypeCreate, VideoTypeUpdate, StorageProviderCreate, StorageProviderUpdate
from app.repositories.base_repository import BaseRepository

class VideoTypeRepository(BaseRepository[VideoType, VideoTypeCreate, VideoTypeUpdate]):
    def __init__(self, db: Session):
        super().__init__(VideoType, db)

    def get_active_types(self, skip: int = 0, limit: int = 100) -> List[VideoType]:
        """Obtener tipos de video activos"""
        return self.db.query(VideoType).filter(
            VideoType.is_active == True
        ).order_by(VideoType.display_name).offset(skip).limit(limit).all()

    def get_by_name(self, name: str) -> Optional[VideoType]:
        """Obtener tipo por nombre"""
        return self.db.query(VideoType).filter(VideoType.name == name).first()

    def search_types(self, query: str, skip: int = 0, limit: int = 100) -> List[VideoType]:
        """Buscar tipos por nombre o descripción"""
        search_term = f"%{query}%"
        return self.db.query(VideoType).filter(
            or_(
                VideoType.name.ilike(search_term),
                VideoType.display_name.ilike(search_term),
                VideoType.description.ilike(search_term)
            )
        ).order_by(VideoType.display_name).offset(skip).limit(limit).all()

class StorageProviderRepository(BaseRepository[StorageProvider, StorageProviderCreate, StorageProviderUpdate]):
    def __init__(self, db: Session):
        super().__init__(StorageProvider, db)

    def get_active_providers(self, skip: int = 0, limit: int = 100) -> List[StorageProvider]:
        """Obtener proveedores activos con tipo de video"""
        return self.db.query(StorageProvider).options(
            joinedload(StorageProvider.video_type)
        ).filter(
            StorageProvider.is_active == True
        ).order_by(StorageProvider.display_name).offset(skip).limit(limit).all()

    def get_by_name(self, name: str) -> Optional[StorageProvider]:
        """Obtener proveedor por nombre"""
        return self.db.query(StorageProvider).filter(StorageProvider.name == name).first()

    def get_by_video_type(self, video_type_id: int) -> List[StorageProvider]:
        """Obtener proveedores por tipo de video"""
        return self.db.query(StorageProvider).options(
            joinedload(StorageProvider.video_type)
        ).filter(
            and_(
                StorageProvider.video_type_id == video_type_id,
                StorageProvider.is_active == True
            )
        ).all()

    def search_providers(self, query: str, skip: int = 0, limit: int = 100) -> List[StorageProvider]:
        """Buscar proveedores"""
        search_term = f"%{query}%"
        return self.db.query(StorageProvider).options(
            joinedload(StorageProvider.video_type)
        ).filter(
            or_(
                StorageProvider.name.ilike(search_term),
                StorageProvider.display_name.ilike(search_term)
            )
        ).order_by(StorageProvider.display_name).offset(skip).limit(limit).all()

    def get_with_video_type(self, provider_id: int) -> Optional[StorageProvider]:
        """Obtener proveedor con su tipo de video"""
        return self.db.query(StorageProvider).options(
            joinedload(StorageProvider.video_type)
        ).filter(StorageProvider.id == provider_id).first()