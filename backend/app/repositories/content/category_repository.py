# app/repositories/content/category_repository.py
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from typing import List, Optional, Dict, Any
import logging

from app.models.content.categories import ContentCategory, DepartmentCategory
from app.models.organization.departments import Department
from app.schemas.content.categories import ContentCategoryCreate, ContentCategoryUpdate
from app.repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)

class ContentCategoryRepository(BaseRepository[ContentCategory, ContentCategoryCreate, ContentCategoryUpdate]):
    def __init__(self, db: Session):
        super().__init__(ContentCategory, db)

    def get_active_categories(self, skip: int = 0, limit: int = 100) -> List[ContentCategory]:
        """Obtener categorías activas"""
        return self.db.query(ContentCategory).filter(
            ContentCategory.is_active == True
        ).order_by(ContentCategory.sort_order, ContentCategory.name).offset(skip).limit(limit).all()

    def get_by_slug(self, slug: str) -> Optional[ContentCategory]:
        """Obtener categoría por slug"""
        return self.db.query(ContentCategory).filter(ContentCategory.slug == slug).first()

    def get_public_categories(self, skip: int = 0, limit: int = 100) -> List[ContentCategory]:
        """Obtener categorías para endpoint público"""
        return self.db.query(ContentCategory).filter(
            ContentCategory.is_active == True
        ).order_by(ContentCategory.sort_order, ContentCategory.name).offset(skip).limit(limit).all()

    def search_categories(self, query: str, skip: int = 0, limit: int = 100) -> List[ContentCategory]:
        """Buscar categorías por nombre o descripción"""
        search_term = f"%{query}%"
        return self.db.query(ContentCategory).filter(
            and_(
                ContentCategory.is_active == True,
                or_(
                    ContentCategory.name.ilike(search_term),
                    ContentCategory.description.ilike(search_term)
                )
            )
        ).order_by(ContentCategory.sort_order).offset(skip).limit(limit).all()

class DepartmentCategoryRepository(BaseRepository[DepartmentCategory, Any, Any]):
    def __init__(self, db: Session):
        super().__init__(DepartmentCategory, db)

    def get_department_categories(self, department_id: int) -> List[DepartmentCategory]:
        """Obtener categorías de un departamento"""
        return self.db.query(DepartmentCategory).options(
            joinedload(DepartmentCategory.category)
        ).filter(
            and_(
                DepartmentCategory.department_id == department_id,
                DepartmentCategory.is_active == True
            )
        ).all()

    def get_category_departments(self, category_id: int) -> List[DepartmentCategory]:
        """Obtener departamentos que usan una categoría"""
        return self.db.query(DepartmentCategory).options(
            joinedload(DepartmentCategory.department)
        ).filter(
            and_(
                DepartmentCategory.category_id == category_id,
                DepartmentCategory.is_active == True
            )
        ).all()

    def assign_category_to_department(self, department_id: int, category_id: int) -> DepartmentCategory:
        """Asignar categoría a departamento"""
        # Verificar si ya existe
        existing = self.db.query(DepartmentCategory).filter(
            and_(
                DepartmentCategory.department_id == department_id,
                DepartmentCategory.category_id == category_id
            )
        ).first()

        if existing:
            existing.is_active = True
            self.db.commit()
            return existing
        else:
            new_relation = DepartmentCategory(
                department_id=department_id,
                category_id=category_id,
                is_active=True
            )
            self.db.add(new_relation)
            self.db.commit()
            return new_relation

    def remove_category_from_department(self, department_id: int, category_id: int) -> bool:
        """Remover categoría de departamento (soft delete)"""
        relation = self.db.query(DepartmentCategory).filter(
            and_(
                DepartmentCategory.department_id == department_id,
                DepartmentCategory.category_id == category_id
            )
        ).first()

        if relation:
            relation.is_active = False
            self.db.commit()
            return True
        return False

    def get_departments_with_categories(self) -> List[Dict[str, Any]]:
        """Obtener todos los departamentos con sus categorías activas"""
        return self.db.query(Department).options(
            joinedload(Department.department_categories).joinedload(DepartmentCategory.category)
        ).all()