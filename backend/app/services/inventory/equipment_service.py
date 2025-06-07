# ============================================================================
# backend/app/services/inventory/equipment_service.py
# ============================================================================

from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.repositories.inventory.equipment_repository import EquipmentRepository
from app.models.inventory.equipment import Equipment
from app.utils.inventory_formatters import InventoryFormatter

class EquipmentService:
    """
    Servicio para lógica de negocio de equipos
    """
    
    @staticmethod
    def get_equipment_list(
        db: Session, 
        skip: int = 0, 
        limit: int = 25,
        format_type: str = "list"
    ) -> List[Dict[str, Any]]:
        """
        Obtiene lista de equipos formateada
        """
        equipment_list = EquipmentRepository.get_all_optimized(db, skip, limit)
        return InventoryFormatter.format_equipment_list(equipment_list, format_type)
    
    @staticmethod
    def get_equipment_by_id(db: Session, equipment_id: int) -> Dict[str, Any]:
        """
        Obtiene equipo por ID con detalles completos
        """
        equipment = EquipmentRepository.get_by_id_with_details(db, equipment_id)
        if not equipment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Equipo no encontrado"
            )
        
        return InventoryFormatter.format_equipment_details(equipment)
    
    @staticmethod
    def search_equipment(
        db: Session,
        search_query: str = None,
        filters: Dict[str, Any] = None,
        cursor: int = 0,
        limit: int = 25
    ) -> Dict[str, Any]:
        """
        Búsqueda de equipos con paginación cursor
        """
        if filters is None:
            filters = {}
        
        # Extraer filtros
        category_id = filters.get("category_id")
        state_id = filters.get("state_id")
        location_id = filters.get("location_id")
        assigned_user_id = filters.get("assigned_user_id")
        supplier_id = filters.get("supplier_id")
        
        # Realizar búsqueda
        equipment_list, total_count = EquipmentRepository.search_equipment(
            db=db,
            search_query=search_query,
            category_id=category_id,
            state_id=state_id,
            location_id=location_id,
            assigned_user_id=assigned_user_id,
            supplier_id=supplier_id,
            cursor=cursor,
            limit=limit
        )
        
        # Formatear resultados
        formatted_equipment = InventoryFormatter.format_equipment_list(equipment_list, "search")
        
        # Determinar si hay más resultados
        has_more = len(equipment_list) == limit
        next_cursor = equipment_list[-1].id if equipment_list and has_more else None
        
        return {
            "total_found": total_count,
            "results": formatted_equipment,
            "has_more": has_more,
            "next_cursor": next_cursor,
            "performance_hint": "consider_refining_search" if total_count > 500 else "showing_batch"
        }
    
    @staticmethod
    def create_equipment(
        db: Session, 
        equipment_data: Dict[str, Any], 
        created_by_id: int = None
    ) -> Dict[str, Any]:
        """
        Crea un nuevo equipo con validaciones
        """
        # Validaciones de negocio
        EquipmentService._validate_equipment_data(db, equipment_data)
        
        # Generar código UG si no se proporciona
        if not equipment_data.get("codigo_ug"):
            equipment_data["codigo_ug"] = EquipmentService._generate_equipment_code(
                db, equipment_data.get("category_id")
            )
        
        # Crear equipo
        equipment = EquipmentRepository.create(db, equipment_data, created_by_id)
        
        # Crear detalles de laboratorio si es necesario
        if equipment_data.get("lab_details"):
            EquipmentService._create_lab_details(db, equipment.id, equipment_data["lab_details"])
        
        return InventoryFormatter.format_equipment_details(equipment)
    
    @staticmethod
    def update_equipment(
        db: Session,
        equipment_id: int,
        equipment_data: Dict[str, Any],
        updated_by_id: int = None
    ) -> Dict[str, Any]:
        """
        Actualiza un equipo existente
        """
        equipment = EquipmentRepository.get_by_id_with_details(db, equipment_id)
        if not equipment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Equipo no encontrado"
            )
        
        # Validar datos actualizados
        EquipmentService._validate_equipment_data(db, equipment_data, equipment_id)
        
        # Actualizar equipo
        updated_equipment = EquipmentRepository.update(db, equipment, equipment_data, updated_by_id)
        
        return InventoryFormatter.format_equipment_details(updated_equipment)
    
    @staticmethod
    def delete_equipment(
        db: Session,
        equipment_id: int,
        deleted_by_id: int = None
    ) -> Dict[str, str]:
        """
        Elimina un equipo (soft delete)
        """
        equipment = EquipmentRepository.get_by_id_with_details(db, equipment_id)
        if not equipment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Equipo no encontrado"
            )
        
        # Verificar que no esté asignado
        if equipment.assigned_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede eliminar un equipo asignado"
            )
        
        EquipmentRepository.soft_delete(db, equipment, deleted_by_id)
        
        return {
            "message": f"Equipo {equipment.codigo_ug} eliminado exitosamente"
        }
    
    @staticmethod
    def assign_equipment(
        db: Session,
        equipment_id: int,
        user_id: int,
        updated_by_id: int = None
    ) -> Dict[str, Any]:
        """
        Asigna un equipo a un usuario
        """
        equipment = EquipmentRepository.get_by_id_with_details(db, equipment_id)
        if not equipment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Equipo no encontrado"
            )
        
        # Verificar que el equipo esté disponible
        if equipment.assigned_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El equipo ya está asignado"
            )
        
        # Verificar que el estado sea operativo
        if not equipment.state.is_operational:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede asignar un equipo no operativo"
            )
        
        # Asignar equipo
        update_data = {"assigned_user_id": user_id}
        updated_equipment = EquipmentRepository.update(db, equipment, update_data, updated_by_id)
        
        return InventoryFormatter.format_equipment_details(updated_equipment)
    
    @staticmethod
    def unassign_equipment(
        db: Session,
        equipment_id: int,
        updated_by_id: int = None
    ) -> Dict[str, Any]:
        """
        Desasigna un equipo
        """
        equipment = EquipmentRepository.get_by_id_with_details(db, equipment_id)
        if not equipment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Equipo no encontrado"
            )
        
        if not equipment.assigned_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El equipo no está asignado"
            )
        
        # Desasignar equipo
        update_data = {"assigned_user_id": None}
        updated_equipment = EquipmentRepository.update(db, equipment, update_data, updated_by_id)
        
        return InventoryFormatter.format_equipment_details(updated_equipment)
    
    # ===== MÉTODOS PRIVADOS =====
    
    @staticmethod
    def _validate_equipment_data(db: Session, data: Dict[str, Any], equipment_id: int = None):
        """
        Valida los datos de un equipo
        """
        # Validar código UG único
        if data.get("codigo_ug"):
            from app.repositories.inventory.equipment_repository import EquipmentRepository
            existing = db.query(Equipment).filter(
                Equipment.codigo_ug == data["codigo_ug"],
                Equipment.deleted_at.is_(None)
            ).first()
            
            if existing and (not equipment_id or existing.id != equipment_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El código UG ya está en uso"
                )
        
        # Validar relaciones foráneas
        if data.get("category_id"):
            from app.repositories.inventory.category_repository import CategoryRepository
            if not CategoryRepository.get_by_id(db, data["category_id"]):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Categoría no válida"
                )
    
    @staticmethod
    def _generate_equipment_code(db: Session, category_id: int) -> str:
        """
        Genera un código UG automático
        """
        from app.repositories.inventory.category_repository import CategoryRepository
        
        category = CategoryRepository.get_by_id(db, category_id)
        prefix = category.name[:2].upper() if category else "EQ"
        
        # Obtener el último número
        last_equipment = db.query(Equipment).filter(
            Equipment.codigo_ug.like(f"{prefix}-%"),
            Equipment.deleted_at.is_(None)
        ).order_by(Equipment.id.desc()).first()
        
        if last_equipment and last_equipment.codigo_ug:
            try:
                last_number = int(last_equipment.codigo_ug.split('-')[-1])
                next_number = last_number + 1
            except (ValueError, IndexError):
                next_number = 1
        else:
            next_number = 1
        
        return f"{prefix}-{next_number:04d}"
    
    @staticmethod
    def _create_lab_details(db: Session, equipment_id: int, lab_data: Dict[str, Any]):
        """
        Crea detalles de laboratorio para un equipo
        """
        from app.models.inventory.equipment import EquipmentLab
        from datetime import datetime
        
        lab_data["equipment_id"] = equipment_id
        lab_data["created_at"] = datetime.utcnow()
        lab_data["updated_at"] = datetime.utcnow()
        
        db_lab = EquipmentLab(**lab_data)
        db.add(db_lab)
        db.commit()
        return db_lab