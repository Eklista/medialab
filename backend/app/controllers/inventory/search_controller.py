# ============================================================================
# backend/app/controllers/inventory/search_controller.py
# ============================================================================

from typing import Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import logging

from app.services.inventory.inventory_search_service import InventorySearchService

logger = logging.getLogger(__name__)

class SearchController:
    """
    Controlador para búsquedas de inventario
    """
    
    @staticmethod
    def unified_search(
        db: Session,
        query: str,
        search_type: str = "all",
        limit: int = 50
    ) -> Dict[str, Any]:
        """
        Búsqueda unificada en inventario
        """
        try:
            logger.info(f"🔍 Búsqueda unificada: '{query}', tipo: {search_type}")
            
            if len(query.strip()) < 2:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La búsqueda debe tener al menos 2 caracteres"
                )
            
            results = InventorySearchService.unified_search(
                db=db,
                query=query.strip(),
                search_type=search_type,
                limit=limit
            )
            
            logger.info(f"✅ Búsqueda completada: {results['total_results']} resultados")
            return results
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error en búsqueda unificada: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error en la búsqueda"
            )
    
    @staticmethod
    def get_search_filters(db: Session) -> Dict[str, Any]:
        """
        Obtiene filtros disponibles para búsquedas
        """
        try:
            logger.info("🔧 Obteniendo filtros de búsqueda")
            
            filters = InventorySearchService.get_search_filters(db)
            
            logger.info("✅ Filtros de búsqueda obtenidos")
            return filters
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo filtros de búsqueda: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener filtros de búsqueda"
            )