# backend/app/api/v1/__init__.py
from fastapi import APIRouter
from datetime import datetime

# ✅ IMPORTAR DESDE MÓDULOS ORGANIZADOS
from app.api.v1.auth import auth_router
from app.api.v1.users import users_router
from app.api.v1.organization import organization_router
from app.api.v1.security import security_router
from app.api.v1.templates import templates_router
from app.api.v1.communication import communication_router
from app.api.v1.system import system_router

# Inventario
try:
    from app.api.v1.inventory import inventory_router
    INVENTORY_AVAILABLE = True
except ImportError as e:
    INVENTORY_AVAILABLE = False
    print(f"⚠️  Módulo inventory no disponible: {e}")

# Importar router de administración completo (sin cambios)
try:
    from app.api.v1.admin import admin_router
    ADMIN_AVAILABLE = True
except ImportError as e:
    ADMIN_AVAILABLE = False
    print(f"⚠️  Módulo admin no disponible: {e}")

# También mantener compatibilidad con la importación directa de Redis
try:
    from app.api.v1.admin import redis as redis_admin
    REDIS_ADMIN_AVAILABLE = True
except ImportError:
    REDIS_ADMIN_AVAILABLE = False

api_router = APIRouter()

# ✅ SISTEMA - health sin prefijo (mantiene /health)
api_router.include_router(system_router)

# ✅ AUTH - mantiene /auth/*
api_router.include_router(auth_router, prefix="/auth")

# ✅ USERS - mantiene /users/*
api_router.include_router(users_router, prefix="/users", tags=["users"])

# ✅ ORGANIZATION - SIN PREFIJO ADICIONAL para mantener URLs originales
# Esto mantiene: /areas/, /departments/, /department-types/, /services/
api_router.include_router(organization_router)

# ✅ SECURITY - SIN PREFIJO ADICIONAL para mantener URLs originales  
# Esto mantiene: /roles/, /permissions/
api_router.include_router(security_router)

# ✅ TEMPLATES - SIN PREFIJO ADICIONAL para mantener URLs originales
# Esto mantiene: /service-templates/, /email-templates/
api_router.include_router(templates_router)

# ✅ COMMUNICATION - SIN PREFIJO ADICIONAL para mantener URLs originales
# Esto mantiene: /smtp-config/
api_router.include_router(communication_router)

# ✅ INVENTORY - Sistema completo de gestión de inventario
if INVENTORY_AVAILABLE:
    api_router.include_router(
        inventory_router,
        prefix="/inventory", 
        tags=["inventory"]
    )
    print("✅ Módulo de inventario cargado exitosamente")
else:
    print("⚠️ Módulo de inventario no disponible")

# Incluir router de administración completo si está disponible (sin cambios)
if ADMIN_AVAILABLE:
    api_router.include_router(
        admin_router,
        prefix="/admin",
        tags=["administration"]
    )
    print("✅ Módulo de administración cargado exitosamente")
elif REDIS_ADMIN_AVAILABLE:
    # Fallback: cargar solo Redis admin si el módulo completo no está disponible
    api_router.include_router(
        redis_admin.router,
        prefix="/admin/redis",
        tags=["admin", "redis"]
    )
    print("✅ Redis admin cargado como fallback")
else:
    print("⚠️  No hay módulos de administración disponibles")

# Información del API (actualizada)
API_VERSION = "1.0.0"
API_DESCRIPTION = "MediaLab API - Sistema modular con autenticación segura e inventario"

# Lista de todos los módulos incluidos (actualizada)
INCLUDED_MODULES = [
    "health", "auth", "users", "organization", "security", 
    "templates", "communication"
]

if INVENTORY_AVAILABLE:
    INCLUDED_MODULES.append("inventory")

if ADMIN_AVAILABLE:
    INCLUDED_MODULES.append("admin (completo)")
elif REDIS_ADMIN_AVAILABLE:
    INCLUDED_MODULES.append("admin (solo Redis)")

# Endpoint para obtener información del API (mejorado)
@api_router.get("/", tags=["api-info"])
def get_api_info():
    """
    Información general del API MediaLab
    """
    admin_status = "No disponible"
    if ADMIN_AVAILABLE:
        try:
            from app.api.v1.admin import get_admin_status
            admin_status = get_admin_status()
        except ImportError:
            admin_status = "Módulo admin cargado pero sin estado detallado"
    elif REDIS_ADMIN_AVAILABLE:
        admin_status = "Solo Redis admin disponible"
    
    inventory_status = "Disponible" if INVENTORY_AVAILABLE else "No disponible"
    
    return {
        "api": "MediaLab API",
        "version": API_VERSION,
        "description": API_DESCRIPTION,
        "status": "operational",
        "modules": {
            "total": len(INCLUDED_MODULES),
            "list": INCLUDED_MODULES
        },
        "admin": admin_status,
        "inventory": inventory_status,
        "endpoints": {
            "auth": "Autenticación con cookies httpOnly y sistema híbrido de blacklist",
            "users": "Gestión de usuarios del sistema",
            "areas": "Gestión de áreas organizacionales",
            "departments": "Gestión de departamentos y tipos",
            "services": "Gestión de servicios y proyectos",
            "roles": "Gestión de roles del sistema",
            "permissions": "Gestión de permisos",
            "service-templates": "Plantillas de servicios",
            "email-templates": "Plantillas de correo electrónico",
            "smtp-config": "Configuración SMTP",
            "inventory": "Sistema completo de gestión de inventario (equipos y suministros)",
            "public": "Endpoints públicos",
            "admin": "Administración avanzada del sistema (si está disponible)",
            "health": "Monitoreo de salud del sistema"
        },
        "inventory_features": [
            "Gestión de equipos y suministros",
            "Dashboard con métricas en tiempo real",
            "Búsqueda unificada y avanzada",
            "Scroll infinito optimizado",
            "Asignaciones de equipos",
            "Control de stock automático",
            "Auditoría completa",
            "Exportación de datos",
            "Gestión de categorías y ubicaciones"
        ] if INVENTORY_AVAILABLE else ["No disponible"],
        "security_features": [
            "httpOnly Cookies",
            "Hybrid Token Blacklist (Redis + MySQL)",
            "Rate Limiting",
            "JWE Token Encryption",
            "Password Strength Validation",
            "Failed Attempt Tracking",
            "Session Management",
            "CORS Protection"
        ]
    }

# Endpoint para diagnósticos rápidos (actualizado)
@api_router.get("/diagnostics", tags=["api-info"])
def get_api_diagnostics():
    """
    Diagnósticos rápidos del estado del API
    """
    diagnostics = {
        "timestamp": datetime.utcnow().isoformat(),
        "api_status": "operational",
        "modules_loaded": len(INCLUDED_MODULES),
        "admin_available": ADMIN_AVAILABLE,
        "redis_admin_available": REDIS_ADMIN_AVAILABLE,
        "inventory_available": INVENTORY_AVAILABLE,
        "security_status": "enhanced"
    }
    
    # Verificar configuración de seguridad
    try:
        from app.config.settings import (
            TOKEN_BLACKLIST_ENABLED, RATE_LIMIT_ENABLED, 
            REDIS_ENABLED, ENVIRONMENT
        )
        diagnostics["security_config"] = {
            "token_blacklist": TOKEN_BLACKLIST_ENABLED,
            "rate_limiting": RATE_LIMIT_ENABLED,
            "redis_enabled": REDIS_ENABLED,
            "environment": ENVIRONMENT
        }
    except ImportError:
        diagnostics["security_config"] = "No disponible"
    
    # Verificar estado del inventario
    if INVENTORY_AVAILABLE:
        try:
            # Verificar que los modelos de inventario estén disponibles
            from app.models.inventory.equipment import Equipment
            from app.models.inventory.supplies import Supply
            diagnostics["inventory_status"] = {
                "models_loaded": True,
                "equipment_model": "OK",
                "supplies_model": "OK",
                "endpoints_available": True
            }
        except ImportError as e:
            diagnostics["inventory_status"] = {
                "models_loaded": False,
                "error": str(e)
            }
    else:
        diagnostics["inventory_status"] = "Not available"
    
    return diagnostics

# Endpoint específico para el estado del inventario
@api_router.get("/inventory-status", tags=["api-info"])
def get_inventory_status():
    """
    Estado específico del módulo de inventario
    """
    if not INVENTORY_AVAILABLE:
        return {
            "available": False,
            "reason": "Module not imported",
            "suggestion": "Verify inventory module files exist and dependencies are met"
        }
    
    try:
        # Verificar componentes del inventario
        components_status = {}
        
        # Verificar modelos
        try:
            from app.models.inventory.equipment import Equipment
            from app.models.inventory.supplies import Supply
            components_status["models"] = "OK"
        except ImportError as e:
            components_status["models"] = f"ERROR: {str(e)}"
        
        # Verificar schemas
        try:
            from app.schemas.inventory.equipment import EquipmentCreate
            from app.schemas.inventory.supplies import SupplyCreate
            components_status["schemas"] = "OK"
        except ImportError as e:
            components_status["schemas"] = f"ERROR: {str(e)}"
        
        # Verificar servicios
        try:
            from app.services.inventory.equipment_service import EquipmentService
            from app.services.inventory.supply_service import SupplyService
            components_status["services"] = "OK"
        except ImportError as e:
            components_status["services"] = f"ERROR: {str(e)}"
        
        # Verificar controladores
        try:
            from app.controllers.inventory.equipment_controller import EquipmentController
            from app.controllers.inventory.supply_controller import SupplyController
            components_status["controllers"] = "OK"
        except ImportError as e:
            components_status["controllers"] = f"ERROR: {str(e)}"
        
        # Verificar repositorios
        try:
            from app.repositories.inventory.equipment_repository import EquipmentRepository
            from app.repositories.inventory.supply_repository import SupplyRepository
            components_status["repositories"] = "OK"
        except ImportError as e:
            components_status["repositories"] = f"ERROR: {str(e)}"
        
        return {
            "available": True,
            "status": "operational",
            "components": components_status,
            "endpoints": {
                "dashboard": "/api/v1/inventory/dashboard/",
                "equipment": "/api/v1/inventory/equipment/",
                "supplies": "/api/v1/inventory/supplies/",
                "search": "/api/v1/inventory/search/unified",
                "common": "/api/v1/inventory/common/"
            },
            "features": [
                "Equipment management",
                "Supplies management", 
                "Dashboard with metrics",
                "Advanced search",
                "Infinite scroll pagination",
                "Equipment assignments",
                "Stock control",
                "Complete audit trail"
            ]
        }
        
    except Exception as e:
        return {
            "available": True,
            "status": "error",
            "error": str(e)
        }

print(f"🚀 MediaLab API v{API_VERSION} inicializado con {len(INCLUDED_MODULES)} módulos")
if INVENTORY_AVAILABLE:
    print(f"📦 Módulo de inventario disponible en: /api/v1/inventory/")
else:
    print(f"⚠️ Módulo de inventario no disponible")