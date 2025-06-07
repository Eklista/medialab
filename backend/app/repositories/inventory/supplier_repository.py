# ============================================================================
# backend/app/repositories/inventory/supplier_repository.py
# ============================================================================

from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.inventory.suppliers import Supplier

class SupplierRepository:
    """
    Repositorio para proveedores
    """
    
    @staticmethod
    def get_all_active(db: Session) -> List[Supplier]:
        """
        Obtiene todos los proveedores activos
        """
        return db.query(Supplier).filter(
            Supplier.is_active == True,
            Supplier.deleted_at.is_(None)
        ).order_by(Supplier.name).all()
    
    @staticmethod
    def get_by_id(db: Session, supplier_id: int) -> Optional[Supplier]:
        """
        Obtiene proveedor por ID
        """
        return db.query(Supplier).filter(
            Supplier.id == supplier_id,
            Supplier.deleted_at.is_(None)
        ).first()
