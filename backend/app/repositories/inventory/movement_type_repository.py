# ============================================================================
# backend/app/repositories/inventory/movement_type_repository.py
# ============================================================================

from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.inventory.movement_types import MovementType

class MovementTypeRepository:
    """
    Repositorio para tipos de movimiento
    """
    
    @staticmethod
    def get_all_active(db: Session) -> List[MovementType]:
        """
        Obtiene todos los tipos de movimiento activos
        """
        return db.query(MovementType).filter(
            MovementType.is_active == True
        ).order_by(MovementType.name).all()
    
    @staticmethod
    def get_by_id(db: Session, movement_type_id: int) -> Optional[MovementType]:
        """
        Obtiene tipo de movimiento por ID
        """
        return db.query(MovementType).filter(
            MovementType.id == movement_type_id
        ).first()
        