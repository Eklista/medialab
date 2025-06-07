# ============================================================================
# backend/app/repositories/inventory/category_repository.py
# ============================================================================

from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.inventory.categories import InventoryCategory

class CategoryRepository:
    """
    Repositorio para categorías de inventario
    """
    
    @staticmethod
    def get_all_active(db: Session) -> List[InventoryCategory]:
        """
        Obtiene todas las categorías activas
        """
        return db.query(InventoryCategory).filter(
            InventoryCategory.is_active == True
        ).order_by(InventoryCategory.name).all()
    
    @staticmethod
    def get_equipment_categories(db: Session) -> List[InventoryCategory]:
        """
        Obtiene categorías solo de equipos
        """
        return db.query(InventoryCategory).filter(
            InventoryCategory.is_active == True,
            InventoryCategory.is_equipment == True
        ).order_by(InventoryCategory.name).all()
    
    @staticmethod
    def get_supply_categories(db: Session) -> List[InventoryCategory]:
        """
        Obtiene categorías solo de suministros
        """
        return db.query(InventoryCategory).filter(
            InventoryCategory.is_active == True,
            InventoryCategory.is_equipment == False
        ).order_by(InventoryCategory.name).all()
    
    @staticmethod
    def get_by_id(db: Session, category_id: int) -> Optional[InventoryCategory]:
        """
        Obtiene categoría por ID
        """
        return db.query(InventoryCategory).filter(
            InventoryCategory.id == category_id
        ).first()
    
    @staticmethod
    def create(db: Session, category_data: dict) -> InventoryCategory:
        """
        Crea nueva categoría
        """
        db_category = InventoryCategory(**category_data)
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        return db_category
