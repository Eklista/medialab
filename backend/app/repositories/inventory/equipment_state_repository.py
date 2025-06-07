# ============================================================================
# backend/app/repositories/inventory/equipment_state_repository.py
# ============================================================================

from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.inventory.equipment_states import EquipmentState

class EquipmentStateRepository:
    """
    Repositorio para estados de equipos
    """
    
    @staticmethod
    def get_all_active(db: Session) -> List[EquipmentState]:
        """
        Obtiene todos los estados activos
        """
        return db.query(EquipmentState).filter(
            EquipmentState.is_active == True
        ).order_by(EquipmentState.name).all()
    
    @staticmethod
    def get_operational_states(db: Session) -> List[EquipmentState]:
        """
        Obtiene solo estados operativos
        """
        return db.query(EquipmentState).filter(
            EquipmentState.is_active == True,
            EquipmentState.is_operational == True
        ).order_by(EquipmentState.name).all()