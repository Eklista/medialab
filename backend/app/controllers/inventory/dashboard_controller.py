# ============================================================================
# backend/app/controllers/inventory/dashboard_controller.py
# ============================================================================

from typing import Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import logging

from app.services.inventory.inventory_dashboard_service import InventoryDashboardService

logger = logging.getLogger(__name__)

class DashboardController:
    """
    Controlador para dashboard de inventario
    """
    
    @staticmethod
    def get_dashboard_data(db: Session) -> Dict[str, Any]:
        """
        Obtiene datos completos del dashboard
        """
        try:
            logger.info("📊 Obteniendo datos del dashboard de inventario")
            
            dashboard_data = InventoryDashboardService.get_dashboard_data(db)
            
            logger.info("✅ Datos del dashboard obtenidos exitosamente")
            return dashboard_data
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo datos del dashboard: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener datos del dashboard"
            )
    
    @staticmethod
    def get_quick_stats(db: Session) -> Dict[str, Any]:
        """
        Obtiene estadísticas rápidas
        """
        try:
            logger.info("⚡ Obteniendo estadísticas rápidas")
            
            stats = InventoryDashboardService.get_quick_stats(db)
            
            logger.info("✅ Estadísticas rápidas obtenidas")
            return stats
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo estadísticas rápidas: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener estadísticas"
            )
