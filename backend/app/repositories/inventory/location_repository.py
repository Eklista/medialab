# ============================================================================
# backend/app/repositories/inventory/location_repository.py
# ============================================================================

from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.inventory.locations import InventoryLocation

class LocationRepository:
    """
    Repositorio para ubicaciones de inventario
    """
    
    @staticmethod
    def get_all_active(db: Session) -> List[InventoryLocation]:
        """
        Obtiene todas las ubicaciones activas
        """
        return db.query(InventoryLocation).filter(
            InventoryLocation.is_active == True
        ).order_by(InventoryLocation.name).all()
    
    @staticmethod
    def get_internal_locations(db: Session) -> List[InventoryLocation]:
        """
        Obtiene solo ubicaciones internas
        """
        return db.query(InventoryLocation).filter(
            InventoryLocation.is_active == True,
            InventoryLocation.is_external == False
        ).order_by(InventoryLocation.name).all()
    
    @staticmethod
    def get_by_id(db: Session, location_id: int) -> Optional[InventoryLocation]:
        """
        Obtiene ubicación por ID
        """
        return db.query(InventoryLocation).filter(
            InventoryLocation.id == location_id
        ).first()
    
    @staticmethod
    def create(db: Session, location_data: dict) -> InventoryLocation:
        """
        Crea nueva ubicación
        """
        db_location = InventoryLocation(**location_data)
        db.add(db_location)
        db.commit()
        db.refresh(db_location)
        return db_location