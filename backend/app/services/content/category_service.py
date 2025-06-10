# app/services/content/category_service.py
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import logging

from app.repositories.content.category_repository import ContentCategoryRepository, DepartmentCategoryRepository
from app.schemas.content.categories import (
    ContentCategoryCreate, ContentCategoryUpdate, ContentCategoryInDB,
    DepartmentCategoryCreate, DepartmentWithCategories
)
from app.models.content.categories import ContentCategory
from app.services.system.audit_service import AuditService
from app.core.exceptions import ValidationError, NotFoundError, ConflictError

logger = logging.getLogger(__name__)

class ContentCategoryService:
    def __init__(self, db: Session):
        self.db = db
        self.category_repo = ContentCategoryRepository(db)
        self.dept_category_repo = DepartmentCategoryRepository(db)

    def create_category(self, category_data: ContentCategoryCreate, user_id: int) -> ContentCategory:
        """Crear nueva categoría de contenido"""
        logger.info(f"🆕 Creando categoría: {category_data.name}")
        
        # Verificar slug único
        existing_slug = self.category_repo.get_by_slug(category_data.slug)
        if existing_slug:
            raise ConflictError(f"El slug '{category_data.slug}' ya existe")
        
        # Verificar nombre único
        existing_name = self.category_repo.get_by_field("name", category_data.name)
        if existing_name:
            raise ConflictError(f"La categoría '{category_data.name}' ya existe")
        
        # Crear categoría
        category = self.category_repo.create(category_data)
        
        # Audit log
        AuditService.log_action(
            db=self.db,
            action="create",
            entity_type="content_category",
            entity_id=category.id,
            user_id=user_id,
            new_values=category_data.dict(),
            details=f"Categoría creada: {category.name}"
        )
        
        logger.info(f"✅ Categoría creada: ID {category.id}")
        return category

    def get_categories(self, skip: int = 0, limit: int = 100, active_only: bool = True) -> List[ContentCategory]:
        """Obtener lista de categorías"""
        if active_only:
            return self.category_repo.get_active_categories(skip=skip, limit=limit)
        return self.category_repo.get_multi(skip=skip, limit=limit)

    def get_public_categories(self, skip: int = 0, limit: int = 100) -> List[ContentCategory]:
        """Obtener categorías para endpoint público"""
        return self.category_repo.get_public_categories(skip=skip, limit=limit)

    def get_category_by_id(self, category_id: int) -> ContentCategory:
        """Obtener categoría por ID"""
        category = self.category_repo.get(category_id)
        if not category:
            raise NotFoundError(f"Categoría con ID {category_id} no encontrada")
        return category

    def get_category_by_slug(self, slug: str) -> ContentCategory:
        """Obtener categoría por slug"""
        category = self.category_repo.get_by_slug(slug)
        if not category:
            raise NotFoundError(f"Categoría con slug '{slug}' no encontrada")
        return category

    def update_category(self, category_id: int, category_data: ContentCategoryUpdate, user_id: int) -> ContentCategory:
        """Actualizar categoría"""
        logger.info(f"📝 Actualizando categoría ID: {category_id}")
        
        category = self.get_category_by_id(category_id)
        old_values = {
            "name": category.name,
            "slug": category.slug,
            "description": category.description,
            "is_active": category.is_active
        }
        
        # Verificar slug único si se está cambiando
        if category_data.slug and category_data.slug != category.slug:
            existing_slug = self.category_repo.get_by_slug(category_data.slug)
            if existing_slug:
                raise ConflictError(f"El slug '{category_data.slug}' ya existe")
        
        # Verificar nombre único si se está cambiando
        if category_data.name and category_data.name != category.name:
            existing_name = self.category_repo.get_by_field("name", category_data.name)
            if existing_name:
                raise ConflictError(f"La categoría '{category_data.name}' ya existe")
        
        # Actualizar
        updated_category = self.category_repo.update(category, category_data)
        
        # Audit log
        AuditService.log_action(
            db=self.db,
            action="update",
            entity_type="content_category",
            entity_id=category_id,
            user_id=user_id,
            old_values=old_values,
            new_values=category_data.dict(exclude_unset=True),
            details=f"Categoría actualizada: {updated_category.name}"
        )
        
        logger.info(f"✅ Categoría actualizada: ID {category_id}")
        return updated_category

    def delete_category(self, category_id: int, user_id: int) -> bool:
        """Eliminar categoría (soft delete)"""
        logger.info(f"🗑️ Eliminando categoría ID: {category_id}")
        
        category = self.get_category_by_id(category_id)
        
        # Verificar si tiene contenido asociado
        content_count = self.db.query("content").filter_by(category_id=category_id).count()
        if content_count > 0:
            raise ConflictError(f"No se puede eliminar la categoría porque tiene {content_count} contenidos asociados")
        
        # Soft delete
        success = self.category_repo.remove(category_id)
        
        if success:
            # Audit log
            AuditService.log_action(
                db=self.db,
                action="delete",
                entity_type="content_category",
                entity_id=category_id,
                user_id=user_id,
                details=f"Categoría eliminada: {category.name}"
            )
            logger.info(f"✅ Categoría eliminada: ID {category_id}")
        
        return success

    def search_categories(self, query: str, skip: int = 0, limit: int = 100) -> List[ContentCategory]:
        """Buscar categorías por nombre o descripción"""
        return self.category_repo.search_categories(query=query, skip=skip, limit=limit)

    # Métodos para relación departamento-categoría
    def assign_category_to_department(self, department_id: int, category_id: int, user_id: int):
        """Asignar categoría a departamento"""
        logger.info(f"🔗 Asignando categoría {category_id} a departamento {department_id}")
        
        # Verificar que existan
        category = self.get_category_by_id(category_id)
        # Aquí verificarías que existe el departamento también
        
        relation = self.dept_category_repo.assign_category_to_department(department_id, category_id)
        
        # Audit log
        AuditService.log_action(
            db=self.db,
            action="assign",
            entity_type="department_category",
            entity_id=relation.id,
            user_id=user_id,
            details=f"Categoría '{category.name}' asignada a departamento {department_id}"
        )
        
        return relation

    def remove_category_from_department(self, department_id: int, category_id: int, user_id: int) -> bool:
        """Remover categoría de departamento"""
        logger.info(f"❌ Removiendo categoría {category_id} de departamento {department_id}")
        
        success = self.dept_category_repo.remove_category_from_department(department_id, category_id)
        
        if success:
            # Audit log
            AuditService.log_action(
                db=self.db,
                action="unassign",
                entity_type="department_category",
                entity_id=f"{department_id}-{category_id}",
                user_id=user_id,
                details=f"Categoría {category_id} removida de departamento {department_id}"
            )
        
        return success

    def get_department_categories(self, department_id: int) -> List[ContentCategory]:
        """Obtener categorías de un departamento"""
        relations = self.dept_category_repo.get_department_categories(department_id)
        return [rel.category for rel in relations if rel.category]

    def get_departments_with_categories(self) -> List[DepartmentWithCategories]:
        """Obtener departamentos con sus categorías"""
        departments = self.dept_category_repo.get_departments_with_categories()
        
        result = []
        for dept in departments:
            active_categories = [
                rel.category for rel in dept.department_categories 
                if rel.is_active and rel.category and rel.category.is_active
            ]
            
            dept_data = DepartmentWithCategories(
                id=dept.id,
                name=dept.name,
                abbreviation=dept.abbreviation,
                categories=active_categories
            )
            result.append(dept_data)
        
        return result