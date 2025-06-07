# ============================================================================
# backend/app/services/inventory/supply_service.py
# ============================================================================

from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.repositories.inventory.supply_repository import SupplyRepository, SupplyMovementRepository
from app.models.inventory.supplies import Supply
from app.utils.inventory_formatters import InventoryFormatter

class SupplyService:
    """
    Servicio para lógica de negocio de suministros
    """
    
    @staticmethod
    def get_supplies_list(
        db: Session,
        skip: int = 0,
        limit: int = 25,
        format_type: str = "list"
    ) -> List[Dict[str, Any]]:
        """
        Obtiene lista de suministros formateada
        """
        supplies = SupplyRepository.get_all_optimized(db, skip, limit)
        return InventoryFormatter.format_supplies_list(supplies, format_type)
    
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
        if filters is None:
            filters = {}
        
        supplies, total_count = SupplyRepository.search_supplies(
            db=db,
            search_query=search_query,
            category_id=filters.get("category_id"),
            location_id=filters.get("location_id"),
            low_stock_only=filters.get("low_stock_only", False),
            cursor=cursor,
            limit=limit
        )
        
        formatted_supplies = InventoryFormatter.format_supplies_list(supplies, "search")
        
        has_more = len(supplies) == limit
        next_cursor = supplies[-1].id if supplies and has_more else None
        
        return {
            "total_found": total_count,
            "results": formatted_supplies,
            "has_more": has_more,
            "next_cursor": next_cursor
        }
    
    @staticmethod
    def create_supply_movement(
        db: Session,
        supply_id: int,
        movement_type_id: int,
        cantidad: int,
        movement_data: Dict[str, Any] = None,
        created_by_id: int = None
    ) -> Dict[str, Any]:
        """
        Crea un movimiento de suministro y actualiza stock
        """
        if movement_data is None:
            movement_data = {}
        
        # Obtener suministro
        supply = SupplyRepository.get_by_id_with_details(db, supply_id)
        if not supply:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Suministro no encontrado"
            )
        
        # Obtener tipo de movimiento
        from app.repositories.inventory.movement_type_repository import MovementTypeRepository
        movement_type = MovementTypeRepository.get_by_id(db, movement_type_id)
        if not movement_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tipo de movimiento no encontrado"
            )
        
        # Validar cantidad para salidas
        if movement_type.affects_stock == -1 and cantidad > supply.stock_actual:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stock insuficiente para la salida"
            )
        
        # Crear movimiento
        movement_data.update({
            "supply_id": supply_id,
            "movement_type_id": movement_type_id,
            "cantidad": cantidad
        })
        
        movement = SupplyMovementRepository.create_movement(db, movement_data, created_by_id)
        
        # Actualizar stock
        new_stock = supply.stock_actual + (cantidad * movement_type.affects_stock)
        SupplyRepository.update_stock(db, supply, new_stock, created_by_id)
        
        return InventoryFormatter.format_supply_movement(movement)
    
    @staticmethod
    def get_supply_stock_status(db: Session, supply_id: int) -> Dict[str, Any]:
        """
        Obtiene el estado del stock de un suministro
        """
        supply = SupplyRepository.get_by_id_with_details(db, supply_id)
        if not supply:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Suministro no encontrado"
            )
        
        # Determinar estado del stock
        if supply.stock_actual == 0:
            status = "out"
        elif supply.stock_actual <= supply.stock_minimo * 0.5:
            status = "critical"
        elif supply.stock_actual <= supply.stock_minimo:
            status = "low"
        else:
            status = "ok"
        
        # Obtener último movimiento
        movements = SupplyMovementRepository.get_movements_by_supply(db, supply_id, 1)
        last_movement = movements[0] if movements else None
        
        return {
            "supply_id": supply.id,
            "codigo": supply.codigo,
            "nombre_producto": supply.nombre_producto,
            "stock_actual": supply.stock_actual,
            "stock_minimo": supply.stock_minimo,
            "status": status,
            "last_movement": InventoryFormatter.format_supply_movement(last_movement) if last_movement else None
        }
