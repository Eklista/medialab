# ============================================================================
# backend/app/services/inventory/inventory_search_service.py
# ============================================================================

from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.repositories.inventory.equipment_repository import EquipmentRepository
from app.repositories.inventory.supply_repository import SupplyRepository
from app.repositories.inventory.category_repository import CategoryRepository
from app.repositories.inventory.location_repository import LocationRepository
from app.repositories.inventory.supplier_repository import SupplierRepository
from app.repositories.inventory.equipment_state_repository import EquipmentStateRepository

class InventorySearchService:
    """
    Servicio para búsquedas unificadas de inventario
    """
    
    @staticmethod
    def unified_search(
        db: Session,
        query: str,
        search_type: str = "all",  # "equipment", "supplies", "all"
        limit: int = 50
    ) -> Dict[str, Any]:
        """
        Búsqueda unificada en todo el inventario
        """
        results = {}
        
        if search_type in ["equipment", "all"]:
            equipment_results, _ = EquipmentRepository.search_equipment(
                db=db,
                search_query=query,
                limit=limit // 2 if search_type == "all" else limit
            )
            results["equipment"] = {
                "count": len(equipment_results),
                "items": [
                    {
                        "id": eq.id,
                        "type": "equipment",
                        "title": f"{eq.marca} {eq.modelo}".strip(),
                        "subtitle": eq.codigo_ug,
                        "description": eq.descripcion,
                        "category": eq.category.name if eq.category else None,
                        "state": eq.state.name if eq.state else None,
                        "state_color": eq.state.color if eq.state else "#6B7280"
                    }
                    for eq in equipment_results
                ]
            }
        
        if search_type in ["supplies", "all"]:
            supply_results, _ = SupplyRepository.search_supplies(
                db=db,
                search_query=query,
                limit=limit // 2 if search_type == "all" else limit
            )
            results["supplies"] = {
                "count": len(supply_results),
                "items": [
                    {
                        "id": sup.id,
                        "type": "supply",
                        "title": sup.nombre_producto,
                        "subtitle": sup.codigo,
                        "description": sup.presentacion,
                        "category": sup.category.name if sup.category else None,
                        "stock": sup.stock_actual,
                        "stock_status": "low" if sup.stock_actual <= sup.stock_minimo else "ok"
                    }
                    for sup in supply_results
                ]
            }
        
        # Estadísticas de búsqueda
        total_results = sum(section["count"] for section in results.values())
        
        return {
            "query": query,
            "total_results": total_results,
            "results": results,
            "search_type": search_type,
            "suggestions": InventorySearchService._generate_search_suggestions(db, query)
        }
    
    @staticmethod
    def get_search_filters(db: Session) -> Dict[str, List[Dict[str, Any]]]:
        """
        Obtiene filtros disponibles para búsquedas
        """
        # Categorías de equipos
        equipment_categories = CategoryRepository.get_equipment_categories(db)
        
        # Estados de equipos
        equipment_states = EquipmentStateRepository.get_all_active(db)
        
        # Ubicaciones
        locations = LocationRepository.get_all_active(db)
        
        # Proveedores
        suppliers = SupplierRepository.get_all_active(db)
        
        return {
            "categories": [
                {"id": cat.id, "name": cat.name, "count": 0}
                for cat in equipment_categories
            ],
            "states": [
                {"id": state.id, "name": state.name, "color": state.color, "count": 0}
                for state in equipment_states
            ],
            "locations": [
                {"id": loc.id, "name": loc.name, "is_external": loc.is_external, "count": 0}
                for loc in locations
            ],
            "suppliers": [
                {"id": sup.id, "name": sup.name, "count": 0}
                for sup in suppliers
            ]
        }
    
    @staticmethod
    def _generate_search_suggestions(db: Session, query: str) -> List[str]:
        """
        Genera sugerencias de búsqueda basadas en datos existentes
        """
        suggestions = []
        
        if len(query) >= 2:
            # Sugerencias de marcas comunes
            from sqlalchemy import distinct
            from app.models.inventory.equipment import Equipment
            
            brands = db.query(distinct(Equipment.marca)).filter(
                Equipment.marca.ilike(f"%{query}%"),
                Equipment.marca.isnot(None),
                Equipment.deleted_at.is_(None)
            ).limit(5).all()
            
            suggestions.extend([brand[0] for brand in brands if brand[0]])
            
            # Sugerencias de modelos
            models = db.query(distinct(Equipment.modelo)).filter(
                Equipment.modelo.ilike(f"%{query}%"),
                Equipment.modelo.isnot(None),
                Equipment.deleted_at.is_(None)
            ).limit(3).all()
            
            suggestions.extend([model[0] for model in models if model[0]])
        
        return list(set(suggestions))[:8]  # Eliminar duplicados y limitar