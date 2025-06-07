# ============================================================================
# backend/app/repositories/inventory/supply_repository.py
# ============================================================================

from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import and_, or_, func, desc
from datetime import datetime

from app.models.inventory.supplies import Supply, SupplyMovement
from app.models.inventory.categories import InventoryCategory
from app.models.inventory.movement_types import MovementType

class SupplyRepository:
    """
    Repositorio para operaciones de acceso a datos de suministros
    """
    
    @staticmethod
    def get_all_optimized(
        db: Session, 
        skip: int = 0, 
        limit: int = 25,
        load_relations: bool = True
    ) -> List[Supply]:
        """
        Obtiene suministros con carga optimizada
        """
        query = db.query(Supply)
        
        if load_relations:
            query = query.options(
                joinedload(Supply.category),
                joinedload(Supply.location)
            )
        
        return query.filter(
            Supply.deleted_at.is_(None),
            Supply.is_active == True
        ).order_by(Supply.nombre_producto).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id_with_details(db: Session, supply_id: int) -> Optional[Supply]:
        """
        Obtiene suministro por ID con detalles
        """
        return db.query(Supply).options(
            joinedload(Supply.category),
            joinedload(Supply.location)
        ).filter(
            Supply.id == supply_id,
            Supply.deleted_at.is_(None)
        ).first()
    
    @staticmethod
    def search_supplies(
        db: Session,
        search_query: str = None,
        category_id: int = None,
        location_id: int = None,
        low_stock_only: bool = False,
        cursor: int = 0,
        limit: int = 25
    ) -> Tuple[List[Supply], int]:
        """
        Búsqueda de suministros con filtros
        """
        query = db.query(Supply).options(
            joinedload(Supply.category),
            joinedload(Supply.location)
        )
        
        # Filtros base
        query = query.filter(
            Supply.deleted_at.is_(None),
            Supply.is_active == True
        )
        
        # Búsqueda por texto
        if search_query:
            search_filter = or_(
                Supply.codigo.ilike(f"%{search_query}%"),
                Supply.nombre_producto.ilike(f"%{search_query}%"),
                Supply.presentacion.ilike(f"%{search_query}%"),
                Supply.descripcion.ilike(f"%{search_query}%")
            )
            query = query.filter(search_filter)
        
        # Filtros específicos
        if category_id:
            query = query.filter(Supply.category_id == category_id)
        
        if location_id:
            query = query.filter(Supply.location_id == location_id)
        
        if low_stock_only:
            query = query.filter(Supply.stock_actual <= Supply.stock_minimo)
        
        # Cursor pagination
        if cursor > 0:
            query = query.filter(Supply.id > cursor)
        
        # Contar total
        total_count = query.count()
        
        # Aplicar límite
        results = query.order_by(Supply.nombre_producto).limit(limit).all()
        
        return results, total_count
    
    @staticmethod
    def get_low_stock_supplies(db: Session, limit: int = 50) -> List[Supply]:
        """
        Obtiene suministros con stock bajo
        """
        return db.query(Supply).options(
            joinedload(Supply.category)
        ).filter(
            Supply.deleted_at.is_(None),
            Supply.is_active == True,
            Supply.stock_actual <= Supply.stock_minimo
        ).order_by(Supply.stock_actual).limit(limit).all()
    
    @staticmethod
    def get_metrics(db: Session) -> Dict[str, int]:
        """
        Métricas de suministros
        """
        base_query = db.query(Supply).filter(
            Supply.deleted_at.is_(None),
            Supply.is_active == True
        )
        
        total = base_query.count()
        low_stock = base_query.filter(
            Supply.stock_actual <= Supply.stock_minimo
        ).count()
        
        return {
            "total_supplies": total,
            "low_stock_supplies": low_stock
        }
    
    @staticmethod
    def create(db: Session, supply_data: dict, created_by_id: int = None) -> Supply:
        """
        Crea un nuevo suministro
        """
        supply_data["created_by_id"] = created_by_id
        supply_data["created_at"] = datetime.utcnow()
        supply_data["updated_at"] = datetime.utcnow()
        
        db_supply = Supply(**supply_data)
        db.add(db_supply)
        db.commit()
        db.refresh(db_supply)
        return db_supply
    
    @staticmethod
    def update_stock(db: Session, supply: Supply, new_stock: int, updated_by_id: int = None) -> Supply:
        """
        Actualiza stock de un suministro
        """
        supply.stock_actual = new_stock
        supply.updated_by_id = updated_by_id
        supply.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(supply)
        return supply

class SupplyMovementRepository:
    """
    Repositorio para movimientos de suministros
    """
    
    @staticmethod
    def create_movement(
        db: Session, 
        movement_data: dict, 
        created_by_id: int = None
    ) -> SupplyMovement:
        """
        Crea un movimiento de suministro
        """
        movement_data["created_by_id"] = created_by_id
        movement_data["created_at"] = datetime.utcnow()
        
        if "fecha_movimiento" not in movement_data:
            movement_data["fecha_movimiento"] = datetime.utcnow()
        
        db_movement = SupplyMovement(**movement_data)
        db.add(db_movement)
        db.commit()
        db.refresh(db_movement)
        return db_movement
    
    @staticmethod
    def get_movements_by_supply(
        db: Session, 
        supply_id: int, 
        limit: int = 50
    ) -> List[SupplyMovement]:
        """
        Obtiene movimientos de un suministro específico
        """
        return db.query(SupplyMovement).options(
            joinedload(SupplyMovement.movement_type),
            selectinload(SupplyMovement.user_receives),
            selectinload(SupplyMovement.user_delivers_to)
        ).filter(
            SupplyMovement.supply_id == supply_id
        ).order_by(SupplyMovement.fecha_movimiento.desc()).limit(limit).all()