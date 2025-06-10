# app/controllers/content/category_controller.py
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import logging

from app.services.content.category_service import ContentCategoryService
from app.schemas.content.categories import (
    ContentCategoryCreate, ContentCategoryUpdate, ContentCategoryInDB, ContentCategoryPublic,
    DepartmentWithCategories
)
from app.models.content.categories import ContentCategory
from app.core.exceptions import ValidationError, NotFoundError, ConflictError

logger = logging.getLogger(__name__)

class ContentCategoryController:
    def __init__(self, db: Session):
        self.db = db
        self.service = ContentCategoryService(db)

    def create_category(self, category_data: ContentCategoryCreate, user_id: int) -> ContentCategoryInDB:
        """Crear nueva categoría"""
        try:
            category = self.service.create_category(category_data, user_id)
            return ContentCategoryInDB.from_orm(category)
        except (ValidationError, ConflictError) as e:
            logger.warning(f"⚠️ Error creando categoría: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado creando categoría: {e}")
            raise ValidationError(f"Error creando categoría: {str(e)}")

    def get_categories(self, skip: int = 0, limit: int = 100, active_only: bool = True) -> List[ContentCategoryInDB]:
        """Obtener lista de categorías"""
        try:
            categories = self.service.get_categories(skip=skip, limit=limit, active_only=active_only)
            return [ContentCategoryInDB.from_orm(cat) for cat in categories]
        except Exception as e:
            logger.error(f"💥 Error obteniendo categorías: {e}")
            raise

    def get_public_categories(self, skip: int = 0, limit: int = 100) -> List[ContentCategoryPublic]:
        """Obtener categorías públicas (sin info interna)"""
        try:
            categories = self.service.get_public_categories(skip=skip, limit=limit)
            return [ContentCategoryPublic.from_orm(cat) for cat in categories]
        except Exception as e:
            logger.error(f"💥 Error obteniendo categorías públicas: {e}")
            raise

    def get_category_by_id(self, category_id: int) -> ContentCategoryInDB:
        """Obtener categoría por ID"""
        try:
            category = self.service.get_category_by_id(category_id)
            return ContentCategoryInDB.from_orm(category)
        except NotFoundError as e:
            logger.warning(f"⚠️ Categoría no encontrada: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error obteniendo categoría: {e}")
            raise

    def get_category_by_slug(self, slug: str) -> ContentCategoryInDB:
        """Obtener categoría por slug"""
        try:
            category = self.service.get_category_by_slug(slug)
            return ContentCategoryInDB.from_orm(category)
        except NotFoundError as e:
            logger.warning(f"⚠️ Categoría no encontrada: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error obteniendo categoría por slug: {e}")
            raise

    def update_category(self, category_id: int, category_data: ContentCategoryUpdate, user_id: int) -> ContentCategoryInDB:
        """Actualizar categoría"""
        try:
            category = self.service.update_category(category_id, category_data, user_id)
            return ContentCategoryInDB.from_orm(category)
        except (ValidationError, NotFoundError, ConflictError) as e:
            logger.warning(f"⚠️ Error actualizando categoría: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado actualizando categoría: {e}")
            raise

    def delete_category(self, category_id: int, user_id: int) -> Dict[str, Any]:
        """Eliminar categoría"""
        try:
            success = self.service.delete_category(category_id, user_id)
            return {
                "success": success,
                "message": "Categoría eliminada exitosamente" if success else "Error eliminando categoría",
                "category_id": category_id
            }
        except (NotFoundError, ConflictError) as e:
            logger.warning(f"⚠️ Error eliminando categoría: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado eliminando categoría: {e}")
            raise

    def search_categories(self, query: str, skip: int = 0, limit: int = 100) -> List[ContentCategoryInDB]:
        """Buscar categorías"""
        try:
            categories = self.service.search_categories(query=query, skip=skip, limit=limit)
            return [ContentCategoryInDB.from_orm(cat) for cat in categories]
        except Exception as e:
            logger.error(f"💥 Error buscando categorías: {e}")
            raise

    def assign_category_to_department(self, department_id: int, category_id: int, user_id: int) -> Dict[str, Any]:
        """Asignar categoría a departamento"""
        try:
            relation = self.service.assign_category_to_department(department_id, category_id, user_id)
            return {
                "success": True,
                "message": "Categoría asignada exitosamente",
                "department_id": department_id,
                "category_id": category_id,
                "relation_id": relation.id
            }
        except (NotFoundError, ConflictError) as e:
            logger.warning(f"⚠️ Error asignando categoría: {e}")
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado asignando categoría: {e}")
            raise

    def remove_category_from_department(self, department_id: int, category_id: int, user_id: int) -> Dict[str, Any]:
        """Remover categoría de departamento"""
        try:
            success = self.service.remove_category_from_department(department_id, category_id, user_id)
            return {
                "success": success,
                "message": "Categoría removida exitosamente" if success else "Error removiendo categoría",
                "department_id": department_id,
                "category_id": category_id
            }
        except Exception as e:
            logger.error(f"💥 Error removiendo categoría de departamento: {e}")
            raise

    def get_departments_with_categories(self) -> List[DepartmentWithCategories]:
        """Obtener departamentos con sus categorías"""
        try:
            return self.service.get_departments_with_categories()
        except Exception as e:
            logger.error(f"💥 Error obteniendo departamentos con categorías: {e}")
            raise