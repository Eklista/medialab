# backend/app/api/v1/admin/__init__.py
"""
Módulo de administración para MediaLab
Contiene endpoints administrativos para gestión del sistema
"""

from fastapi import APIRouter
from app.api.v1.admin import redis

# Crear el router principal de administración
admin_router = APIRouter()

# Incluir el módulo de Redis
admin_router.include_router(
    redis.router, 
    prefix="/redis", 
    tags=["admin", "redis"]
)

# Función para obtener el estado del módulo admin
def get_admin_status():
    """
    Obtiene el estado actual del módulo de administración
    """
    return {
        "status": "operational",
        "modules": ["redis"],
        "redis_admin": "available"
    }

# Información del módulo
__version__ = "1.0.0"
__description__ = "MediaLab Administration Module with Redis management"

# Lista de endpoints disponibles
AVAILABLE_ENDPOINTS = [
    "GET /admin/redis/health - Estado de salud de Redis",
    "GET /admin/redis/stats - Estadísticas de Redis y seguridad",
    "GET /admin/redis/info - Información detallada del servidor Redis",
    "GET /admin/redis/keys - Obtener claves de Redis",
    "GET /admin/redis/key/{key_name} - Obtener valor de una clave específica",
    "DELETE /admin/redis/key/{key_name} - Eliminar una clave específica",
    "POST /admin/redis/blacklist/clear - Limpiar blacklist de tokens",
    "POST /admin/redis/rate-limit/reset - Resetear rate limits",
    "GET /admin/redis/monitoring - Datos de monitoreo en tiempo real",
    "GET /admin/redis/cache/stats - Estadísticas del sistema de cache",
    "POST /admin/redis/cache/invalidate - Invalidar cache según patrón",
    "POST /admin/redis/cache/flush - Limpiar todo el cache",
    "GET /admin/redis/sessions/stats - Estadísticas del sistema de sesiones",
    "GET /admin/redis/sessions/active-users - Lista de usuarios activos",
    "POST /admin/redis/sessions/force-logout/{user_id} - Forzar logout de usuario",
    "POST /admin/redis/sessions/cleanup - Limpiar sesiones expiradas",
    "GET /admin/redis/cleanup/status - Estado de tareas de limpieza",
    "POST /admin/redis/cleanup/manual - Ejecutar limpieza manual",
    "GET /admin/redis/system/status - Estado completo del sistema Redis",
    "POST /admin/redis/security/reset-user/{user_id} - Reset de emergencia de seguridad",
    "POST /admin/redis/blacklist/sync-mysql-redis - Sincronizar MySQL a Redis"
]

__version__ = "1.0.0"