# app/controllers/content/video_types_controller.py
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import logging

from app.services.content.video_types_service import VideoTypesService
from app.schemas.content.video_types import (
    VideoTypeCreate, VideoTypeUpdate, VideoTypeInDB, VideoTypePublic,
    StorageProviderCreate, StorageProviderUpdate, StorageProviderInDB, StorageProviderPublic
)
from app.models.content.video_types import VideoType, StorageProvider
from app.core.exceptions import ValidationError, NotFoundError, ConflictError

logger = logging.getLogger(__name__)

class VideoTypesController:
    def __init__(self, db: Session):
        self.db = db
        self.service = VideoTypesService(db)

    # Video Types Controllers
    def create_video_type(self, type_data: VideoTypeCreate, user_id: int) -> VideoTypeInDB:
        """Crear nuevo tipo de video"""
        try:
            video_type = self.service.create_video_type(type_data, user_id)
            return VideoTypeInDB.from_orm(video_type)
        except (ValidationError, ConflictError) as e:
            logger.warning(f"⚠️ Error creando tipo de video: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado creando tipo de video: {e}")
            raise ValidationError(f"Error creando tipo de video: {str(e)}")

    def get_video_types(self, skip: int = 0, limit: int = 100, active_only: bool = True) -> List[VideoTypeInDB]:
        """Obtener tipos de video"""
        try:
            types = self.service.get_video_types(skip=skip, limit=limit, active_only=active_only)
            return [VideoTypeInDB.from_orm(t) for t in types]
        except Exception as e:
            logger.error(f"💥 Error obteniendo tipos de video: {e}")
            raise

    def get_public_video_types(self, skip: int = 0, limit: int = 100) -> List[VideoTypePublic]:
        """Obtener tipos de video públicos"""
        try:
            types = self.service.get_video_types(skip=skip, limit=limit, active_only=True)
            return [VideoTypePublic.from_orm(t) for t in types]
        except Exception as e:
            logger.error(f"💥 Error obteniendo tipos de video públicos: {e}")
            raise

    def get_video_type_by_id(self, type_id: int) -> VideoTypeInDB:
        """Obtener tipo de video por ID"""
        try:
            video_type = self.service.get_video_type_by_id(type_id)
            return VideoTypeInDB.from_orm(video_type)
        except NotFoundError as e:
            logger.warning(f"⚠️ Tipo de video no encontrado: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error obteniendo tipo de video: {e}")
            raise

    def update_video_type(self, type_id: int, type_data: VideoTypeUpdate, user_id: int) -> VideoTypeInDB:
        """Actualizar tipo de video"""
        try:
            video_type = self.service.update_video_type(type_id, type_data, user_id)
            return VideoTypeInDB.from_orm(video_type)
        except (ValidationError, NotFoundError, ConflictError) as e:
            logger.warning(f"⚠️ Error actualizando tipo de video: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado actualizando tipo de video: {e}")
            raise

    def delete_video_type(self, type_id: int, user_id: int) -> Dict[str, Any]:
        """Eliminar tipo de video"""
        try:
            success = self.service.delete_video_type(type_id, user_id)
            return {
                "success": success,
                "message": "Tipo de video eliminado exitosamente" if success else "Error eliminando tipo de video",
                "type_id": type_id
            }
        except (NotFoundError, ConflictError) as e:
            logger.warning(f"⚠️ Error eliminando tipo de video: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado eliminando tipo de video: {e}")
            raise

    def search_video_types(self, query: str, skip: int = 0, limit: int = 100) -> List[VideoTypeInDB]:
        """Buscar tipos de video"""
        try:
            types = self.service.search_video_types(query=query, skip=skip, limit=limit)
            return [VideoTypeInDB.from_orm(t) for t in types]
        except Exception as e:
            logger.error(f"💥 Error buscando tipos de video: {e}")
            raise

    # Storage Providers Controllers
    def create_storage_provider(self, provider_data: StorageProviderCreate, user_id: int) -> StorageProviderInDB:
        """Crear nuevo proveedor de almacenamiento"""
        try:
            provider = self.service.create_storage_provider(provider_data, user_id)
            return StorageProviderInDB.from_orm(provider)
        except (ValidationError, ConflictError) as e:
            logger.warning(f"⚠️ Error creando proveedor: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado creando proveedor: {e}")
            raise ValidationError(f"Error creando proveedor: {str(e)}")

    def get_storage_providers(self, skip: int = 0, limit: int = 100, active_only: bool = True) -> List[StorageProviderInDB]:
        """Obtener proveedores de almacenamiento"""
        try:
            providers = self.service.get_storage_providers(skip=skip, limit=limit, active_only=active_only)
            return [StorageProviderInDB.from_orm(p) for p in providers]
        except Exception as e:
            logger.error(f"💥 Error obteniendo proveedores: {e}")
            raise

    def get_public_storage_providers(self, skip: int = 0, limit: int = 100) -> List[StorageProviderPublic]:
        """Obtener proveedores públicos"""
        try:
            providers = self.service.get_storage_providers(skip=skip, limit=limit, active_only=True)
            return [StorageProviderPublic.from_orm(p) for p in providers]
        except Exception as e:
            logger.error(f"💥 Error obteniendo proveedores públicos: {e}")
            raise

    def get_providers_by_video_type(self, video_type_id: int) -> List[StorageProviderInDB]:
        """Obtener proveedores por tipo de video"""
        try:
            providers = self.service.get_providers_by_video_type(video_type_id)
            return [StorageProviderInDB.from_orm(p) for p in providers]
        except Exception as e:
            logger.error(f"💥 Error obteniendo proveedores por tipo: {e}")
            raise

    def get_storage_provider_by_id(self, provider_id: int) -> StorageProviderInDB:
        """Obtener proveedor por ID"""
        try:
            provider = self.service.get_storage_provider_by_id(provider_id)
            return StorageProviderInDB.from_orm(provider)
        except NotFoundError as e:
            logger.warning(f"⚠️ Proveedor no encontrado: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error obteniendo proveedor: {e}")
            raise

    def update_storage_provider(self, provider_id: int, provider_data: StorageProviderUpdate, user_id: int) -> StorageProviderInDB:
        """Actualizar proveedor"""
        try:
            provider = self.service.update_storage_provider(provider_id, provider_data, user_id)
            return StorageProviderInDB.from_orm(provider)
        except (ValidationError, NotFoundError, ConflictError) as e:
            logger.warning(f"⚠️ Error actualizando proveedor: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado actualizando proveedor: {e}")
            raise

    def delete_storage_provider(self, provider_id: int, user_id: int) -> Dict[str, Any]:
        """Eliminar proveedor"""
        try:
            success = self.service.delete_storage_provider(provider_id, user_id)
            return {
                "success": success,
                "message": "Proveedor eliminado exitosamente" if success else "Error eliminando proveedor",
                "provider_id": provider_id
            }
        except (NotFoundError, ConflictError) as e:
            logger.warning(f"⚠️ Error eliminando proveedor: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado eliminando proveedor: {e}")
            raise

    def search_storage_providers(self, query: str, skip: int = 0, limit: int = 100) -> List[StorageProviderInDB]:
        """Buscar proveedores"""
        try:
            providers = self.service.search_storage_providers(query=query, skip=skip, limit=limit)
            return [StorageProviderInDB.from_orm(p) for p in providers]
        except Exception as e:
            logger.error(f"💥 Error buscando proveedores: {e}")
            raise