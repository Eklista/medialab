# app/services/content/video_types_service.py
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import logging

from app.repositories.content.video_types_repository import VideoTypeRepository, StorageProviderRepository
from app.schemas.content.video_types import (
    VideoTypeCreate, VideoTypeUpdate, StorageProviderCreate, StorageProviderUpdate
)
from app.models.content.video_types import VideoType, StorageProvider
from app.services.system.audit_service import AuditService
from app.core.exceptions import ValidationError, NotFoundError, ConflictError

logger = logging.getLogger(__name__)

class VideoTypesService:
    def __init__(self, db: Session):
        self.db = db
        self.video_type_repo = VideoTypeRepository(db)
        self.provider_repo = StorageProviderRepository(db)

    # CRUD Video Types
    def create_video_type(self, type_data: VideoTypeCreate, user_id: int) -> VideoType:
        """Crear nuevo tipo de video"""
        logger.info(f"🆕 Creando tipo de video: {type_data.name}")
        
        # Verificar nombre único
        existing = self.video_type_repo.get_by_name(type_data.name)
        if existing:
            raise ConflictError(f"El tipo de video '{type_data.name}' ya existe")
        
        video_type = self.video_type_repo.create(type_data)
        
        # Audit log
        AuditService.log_action(
            db=self.db,
            action="create",
            entity_type="video_type",
            entity_id=video_type.id,
            user_id=user_id,
            new_values=type_data.dict(),
            details=f"Tipo de video creado: {video_type.name}"
        )
        
        return video_type

    def get_video_types(self, skip: int = 0, limit: int = 100, active_only: bool = True) -> List[VideoType]:
        """Obtener tipos de video"""
        if active_only:
            return self.video_type_repo.get_active_types(skip=skip, limit=limit)
        return self.video_type_repo.get_multi(skip=skip, limit=limit)

    def get_video_type_by_id(self, type_id: int) -> VideoType:
        """Obtener tipo por ID"""
        video_type = self.video_type_repo.get(type_id)
        if not video_type:
            raise NotFoundError(f"Tipo de video con ID {type_id} no encontrado")
        return video_type

    def update_video_type(self, type_id: int, type_data: VideoTypeUpdate, user_id: int) -> VideoType:
        """Actualizar tipo de video"""
        video_type = self.get_video_type_by_id(type_id)
        old_values = {"name": video_type.name, "display_name": video_type.display_name}
        
        # Verificar nombre único si cambió
        if type_data.name and type_data.name != video_type.name:
            existing = self.video_type_repo.get_by_name(type_data.name)
            if existing:
                raise ConflictError(f"El tipo de video '{type_data.name}' ya existe")
        
        updated = self.video_type_repo.update(video_type, type_data)
        
        # Audit log
        AuditService.log_action(
            db=self.db,
            action="update",
            entity_type="video_type",
            entity_id=type_id,
            user_id=user_id,
            old_values=old_values,
            new_values=type_data.dict(exclude_unset=True)
        )
        
        return updated

    def delete_video_type(self, type_id: int, user_id: int) -> bool:
        """Eliminar tipo de video"""
        video_type = self.get_video_type_by_id(type_id)
        
        # Verificar si tiene proveedores asociados
        providers = self.provider_repo.get_by_video_type(type_id)
        if providers:
            raise ConflictError(f"No se puede eliminar: tiene {len(providers)} proveedores asociados")
        
        success = self.video_type_repo.remove(type_id)
        
        if success:
            AuditService.log_action(
                db=self.db,
                action="delete",
                entity_type="video_type",
                entity_id=type_id,
                user_id=user_id,
                details=f"Tipo de video eliminado: {video_type.name}"
            )
        
        return success

    # CRUD Storage Providers
    def create_storage_provider(self, provider_data: StorageProviderCreate, user_id: int) -> StorageProvider:
        """Crear nuevo proveedor de almacenamiento"""
        logger.info(f"🆕 Creando proveedor: {provider_data.name}")
        
        # Verificar que existe el tipo de video
        video_type = self.get_video_type_by_id(provider_data.video_type_id)
        
        # Verificar nombre único
        existing = self.provider_repo.get_by_name(provider_data.name)
        if existing:
            raise ConflictError(f"El proveedor '{provider_data.name}' ya existe")
        
        provider = self.provider_repo.create(provider_data)
        
        # Audit log
        AuditService.log_action(
            db=self.db,
            action="create",
            entity_type="storage_provider",
            entity_id=provider.id,
            user_id=user_id,
            new_values=provider_data.dict(),
            details=f"Proveedor creado: {provider.name} para {video_type.name}"
        )
        
        return provider

    def get_storage_providers(self, skip: int = 0, limit: int = 100, active_only: bool = True) -> List[StorageProvider]:
        """Obtener proveedores de almacenamiento"""
        if active_only:
            return self.provider_repo.get_active_providers(skip=skip, limit=limit)
        return self.provider_repo.get_multi(skip=skip, limit=limit)

    def get_providers_by_video_type(self, video_type_id: int) -> List[StorageProvider]:
        """Obtener proveedores por tipo de video"""
        return self.provider_repo.get_by_video_type(video_type_id)

    def get_storage_provider_by_id(self, provider_id: int) -> StorageProvider:
        """Obtener proveedor por ID"""
        provider = self.provider_repo.get_with_video_type(provider_id)
        if not provider:
            raise NotFoundError(f"Proveedor con ID {provider_id} no encontrado")
        return provider

    def update_storage_provider(self, provider_id: int, provider_data: StorageProviderUpdate, user_id: int) -> StorageProvider:
        """Actualizar proveedor"""
        provider = self.get_storage_provider_by_id(provider_id)
        old_values = {"name": provider.name, "display_name": provider.display_name}
        
        # Verificar nombre único si cambió
        if provider_data.name and provider_data.name != provider.name:
            existing = self.provider_repo.get_by_name(provider_data.name)
            if existing:
                raise ConflictError(f"El proveedor '{provider_data.name}' ya existe")
        
        # Verificar video_type si cambió
        if provider_data.video_type_id and provider_data.video_type_id != provider.video_type_id:
            self.get_video_type_by_id(provider_data.video_type_id)
        
        updated = self.provider_repo.update(provider, provider_data)
        
        # Audit log
        AuditService.log_action(
            db=self.db,
            action="update",
            entity_type="storage_provider",
            entity_id=provider_id,
            user_id=user_id,
            old_values=old_values,
            new_values=provider_data.dict(exclude_unset=True)
        )
        
        return updated

    def delete_storage_provider(self, provider_id: int, user_id: int) -> bool:
        """Eliminar proveedor"""
        provider = self.get_storage_provider_by_id(provider_id)
        
        # Verificar si tiene videos asociados
        # videos_count = self.db.query("videos").filter_by(storage_provider_id=provider_id).count()
        # if videos_count > 0:
        #     raise ConflictError(f"No se puede eliminar: tiene {videos_count} videos asociados")
        
        success = self.provider_repo.remove(provider_id)
        
        if success:
            AuditService.log_action(
                db=self.db,
                action="delete",
                entity_type="storage_provider",
                entity_id=provider_id,
                user_id=user_id,
                details=f"Proveedor eliminado: {provider.name}"
            )
        
        return success

    def search_video_types(self, query: str, skip: int = 0, limit: int = 100) -> List[VideoType]:
        """Buscar tipos de video"""
        return self.video_type_repo.search_types(query=query, skip=skip, limit=limit)

    def search_storage_providers(self, query: str, skip: int = 0, limit: int = 100) -> List[StorageProvider]:
        """Buscar proveedores"""
        return self.provider_repo.search_providers(query=query, skip=skip, limit=limit)