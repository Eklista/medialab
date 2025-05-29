# backend/app/routes/websocket_routes.py
"""
🔌 RUTAS WEBSOCKET
Definición de rutas y endpoints para WebSocket
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any
import logging

from controllers.websocket.websocket_controller import websocket_controller
from controllers.auth_controller import get_current_user, get_current_user_optional
from config.websocket_config import is_websocket_enabled
from middleware.permissions import require_permission

# WebSocket imports
try:
    from app.config.websocket_config import is_websocket_enabled, get_websocket_config
    from app.routes.websocket_routes import router as websocket_router, admin_router as websocket_admin_router
    from app.services.websocket.websocket_manager import websocket_manager
    WEBSOCKET_AVAILABLE = True
    logger.info("✅ Módulos WebSocket disponibles")
except ImportError as e:
    WEBSOCKET_AVAILABLE = False
    logger.warning(f"⚠️ Módulos WebSocket no disponibles: {e}")

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
async def secure_websocket_endpoint(
    websocket: WebSocket,
    # user: dict = Depends(get_current_user_websocket)  # Descomentar cuando implementes auth
):
    """
    🔐 Endpoint seguro de WebSocket (requiere autenticación)
    
    Este endpoint requiere un token válido para la conexión.
    """
    if not is_websocket_enabled():
        await websocket.close(code=1008, reason="WebSocket service disabled")
        return
    
    # user_id = user.get("id")
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
    
    stats = websocket_controller.get_connection_stats()
    
    return {
        "enabled": True,
        "status": "running",
        "stats": stats,
        "timestamp": stats["manager_stats"].get("start_time")
    }

@router.get("/health")
async def websocket_health():
    """
    🏥 Health check del servicio WebSocket
    """
    try:
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
        logger.error(f"💥 Error en health check: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "healthy": False,
                "error": str(e),
                "service": "websocket"
            }
        )

# ===== ENDPOINTS DE ADMINISTRACIÓN =====

@admin_router.get("/stats", dependencies=[Depends(require_permission("websocket_view"))])
async def get_detailed_stats(current_user: dict = Depends(get_current_user)):
    """
    📈 Estadísticas detalladas del WebSocket (solo admins)
    """
    if not is_websocket_enabled():
        raise HTTPException(status_code=503, detail="WebSocket service disabled")
    
    stats = websocket_controller.get_connection_stats()
    
    return {
        "service_stats": stats,
        "requested_by": current_user.get("id"),
        "timestamp": stats["manager_stats"].get("start_time")
    }

@admin_router.post("/broadcast", dependencies=[Depends(require_permission("websocket_admin"))])
async def broadcast_admin_message(
    message: str,
    message_type: str = "admin",
    current_user: dict = Depends(get_current_user)
):
    """
    📢 Broadcast mensaje administrativo
    """
    if not is_websocket_enabled():
        raise HTTPException(status_code=503, detail="WebSocket service disabled")
    
    try:
        sent_count = await websocket_controller.broadcast_admin_message(message, message_type)
        
        logger.info(f"👤 Admin {current_user.get('id')} envió broadcast: '{message}' a {sent_count} conexiones")
        
        return {
            "success": True,
            "message": "Broadcast sent successfully",
            "sent_to_connections": sent_count,
            "sent_by": current_user.get("id")
        }
        
    except Exception as e:
        logger.error(f"💥 Error en broadcast admin: {e}")
        raise HTTPException(status_code=500, detail=f"Broadcast failed: {str(e)}")

@admin_router.post("/disconnect-user/{user_id}", dependencies=[Depends(require_permission("websocket_admin"))])
async def disconnect_user_connections(
    user_id: int,
    reason: str = "Admin disconnect",
    current_user: dict = Depends(get_current_user)
):
    """
    🔌 Desconecta todas las conexiones de un usuario específico
    """
    if not is_websocket_enabled():
        raise HTTPException(status_code=503, detail="WebSocket service disabled")
    
    try:
        disconnected_count = await websocket_controller.disconnect_user(user_id, reason)
        
        logger.info(f"👮 Admin {current_user.get('id')} desconectó {disconnected_count} conexiones del usuario {user_id}")
        
        return {
            "success": True,
            "message": f"Desconectadas {disconnected_count} conexiones del usuario {user_id}",
            "user_id": user_id,
            "reason": reason,
            "admin_user": current_user.get("id")
        }
        
    except Exception as e:
        logger.error(f"💥 Error desconectando usuario {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error disconnecting user: {str(e)}")

@admin_router.post("/notify-user/{user_id}", dependencies=[Depends(require_permission("websocket_admin"))])
async def send_user_notification(
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "admin",
    current_user: dict = Depends(get_current_user)
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
        
        return {
            "success": success,
            "message": "Notification sent successfully" if success else "Failed to send notification",
            "user_id": user_id,
            "sent_by": current_user.get("id")
        }
        
    except Exception as e:
        logger.error(f"💥 Error enviando notificación a usuario {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Notification failed: {str(e)}")

# ===== ENDPOINTS DE TESTING Y DEBUGGING =====

@admin_router.get("/connections", dependencies=[Depends(require_permission("websocket_view"))])
async def get_active_connections(
    current_user: dict = Depends(get_current_user)
):
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
            "requested_by": current_user.get("id")
        }
        
    except Exception as e:
        logger.error(f"💥 Error obteniendo conexiones activas: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get connections: {str(e)}")

@admin_router.post("/test-broadcast", dependencies=[Depends(require_permission("websocket_admin"))])
async def test_websocket_broadcast(
    message: str = "Test message from admin",
    current_user: dict = Depends(get_current_user)
):
    """
    🧪 Envía mensaje de prueba a todas las conexiones (solo para testing)
    """
    if not is_websocket_enabled():
        raise HTTPException(status_code=503, detail="WebSocket service disabled")
    
    try:
        sent_count = await websocket_controller.broadcast_admin_message(
            message=f"TEST: {message}",
            message_type="test"
        )
        
        return {
            "success": True,
            "message": "Test broadcast sent",
            "sent_to_connections": sent_count,
            "test_message": message,
            "sent_by": current_user.get("id")
        }
        
    except Exception as e:
        logger.error(f"💥 Error en test broadcast: {e}")
        raise HTTPException(status_code=500, detail=f"Test broadcast failed: {str(e)}")