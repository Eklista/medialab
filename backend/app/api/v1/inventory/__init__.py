# ============================================================================
# backend/app/api/v1/inventory/__init__.py - ACTUALIZADO
# ============================================================================

from fastapi import APIRouter
from .equipment import router as equipment_router
from .supplies import router as supplies_router
from .dashboard import router as dashboard_router
from .search import router as search_router
from .common import router as common_router
from .activities import router as activities_router 

inventory_router = APIRouter()

# Incluir todos los routers
inventory_router.include_router(equipment_router, prefix="/equipment", tags=["inventory-equipment"])
inventory_router.include_router(supplies_router, prefix="/supplies", tags=["inventory-supplies"])
inventory_router.include_router(dashboard_router, prefix="/dashboard", tags=["inventory-dashboard"])
inventory_router.include_router(search_router, prefix="/search", tags=["inventory-search"])
inventory_router.include_router(common_router, prefix="/common", tags=["inventory-common"])
inventory_router.include_router(activities_router, prefix="/activities", tags=["inventory-activities"])

# Endpoint de salud del módulo
@inventory_router.get("/health")
def inventory_health_check():
    """
    Health check del módulo de inventario
    """
    return {
        "module": "inventory",
        "status": "healthy",
        "endpoints": [
            "/equipment - Gestión de equipos",
            "/supplies - Gestión de suministros", 
            "/dashboard - Dashboard y métricas",
            "/search - Búsquedas unificadas",
            "/common - Datos maestros (categorías, ubicaciones, etc.)",
            "/activities - Feed de actividades"  # 🆕 NUEVO
        ]
    }