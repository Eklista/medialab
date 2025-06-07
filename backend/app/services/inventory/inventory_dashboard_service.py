# ============================================================================
# backend/app/services/inventory/inventory_dashboard_service.py
# ============================================================================

from typing import Dict, Any, List
from sqlalchemy.orm import Session
from datetime import datetime

from app.repositories.inventory.equipment_repository import EquipmentRepository
from app.repositories.inventory.supply_repository import SupplyRepository

class InventoryDashboardService:
    """
    Servicio para el dashboard de inventario
    """
    
    @staticmethod
    def get_dashboard_data(db: Session) -> Dict[str, Any]:
        """
        Obtiene todos los datos del dashboard
        """
        # Métricas principales
        equipment_metrics = EquipmentRepository.get_metrics(db)
        supply_metrics = SupplyRepository.get_metrics(db)
        
        metrics = {**equipment_metrics, **supply_metrics}
        
        # Resúmenes
        categories_summary = EquipmentRepository.get_categories_summary(db)
        locations_summary = EquipmentRepository.get_locations_summary(db)
        
        # Actividad reciente
        recent_activity = EquipmentRepository.get_recent_activity(db, 10)
        
        # Alertas
        alerts = InventoryDashboardService._generate_alerts(db, metrics)
        
        return {
            "metrics": metrics,
            "categories_summary": categories_summary,
            "locations_summary": locations_summary,
            "recent_activity": recent_activity,
            "alerts": alerts,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def get_quick_stats(db: Session) -> Dict[str, Any]:
        """
        Estadísticas rápidas para widgets
        """
        equipment_metrics = EquipmentRepository.get_metrics(db)
        supply_metrics = SupplyRepository.get_metrics(db)
        
        return {
            "total_items": equipment_metrics["total_equipment"] + supply_metrics["total_supplies"],
            "operational_equipment": equipment_metrics["active_equipment"],
            "low_stock_alerts": supply_metrics["low_stock_supplies"],
            "assignment_rate": round(
                (equipment_metrics["assigned_equipment"] / equipment_metrics["total_equipment"] * 100) 
                if equipment_metrics["total_equipment"] > 0 else 0, 1
            )
        }
    
    @staticmethod
    def _generate_alerts(db: Session, metrics: Dict[str, Any]) -> List[str]:
        """
        Genera alertas basadas en las métricas
        """
        alerts = []
        
        # Alertas de equipos dañados
        if metrics.get("damaged_equipment", 0) > 0:
            alerts.append(f"{metrics['damaged_equipment']} equipos necesitan mantenimiento")
        
        # Alertas de stock bajo
        if metrics.get("low_stock_supplies", 0) > 0:
            alerts.append(f"{metrics['low_stock_supplies']} suministros con stock bajo")
        
        # Alerta de tasa de asignación baja
        if metrics.get("total_equipment", 0) > 0:
            assignment_rate = (metrics.get("assigned_equipment", 0) / metrics["total_equipment"]) * 100
            if assignment_rate < 70:
                alerts.append(f"Tasa de asignación baja ({assignment_rate:.1f}%)")
        
        return alerts