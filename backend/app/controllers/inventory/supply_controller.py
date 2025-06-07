# ============================================================================
# backend/app/controllers/inventory/supply_controller.py
# ============================================================================

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import logging

from app.services.inventory.supply_service import SupplyService

logger = logging.getLogger(__name__)

class SupplyController:
    """
    Controlador para operaciones de suministros
    """
    
    @staticmethod
    def get_supplies_list(
        db: Session,
        skip: int = 0,
        limit: int = 25,
        format_type: str = "list"
    ) -> List[Dict[str, Any]]:
        """
        Obtiene lista de suministros
        """
        try:
            logger.info(f"📦 Obteniendo lista de suministros: skip={skip}, limit={limit}")
            
            supplies = SupplyService.get_supplies_list(
                db=db,
                skip=skip,
                limit=limit,
                format_type=format_type
            )
            
            logger.info(f"✅ {len(supplies)} suministros obtenidos")
            return supplies
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo suministros: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener suministros"
            )
    
    @staticmethod
    def search_supplies(
        db: Session,
        search_query: str = None,
        filters: Dict[str, Any] = None,
        cursor: int = 0,
        limit: int = 25
    ) -> Dict[str, Any]:
        """
        Búsqueda de suministros
        """
        try:
            logger.info(f"🔍 Búsqueda de suministros: '{search_query}'")
            
            results = SupplyService.search_supplies(
                db=db,
                search_query=search_query,
                filters=filters or {},
                cursor=cursor,
                limit=limit
            )
            
            logger.info(f"✅ {results['total_found']} suministros encontrados")
            return results
            
        except Exception as e:
            logger.error(f"💥 Error en búsqueda de suministros: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error en la búsqueda de suministros"
            )
    
    @staticmethod
    def create_supply_movement(
        db: Session,
        supply_id: int,
        movement_type_id: int,
        cantidad: int,
        movement_data: Dict[str, Any] = None,
        current_user_id: int = None
    ) -> Dict[str, Any]:
        """
        Crea movimiento de suministro
        """
        try:
            logger.info(f"📦 Creando movimiento: suministro {supply_id}, cantidad {cantidad}")
            
            movement = SupplyService.create_supply_movement(
                db=db,
                supply_id=supply_id,
                movement_type_id=movement_type_id,
                cantidad=cantidad,
                movement_data=movement_data or {},
                created_by_id=current_user_id
            )
            
            logger.info(f"✅ Movimiento de suministro creado")
            return movement
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error creando movimiento de suministro: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear movimiento de suministro"
            )
    
    @staticmethod
    def get_supply_stock_status(db: Session, supply_id: int) -> Dict[str, Any]:
        """
        Obtiene estado de stock de suministro
        """
        try:
            logger.info(f"📊 Obteniendo estado de stock: suministro {supply_id}")
            
            status_data = SupplyService.get_supply_stock_status(db, supply_id)
            
            logger.info(f"✅ Estado de stock obtenido: {status_data['status']}")
            return status_data
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error obteniendo estado de stock {supply_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener estado de stock"
            )