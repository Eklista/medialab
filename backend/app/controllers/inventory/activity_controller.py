# ============================================================================
# backend/app/controllers/inventory/activity_controller.py
# ============================================================================

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import logging

from app.services.inventory.activity_service import ActivityService

logger = logging.getLogger(__name__)

class ActivityController:
    """
    Controlador para actividades de inventario
    """
    
    @staticmethod
    def get_activity_feed(
        db: Session,
        limit: int = 50,
        activity_types: Optional[str] = None,
        user_id: Optional[int] = None,
        days_back: int = 30
    ) -> Dict[str, Any]:
        """
        Obtiene feed de actividades
        """
        try:
            logger.info(f"📋 Obteniendo feed de actividades: limit={limit}, days_back={days_back}")
            
            # Procesar tipos de actividad
            types_list = None
            if activity_types and activity_types != "all":
                types_list = [t.strip() for t in activity_types.split(',') if t.strip()]
            
            # Obtener actividades
            activity_feed = ActivityService.get_activity_feed(
                db=db,
                limit=limit,
                activity_types=types_list,
                user_id=user_id,
                days_back=days_back
            )
            
            logger.info(f"✅ {activity_feed['total']} actividades obtenidas")
            return activity_feed
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo feed de actividades: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener feed de actividades"
            )
    
    @staticmethod
    def get_activity_types(db: Session) -> List[Dict[str, Any]]:
        """
        Obtiene tipos de actividades disponibles
        """
        try:
            logger.info("🏷️ Obteniendo tipos de actividades")
            
            types = ActivityService.get_activity_types(db)
            
            logger.info(f"✅ {len(types)} tipos de actividades obtenidos")
            return types
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo tipos de actividades: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener tipos de actividades"
            )
    
    @staticmethod
    def get_activity_summary(db: Session) -> Dict[str, Any]:
        """
        Obtiene resumen de actividad reciente
        """
        try:
            logger.info("📊 Obteniendo resumen de actividades")
            
            summary = ActivityService.get_recent_activity_summary(db)
            
            logger.info("✅ Resumen de actividades obtenido")
            return summary
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo resumen de actividades: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener resumen de actividades"
            )
    
    @staticmethod
    def mark_activity_read(
        db: Session,
        activity_id: str,
        user_id: int
    ) -> Dict[str, Any]:
        """
        Marca actividad como leída
        """
        try:
            logger.info(f"👁️ Marcando actividad {activity_id} como leída")
            
            result = ActivityService.mark_activity_as_read(
                db=db,
                activity_id=activity_id,
                user_id=user_id
            )
            
            logger.info(f"✅ Actividad {activity_id} marcada como leída")
            return result
            
        except Exception as e:
            logger.error(f"💥 Error marcando actividad como leída: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al marcar actividad como leída"
            )