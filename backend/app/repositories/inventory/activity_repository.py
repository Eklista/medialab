# ============================================================================
# backend/app/repositories/inventory/activity_repository.py
# ============================================================================

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func, text
from datetime import datetime, timedelta

from app.models.inventory.equipment import Equipment
from app.models.inventory.supplies import Supply, SupplyMovement
from app.models.inventory.categories import InventoryCategory
from app.models.inventory.locations import InventoryLocation
from app.models.inventory.equipment_states import EquipmentState
from app.models.inventory.movement_types import MovementType
from app.models.auth.users import User

class ActivityRepository:
    """
    Repositorio para actividades del sistema de inventario
    """
    
    @staticmethod
    def get_recent_activities(
        db: Session,
        limit: int = 50,
        activity_types: List[str] = None,
        user_id: int = None,
        days_back: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Obtiene actividades recientes del sistema
        """
        activities = []
        cutoff_date = datetime.utcnow() - timedelta(days=days_back)
        
        # Si no se especifican tipos, obtener todos
        if activity_types is None:
            activity_types = [
                'equipment_created', 'equipment_updated', 'equipment_assigned', 
                'equipment_unassigned', 'equipment_deleted',
                'supply_created', 'supply_movement', 'supply_low_stock'
            ]
        
        # ===== ACTIVIDADES DE EQUIPOS =====
        if any(t.startswith('equipment') for t in activity_types):
            equipment_activities = ActivityRepository._get_equipment_activities(
                db, cutoff_date, user_id, limit // 2
            )
            activities.extend(equipment_activities)
        
        # ===== ACTIVIDADES DE SUMINISTROS =====
        if any(t.startswith('supply') for t in activity_types):
            supply_activities = ActivityRepository._get_supply_activities(
                db, cutoff_date, user_id, limit // 2
            )
            activities.extend(supply_activities)
        
        # ===== ACTIVIDADES DE MOVIMIENTOS =====
        if 'supply_movement' in activity_types:
            movement_activities = ActivityRepository._get_movement_activities(
                db, cutoff_date, user_id, limit // 3
            )
            activities.extend(movement_activities)
        
        # Ordenar por timestamp y limitar
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        return activities[:limit]
    
    @staticmethod
    def _get_equipment_activities(
        db: Session, 
        cutoff_date: datetime, 
        user_id: int = None,
        limit: int = 25
    ) -> List[Dict[str, Any]]:
        """
        Obtiene actividades de equipos
        """
        activities = []
        
        # Consulta base para equipos recientes
        query = db.query(Equipment).options(
            joinedload(Equipment.category),
            joinedload(Equipment.state),
            joinedload(Equipment.location),
            joinedload(Equipment.assigned_user),
            joinedload(Equipment.created_by_user),
            joinedload(Equipment.updated_by_user)
        ).filter(
            Equipment.deleted_at.is_(None)
        )
        
        if user_id:
            query = query.filter(
                or_(
                    Equipment.created_by_id == user_id,
                    Equipment.updated_by_id == user_id,
                    Equipment.assigned_user_id == user_id
                )
            )
        
        # Equipos creados recientemente
        recent_created = query.filter(
            Equipment.created_at >= cutoff_date
        ).order_by(Equipment.created_at.desc()).limit(limit // 3).all()
        
        for equipment in recent_created:
            activities.append({
                'id': f"equipment_created_{equipment.id}_{int(equipment.created_at.timestamp())}",
                'type': 'equipment',
                'action': 'created',
                'title': f"Equipo {equipment.codigo_ug or equipment.id} creado",
                'description': f"{equipment.marca} {equipment.modelo} agregado al inventario".strip(),
                'timestamp': equipment.created_at.isoformat(),
                'user': ActivityRepository._format_user(equipment.created_by_user) if hasattr(equipment, 'created_by_user') else None,
                'entity': {
                    'id': equipment.id,
                    'name': equipment.codigo_ug or f"ID-{equipment.id}",
                    'type': 'equipment'
                },
                'metadata': {
                    'category': equipment.category.name if equipment.category else None,
                    'location': equipment.location.name if equipment.location else None,
                    'state': equipment.state.name if equipment.state else None
                },
                'status': 'success',
                'priority': 'medium'
            })
        
        # Equipos actualizados recientemente
        recent_updated = query.filter(
            Equipment.updated_at >= cutoff_date,
            Equipment.created_at < Equipment.updated_at  # Solo actualizaciones, no creaciones
        ).order_by(Equipment.updated_at.desc()).limit(limit // 3).all()
        
        for equipment in recent_updated:
            activities.append({
                'id': f"equipment_updated_{equipment.id}_{int(equipment.updated_at.timestamp())}",
                'type': 'equipment',
                'action': 'updated',
                'title': f"Equipo {equipment.codigo_ug or equipment.id} actualizado",
                'description': f"Información de {equipment.marca} {equipment.modelo} modificada".strip(),
                'timestamp': equipment.updated_at.isoformat(),
                'user': ActivityRepository._format_user(equipment.updated_by_user) if hasattr(equipment, 'updated_by_user') else None,
                'entity': {
                    'id': equipment.id,
                    'name': equipment.codigo_ug or f"ID-{equipment.id}",
                    'type': 'equipment'
                },
                'metadata': {
                    'category': equipment.category.name if equipment.category else None,
                    'location': equipment.location.name if equipment.location else None,
                    'state': equipment.state.name if equipment.state else None
                },
                'status': 'success',
                'priority': 'low'
            })
        
        # Equipos asignados recientemente
        recent_assigned = query.filter(
            Equipment.assigned_user_id.isnot(None),
            Equipment.updated_at >= cutoff_date
        ).order_by(Equipment.updated_at.desc()).limit(limit // 3).all()
        
        for equipment in recent_assigned:
            user_name = "Usuario"
            if equipment.assigned_user:
                first_name = getattr(equipment.assigned_user, 'first_name', '') or ''
                last_name = getattr(equipment.assigned_user, 'last_name', '') or ''
                user_name = f"{first_name} {last_name}".strip() or equipment.assigned_user.email.split('@')[0]
            
            activities.append({
                'id': f"equipment_assigned_{equipment.id}_{int(equipment.updated_at.timestamp())}",
                'type': 'equipment',
                'action': 'assigned',
                'title': f"Equipo {equipment.codigo_ug or equipment.id} asignado",
                'description': f"{equipment.marca} {equipment.modelo} asignado a {user_name}".strip(),
                'timestamp': equipment.updated_at.isoformat(),
                'user': ActivityRepository._format_user(equipment.updated_by_user) if hasattr(equipment, 'updated_by_user') else None,
                'entity': {
                    'id': equipment.id,
                    'name': equipment.codigo_ug or f"ID-{equipment.id}",
                    'type': 'equipment'
                },
                'metadata': {
                    'oldValue': None,
                    'newValue': user_name,
                    'category': equipment.category.name if equipment.category else None,
                    'location': equipment.location.name if equipment.location else None
                },
                'status': 'success',
                'priority': 'high'
            })
        
        return activities
    
    @staticmethod
    def _get_supply_activities(
        db: Session,
        cutoff_date: datetime,
        user_id: int = None,
        limit: int = 25
    ) -> List[Dict[str, Any]]:
        """
        Obtiene actividades de suministros
        """
        activities = []
        
        # Consulta base para suministros
        query = db.query(Supply).options(
            joinedload(Supply.category),
            joinedload(Supply.location)
        ).filter(
            Supply.deleted_at.is_(None),
            Supply.is_active == True
        )
        
        if user_id:
            query = query.filter(
                or_(
                    Supply.created_by_id == user_id,
                    Supply.updated_by_id == user_id
                )
            )
        
        # Suministros creados recientemente
        recent_created = query.filter(
            Supply.created_at >= cutoff_date
        ).order_by(Supply.created_at.desc()).limit(limit // 2).all()
        
        for supply in recent_created:
            activities.append({
                'id': f"supply_created_{supply.id}_{int(supply.created_at.timestamp())}",
                'type': 'supply',
                'action': 'created',
                'title': f"Suministro {supply.codigo or supply.id} creado",
                'description': f"{supply.nombre_producto} agregado al inventario",
                'timestamp': supply.created_at.isoformat(),
                'user': None,  # TODO: Agregar relación created_by si existe
                'entity': {
                    'id': supply.id,
                    'name': supply.codigo or supply.nombre_producto,
                    'type': 'supply'
                },
                'metadata': {
                    'category': supply.category.name if supply.category else None,
                    'location': supply.location.name if supply.location else None,
                    'quantity': supply.stock_actual
                },
                'status': 'success',
                'priority': 'medium'
            })
        
        # Suministros con stock bajo
        low_stock_supplies = query.filter(
            Supply.stock_actual <= Supply.stock_minimo,
            Supply.stock_actual > 0
        ).order_by(Supply.stock_actual).limit(limit // 2).all()
        
        for supply in low_stock_supplies:
            priority = 'critical' if supply.stock_actual <= supply.stock_minimo * 0.5 else 'high'
            
            activities.append({
                'id': f"supply_low_stock_{supply.id}",
                'type': 'supply',
                'action': 'low_stock',
                'title': f"Stock bajo: {supply.nombre_producto}",
                'description': f"Quedan {supply.stock_actual} unidades (mínimo: {supply.stock_minimo})",
                'timestamp': supply.updated_at.isoformat() if supply.updated_at else supply.created_at.isoformat(),
                'user': None,
                'entity': {
                    'id': supply.id,
                    'name': supply.codigo or supply.nombre_producto,
                    'type': 'supply'
                },
                'metadata': {
                    'currentStock': supply.stock_actual,
                    'minimumStock': supply.stock_minimo,
                    'category': supply.category.name if supply.category else None
                },
                'status': 'warning' if priority == 'high' else 'error',
                'priority': priority
            })
        
        return activities
    
    @staticmethod
    def _get_movement_activities(
        db: Session,
        cutoff_date: datetime,
        user_id: int = None,
        limit: int = 15
    ) -> List[Dict[str, Any]]:
        """
        Obtiene actividades de movimientos de stock
        """
        activities = []
        
        # Consulta para movimientos recientes
        query = db.query(SupplyMovement).options(
            joinedload(SupplyMovement.supply).joinedload(Supply.category),
            joinedload(SupplyMovement.movement_type),
            joinedload(SupplyMovement.user_receives),
            joinedload(SupplyMovement.user_delivers_to)
        ).filter(
            SupplyMovement.fecha_movimiento >= cutoff_date
        )
        
        if user_id:
            query = query.filter(
                or_(
                    SupplyMovement.created_by_id == user_id,
                    SupplyMovement.user_receives_id == user_id,
                    SupplyMovement.user_delivers_to_id == user_id
                )
            )
        
        recent_movements = query.order_by(
            SupplyMovement.fecha_movimiento.desc()
        ).limit(limit).all()
        
        for movement in recent_movements:
            movement_type_name = movement.movement_type.name if movement.movement_type else "Movimiento"
            supply_name = movement.supply.nombre_producto if movement.supply else "Producto"
            
            # Determinar el tipo de acción
            if movement.movement_type and movement.movement_type.affects_stock > 0:
                action = 'stock_in'
                description = f"Entrada de {movement.cantidad} unidades de {supply_name}"
            elif movement.movement_type and movement.movement_type.affects_stock < 0:
                action = 'stock_out'
                description = f"Salida de {movement.cantidad} unidades de {supply_name}"
            else:
                action = 'stock_adjusted'
                description = f"Ajuste de {movement.cantidad} unidades de {supply_name}"
            
            activities.append({
                'id': f"movement_{movement.id}_{int(movement.fecha_movimiento.timestamp())}",
                'type': 'movement',
                'action': action,
                'title': f"{movement_type_name}: {supply_name}",
                'description': description,
                'timestamp': movement.fecha_movimiento.isoformat(),
                'user': ActivityRepository._format_user(movement.user_receives) if movement.user_receives else None,
                'entity': {
                    'id': movement.supply.id if movement.supply else movement.id,
                    'name': movement.supply.codigo or supply_name if movement.supply else f"Movimiento-{movement.id}",
                    'type': 'supply'
                },
                'metadata': {
                    'quantity': movement.cantidad,
                    'movementType': movement_type_name,
                    'shipmentNumber': movement.numero_envio,
                    'category': movement.supply.category.name if movement.supply and movement.supply.category else None
                },
                'status': 'success',
                'priority': 'medium'
            })
        
        return activities
    
    @staticmethod
    def get_activity_stats(db: Session, days_back: int = 7) -> Dict[str, Any]:
        """
        Obtiene estadísticas de actividad
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days_back)
        
        # Contar equipos creados
        equipment_created = db.query(Equipment).filter(
            Equipment.created_at >= cutoff_date,
            Equipment.deleted_at.is_(None)
        ).count()
        
        # Contar asignaciones
        equipment_assigned = db.query(Equipment).filter(
            Equipment.updated_at >= cutoff_date,
            Equipment.assigned_user_id.isnot(None),
            Equipment.deleted_at.is_(None)
        ).count()
        
        # Contar movimientos de stock
        stock_movements = db.query(SupplyMovement).filter(
            SupplyMovement.fecha_movimiento >= cutoff_date
        ).count()
        
        # Suministros con stock bajo
        low_stock_count = db.query(Supply).filter(
            Supply.stock_actual <= Supply.stock_minimo,
            Supply.is_active == True,
            Supply.deleted_at.is_(None)
        ).count()
        
        return {
            'equipment_created': equipment_created,
            'equipment_assigned': equipment_assigned,
            'stock_movements': stock_movements,
            'low_stock_alerts': low_stock_count,
            'period_days': days_back
        }
    
    @staticmethod
    def _format_user(user) -> Dict[str, Any]:
        """
        Formatea información del usuario
        """
        if not user:
            return None
        
        first_name = getattr(user, 'first_name', '') or ''
        last_name = getattr(user, 'last_name', '') or ''
        full_name = f"{first_name} {last_name}".strip()
        
        if not full_name:
            full_name = user.email.split('@')[0] if hasattr(user, 'email') and user.email else f"Usuario {user.id}"
        
        return {
            'id': user.id,
            'name': full_name,
            'email': getattr(user, 'email', None)
        }