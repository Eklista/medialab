# backend/app/routes/websocket_routes.py
"""
🔌 RUTAS WEBSOCKET
Definición de rutas y endpoints para WebSocket
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any
import logging

# ✅ IMPORTACIONES CORREGIDAS - Eliminadas las duplicadas y conflictivas
from app.controllers.websocket.websocket_controller import websocket_controller
from app.api.deps import get_current_active_user, get_current_active_superuser
from app.config.websocket_config import is_websocket_enabled, get_websocket_config

logger = logging.getLogger(__name__)

# ===== ROUTER SETUP =====
router = APIRouter(prefix="/ws", tags=["WebSocket"])
admin_router = APIRouter(prefix="/ws/admin", tags=["WebSocket Admin"])

# ===== WEBSOCKET ENDPOINTS =====

@router.websocket("/")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: Optional[int] = Query(None, description="ID del usuario")
):
    """
    🔌 Endpoint principal de WebSocket
    
    Parámetros:
    - user_id: ID del usuario (opcional, pero recomendado para autenticación)
    
    Ejemplo de conexión desde JavaScript:
    ```javascript
    const ws = new WebSocket('ws://localhost:8000/ws/?user_id=123');
    ```
    """
    if not is_websocket_enabled():
        await websocket.close(code=1008, reason="WebSocket service disabled")
        return
    
    await websocket_controller.websocket_endpoint(websocket, user_id)

@router.websocket("/secure")
async def secure_websocket_endpoint(websocket: WebSocket):
    """
    🔐 Endpoint seguro de WebSocket (requiere autenticación)
    
    Este endpoint requiere un token válido para la conexión.
    TODO: Implementar autenticación completa
    """
    if not is_websocket_enabled():
        await websocket.close(code=1008, reason="WebSocket service disabled")
        return
    
    # TODO: Implementar get_current_user_websocket cuando esté listo
    user_id = None  # Temporal hasta implementar auth completa
    await websocket_controller.websocket_endpoint(websocket, user_id)

# ===== REST ENDPOINTS PARA GESTIÓN =====

@router.get("/status")
async def websocket_status():
    """
    📊 Estado del servicio WebSocket
    """
    if not is_websocket_enabled():
        return JSONResponse(
            status_code=503,
            content={"enabled": False, "message": "WebSocket service disabled"}
        )
    
    try:
        stats = websocket_controller.get_connection_stats()
        
        return {
            "enabled": True,
            "status": "running",
            "stats": stats,
            "timestamp": stats["manager_stats"].get("start_time")
        }
    except Exception as e:
        logger.error(f"💥 Error obteniendo stats WebSocket: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "enabled": True,
                "status": "error", 
                "error": str(e)
            }
        )

@router.get("/health")
async def websocket_health():
    """
    🏥 Health check del servicio WebSocket
    """
    try:
        if not is_websocket_enabled():
            return JSONResponse(
                status_code=503,
                content={
                    "healthy": False,
                    "service": "websocket",
                    "reason": "WebSocket service disabled"
                }
            )
        
        stats = websocket_controller.get_connection_stats()
        
        is_healthy = (
            is_websocket_enabled() and
            stats["manager_stats"]["active_connections"] >= 0  # Básico, siempre debe ser >= 0
        )
        
        status_code = 200 if is_healthy else 503
        
        return JSONResponse(
            status_code=status_code,
            content={
                "healthy": is_healthy,
                "service": "websocket",
                "active_connections": stats["manager_stats"]["active_connections"],
                "total_connections": stats["manager_stats"]["total_connections"],
                "uptime_seconds": stats["manager_stats"]["uptime_seconds"]
            }
        )
        
    except Exception as e:
        logger.error(f"💥 Error en health check WebSocket: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "healthy": False,
                "error": str(e),
                "service": "websocket"
            }
        )

# ===== ENDPOINTS DE ADMINISTRACIÓN =====

@admin_router.get("/stats")
async def get_detailed_stats(current_user = Depends(get_current_active_superuser)):
    """
    📈 Estadísticas detalladas del WebSocket (solo admins)
    """
    if not is_websocket_enabled():
        raise HTTPException(status_code=503, detail="WebSocket service disabled")
    
    try:
        stats = websocket_controller.get_connection_stats()
        
        return {
            "service_stats": stats,
            "requested_by": current_user.id,
            "timestamp": stats["manager_stats"].get("start_time")
        }
    except Exception as e:
        logger.error(f"💥 Error obteniendo estadísticas detalladas: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting stats: {str(e)}")

@admin_router.post("/broadcast")
async def broadcast_admin_message(
    message: str,
    message_type: str = "admin",
    current_user = Depends(get_current_active_superuser)
):
    """
    📢 Broadcast mensaje administrativo
    """
    if not is_websocket_enabled():
        raise HTTPException(status_code=503, detail="WebSocket service disabled")
    
    try:
        sent_count = await websocket_controller.broadcast_admin_message(message, message_type)
        
        logger.info(f"👤 Admin {current_user.id} envió broadcast: '{message}' a {sent_count} conexiones")
        
        return {
            "success": True,
            "message": "Broadcast sent successfully",
            "sent_to_connections": sent_count,
            "sent_by": current_user.id,
            "broadcast_message": message,
            "message_type": message_type
        }
        
    except Exception as e:
        logger.error(f"💥 Error en broadcast admin: {e}")
        raise HTTPException(status_code=500, detail=f"Broadcast failed: {str(e)}")

@admin_router.post("/disconnect-user/{user_id}")
async def disconnect_user_connections(
    user_id: int,
    reason: str = "Admin disconnect",
    current_user = Depends(get_current_active_superuser)
):
    """
    🔌 Desconecta todas las conexiones de un usuario específico
    """
    if not is_websocket_enabled():
        raise HTTPException(status_code=503, detail="WebSocket service disabled")
    
    try:
        disconnected_count = await websocket_controller.disconnect_user(user_id, reason)
        
        logger.info(f"👮 Admin {current_user.id} desconectó {disconnected_count} conexiones del usuario {user_id}")
        
        return {
            "success": True,
            "message": f"Desconectadas {disconnected_count} conexiones del usuario {user_id}",
            "user_id": user_id,
            "reason": reason,
            "admin_user": current_user.id,
            "disconnected_connections": disconnected_count
        }
        
    except Exception as e:
        logger.error(f"💥 Error desconectando usuario {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error disconnecting user: {str(e)}")

@admin_router.post("/notify-user/{user_id}")
async def send_user_notification(
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "admin",
    current_user = Depends(get_current_active_superuser)
):
    """
    📨 Envía notificación a un usuario específico
    """
    if not is_websocket_enabled():
        raise HTTPException(status_code=503, detail="WebSocket service disabled")
    
    try:
        success = await websocket_controller.send_user_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type
        )
        
        logger.info(f"📨 Admin {current_user.id} envió notificación a usuario {user_id}: '{title}'")
        
        return {
            "success": success,
            "message": "Notification sent successfully" if success else "Failed to send notification",
            "user_id": user_id,
            "title": title,
            "notification_message": message,
            "notification_type": notification_type,
            "sent_by": current_user.id
        }
        
    except Exception as e:
        logger.error(f"💥 Error enviando notificación a usuario {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Notification failed: {str(e)}")

# ===== ENDPOINTS DE TESTING Y DEBUGGING =====

@admin_router.get("/connections")
async def get_active_connections(current_user = Depends(get_current_active_superuser)):
    """
    📊 Lista de conexiones activas (solo admins)
    """
    if not is_websocket_enabled():
        raise HTTPException(status_code=503, detail="WebSocket service disabled")
    
    try:
        stats = websocket_controller.get_connection_stats()
        
        return {
            "active_connections": stats["manager_stats"]["active_connections"],
            "connections_by_user": stats["manager_stats"].get("connections_per_user", {}),
            "total_connections": stats["manager_stats"]["total_connections"],
            "uptime_seconds": stats["manager_stats"]["uptime_seconds"],
            "unique_users": stats["manager_stats"].get("unique_users", 0),
            "active_rooms": stats["manager_stats"].get("active_rooms", 0),
            "requested_by": current_user.id
        }
        
    except Exception as e:
        logger.error(f"💥 Error obteniendo conexiones activas: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get connections: {str(e)}")

@admin_router.post("/test-broadcast")
async def test_websocket_broadcast(
    message: str = "Test message from admin",
    current_user = Depends(get_current_active_superuser)
):
    """
    🧪 Envía mensaje de prueba a todas las conexiones (solo para testing)
    """
    if not is_websocket_enabled():
        raise HTTPException(status_code=503, detail="WebSocket service disabled")
    
    try:
        test_message = f"TEST: {message} - Enviado por admin {current_user.id}"
        sent_count = await websocket_controller.broadcast_admin_message(
            message=test_message,
            message_type="test"
        )
        
        logger.info(f"🧪 Admin {current_user.id} envió test broadcast: '{test_message}'")
        
        return {
            "success": True,
            "message": "Test broadcast sent",
            "sent_to_connections": sent_count,
            "test_message": test_message,
            "original_message": message,
            "sent_by": current_user.id
        }
        
    except Exception as e:
        logger.error(f"💥 Error en test broadcast: {e}")
        raise HTTPException(status_code=500, detail=f"Test broadcast failed: {str(e)}")

@admin_router.get("/config")
async def get_websocket_config_admin(current_user = Depends(get_current_active_superuser)):
    """
    ⚙️ Configuración del WebSocket (solo admins)
    """
    if not is_websocket_enabled():
        raise HTTPException(status_code=503, detail="WebSocket service disabled")
    
    try:
        config = get_websocket_config()
        
        return {
            "enabled": config.websocket_enabled,
            "host": config.websocket_host,
            "port": config.websocket_port,
            "max_connections_per_user": config.max_connections_per_user,
            "max_total_connections": config.max_total_connections,
            "connection_timeout": config.connection_timeout,
            "heartbeat_interval": config.heartbeat_interval,
            "max_message_size": config.max_message_size,
            "message_queue_size": config.message_queue_size,
            "require_authentication": config.require_authentication,
            "allowed_origins": config.allowed_origins,
            "log_connections": config.log_connections,
            "log_messages": config.log_messages,
            "debug_mode": config.debug_mode,
            "development_mode": config.development_mode,
            "requested_by": current_user.id
        }
        
    except Exception as e:
        logger.error(f"💥 Error obteniendo configuración WebSocket: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting config: {str(e)}")

# ===== ENDPOINTS DE MONITOREO =====

@admin_router.get("/rooms")
async def get_websocket_rooms(current_user = Depends(get_current_active_superuser)):
    """
    🏠 Lista de salas/rooms activas
    """
    if not is_websocket_enabled():
        raise HTTPException(status_code=503, detail="WebSocket service disabled")
    
    try:
        stats = websocket_controller.get_connection_stats()
        
        # Información básica de rooms - se puede expandir si el manager expone más detalles
        return {
            "total_rooms": stats["manager_stats"].get("active_rooms", 0),
            "room_info": "Detalles de rooms disponibles en una versión futura",
            "requested_by": current_user.id,
            "note": "Esta funcionalidad se puede expandir para mostrar detalles específicos de cada room"
        }
        
    except Exception as e:
        logger.error(f"💥 Error obteniendo rooms: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting rooms: {str(e)}")

@admin_router.post("/cleanup")
async def cleanup_websocket_connections(current_user = Depends(get_current_active_superuser)):
    """
    🧹 Limpieza manual de conexiones obsoletas
    """
    if not is_websocket_enabled():
        raise HTTPException(status_code=503, detail="WebSocket service disabled")
    
    try:
        # Esta funcionalidad se ejecuta automáticamente en background, 
        # pero podemos proporcionar stats antes y después
        stats_before = websocket_controller.get_connection_stats()
        
        logger.info(f"🧹 Admin {current_user.id} solicitó limpieza manual de conexiones")
        
        return {
            "success": True,
            "message": "Cleanup process runs automatically in background",
            "connections_before": stats_before["manager_stats"]["active_connections"],
            "note": "La limpieza automática se ejecuta cada minuto",
            "requested_by": current_user.id
        }
        
    except Exception as e:
        logger.error(f"💥 Error en cleanup manual: {e}")
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")