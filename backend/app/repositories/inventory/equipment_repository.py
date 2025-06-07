# ============================================================================
# backend/app/repositories/inventory/equipment_repository.py
# ============================================================================

from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import and_, or_, func, desc
from datetime import datetime, timedelta

from app.models.inventory.equipment import Equipment, EquipmentLab
from app.models.inventory.categories import InventoryCategory
from app.models.inventory.locations import InventoryLocation
from app.models.inventory.equipment_states import EquipmentState

class EquipmentRepository:
    """
    Repositorio para operaciones de acceso a datos de equipos
    """
    
    @staticmethod
    def get_all_optimized(
        db: Session, 
        skip: int = 0, 
        limit: int = 25,
        load_relations: bool = True
    ) -> List[Equipment]:
        """
        Obtiene equipos con carga optimizada de relaciones
        """
        query = db.query(Equipment)
        
        if load_relations:
            query = query.options(
                joinedload(Equipment.category),
                joinedload(Equipment.state),
                joinedload(Equipment.location),
                selectinload(Equipment.assigned_user),
                selectinload(Equipment.supplier)
            )
        
        return query.filter(
            Equipment.deleted_at.is_(None)
        ).order_by(Equipment.id.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id_with_details(db: Session, equipment_id: int) -> Optional[Equipment]:
        """
        Obtiene equipo por ID con todos los detalles cargados
        """
        return db.query(Equipment).options(
            joinedload(Equipment.category),
            joinedload(Equipment.state),
            joinedload(Equipment.location),
            selectinload(Equipment.assigned_user),
            selectinload(Equipment.supplier),
            selectinload(Equipment.lab_details).selectinload(EquipmentLab.supplier)
        ).filter(
            Equipment.id == equipment_id,
            Equipment.deleted_at.is_(None)
        ).first()
    
    @staticmethod
    def search_equipment(
        db: Session,
        search_query: str = None,
        category_id: int = None,
        state_id: int = None,
        location_id: int = None,
        assigned_user_id: int = None,
        supplier_id: int = None,
        cursor: int = 0,
        limit: int = 25
    ) -> Tuple[List[Equipment], int]:
        """
        Búsqueda avanzada de equipos con filtros y cursor pagination
        """
        query = db.query(Equipment).options(
            joinedload(Equipment.category),
            joinedload(Equipment.state),
            joinedload(Equipment.location),
            selectinload(Equipment.assigned_user)
        )
        
        # Filtro base: no eliminados
        query = query.filter(Equipment.deleted_at.is_(None))
        
        # Filtro de búsqueda por texto
        if search_query:
            search_filter = or_(
                Equipment.codigo_ug.ilike(f"%{search_query}%"),
                Equipment.numero_serie.ilike(f"%{search_query}%"),
                Equipment.service_tag.ilike(f"%{search_query}%"),
                Equipment.marca.ilike(f"%{search_query}%"),
                Equipment.modelo.ilike(f"%{search_query}%"),
                Equipment.descripcion.ilike(f"%{search_query}%")
            )
            query = query.filter(search_filter)
        
        # Filtros específicos
        if category_id:
            query = query.filter(Equipment.category_id == category_id)
        
        if state_id:
            query = query.filter(Equipment.state_id == state_id)
        
        if location_id:
            query = query.filter(Equipment.location_id == location_id)
        
        if assigned_user_id:
            query = query.filter(Equipment.assigned_user_id == assigned_user_id)
        
        if supplier_id:
            query = query.filter(Equipment.supplier_id == supplier_id)
        
        # Cursor pagination
        if cursor > 0:
            query = query.filter(Equipment.id > cursor)
        
        # Contar total antes de aplicar limit
        total_count = query.count()
        
        # Aplicar orden y límite
        results = query.order_by(Equipment.id.desc()).limit(limit).all()
        
        return results, total_count
    
    @staticmethod
    def get_metrics(db: Session) -> Dict[str, int]:
        """
        Obtiene métricas básicas de equipos
        """
        base_query = db.query(Equipment).filter(Equipment.deleted_at.is_(None))
        
        total = base_query.count()
        
        # Equipos operativos (join con estados)
        active = base_query.join(Equipment.state).filter(
            EquipmentState.is_operational == True
        ).count()
        
        # Equipos dañados/no operativos
        damaged = base_query.join(Equipment.state).filter(
            EquipmentState.is_operational == False
        ).count()
        
        # Equipos asignados
        assigned = base_query.filter(
            Equipment.assigned_user_id.isnot(None)
        ).count()
        
        return {
            "total_equipment": total,
            "active_equipment": active,
            "damaged_equipment": damaged,
            "assigned_equipment": assigned
        }
    
    @staticmethod
    def get_categories_summary(db: Session) -> List[Dict[str, Any]]:
        """
        Resumen por categorías
        """
        results = db.query(
            InventoryCategory.id,
            InventoryCategory.name,
            func.count(Equipment.id).label('total_count'),
            func.count(
                func.nullif(EquipmentState.is_operational, False)
            ).label('operational_count')
        ).select_from(InventoryCategory).outerjoin(
            Equipment, and_(
                Equipment.category_id == InventoryCategory.id,
                Equipment.deleted_at.is_(None)
            )
        ).outerjoin(
            EquipmentState, Equipment.state_id == EquipmentState.id
        ).filter(
            InventoryCategory.is_equipment == True,
            InventoryCategory.is_active == True
        ).group_by(
            InventoryCategory.id, 
            InventoryCategory.name
        ).all()
        
        # Calcular porcentajes
        total_equipment = sum(result.total_count for result in results)
        
        summary = []
        for result in results:
            percentage = (result.total_count / total_equipment * 100) if total_equipment > 0 else 0
            summary.append({
                "id": result.id,
                "name": result.name,
                "count": result.total_count,
                "operational_count": result.operational_count,
                "percentage": round(percentage, 1)
            })
        
        return summary
    
    @staticmethod
    def get_locations_summary(db: Session) -> List[Dict[str, Any]]:
        """
        Resumen por ubicaciones
        """
        results = db.query(
            InventoryLocation.id,
            InventoryLocation.name,
            func.count(Equipment.id).label('count')
        ).select_from(InventoryLocation).outerjoin(
            Equipment, and_(
                Equipment.location_id == InventoryLocation.id,
                Equipment.deleted_at.is_(None)
            )
        ).filter(
            InventoryLocation.is_active == True
        ).group_by(
            InventoryLocation.id,
            InventoryLocation.name
        ).all()
        
        # Calcular porcentajes
        total = sum(result.count for result in results)
        
        summary = []
        for result in results:
            percentage = (result.count / total * 100) if total > 0 else 0
            summary.append({
                "id": result.id,
                "name": result.name,
                "count": result.count,
                "percentage": round(percentage, 1)
            })
        
        return summary
    
    @staticmethod
    def create(db: Session, equipment_data: dict, created_by_id: int = None) -> Equipment:
        """
        Crea un nuevo equipo
        """
        equipment_data["created_by_id"] = created_by_id
        equipment_data["created_at"] = datetime.utcnow()
        equipment_data["updated_at"] = datetime.utcnow()
        
        db_equipment = Equipment(**equipment_data)
        db.add(db_equipment)
        db.commit()
        db.refresh(db_equipment)
        return db_equipment
    
    @staticmethod
    def update(db: Session, equipment: Equipment, equipment_data: dict, updated_by_id: int = None) -> Equipment:
        """
        Actualiza un equipo existente
        """
        equipment_data["updated_by_id"] = updated_by_id
        equipment_data["updated_at"] = datetime.utcnow()
        
        for field, value in equipment_data.items():
            setattr(equipment, field, value)
        
        db.commit()
        db.refresh(equipment)
        return equipment
    
    @staticmethod
    def soft_delete(db: Session, equipment: Equipment, deleted_by_id: int = None) -> Equipment:
        """
        Eliminación suave de equipo
        """
        equipment.deleted_at = datetime.utcnow()
        equipment.deleted_by_id = deleted_by_id
        db.commit()
        return equipment
    
    @staticmethod
    def get_recent_activity(db: Session, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Obtiene actividad reciente de equipos
        """
        # Equipos creados recientemente
        recent_created = db.query(Equipment).options(
            joinedload(Equipment.category),
            joinedload(Equipment.state)
        ).filter(
            Equipment.deleted_at.is_(None)
        ).order_by(Equipment.created_at.desc()).limit(limit).all()
        
        activity = []
        for equipment in recent_created:
            activity.append({
                "type": "equipment_created",
                "equipment_id": equipment.id,
                "equipment_code": equipment.codigo_ug,
                "equipment_brand": equipment.marca,
                "equipment_model": equipment.modelo,
                "category": equipment.category.name if equipment.category else None,
                "state": equipment.state.name if equipment.state else None,
                "timestamp": equipment.created_at.isoformat(),
                "description": f"Nuevo equipo {equipment.marca} {equipment.modelo} agregado"
            })
        
        return activity[:limit]