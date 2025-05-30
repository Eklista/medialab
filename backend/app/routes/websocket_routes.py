# backend/app/routes/websocket_routes.py - VERSIÓN CORREGIDA
"""
🔌 RUTAS WEBSOCKET CORREGIDAS
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any
import logging

from app.controllers.websocket.websocket_controller import websocket_controller
from app.api.deps import get_current_active_user, get_current_active_superuser
from app.config.websocket_config import is_websocket_enabled, get_websocket_config
from app.middleware.websocket_auth import authenticate_websocket

logger = logging.getLogger(__name__)

# ===== ROUTER SETUP =====
router = APIRouter(tags=["WebSocket"])
admin_router = APIRouter(tags=["WebSocket Admin"])

# ===== WEBSOCKET ENDPOINTS CORREGIDOS =====

@router.websocket("/")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: Optional[int] = Query(None, description="ID del usuario"),
    token: Optional[str] = Query(None, description="Token de autenticación")
):
    """
    🔌 Endpoint principal de WebSocket - VERSIÓN CORREGIDA
    
    Parámetros:
    - user_id: ID del usuario (opcional para conexiones autenticadas)
    - token: Token de autenticación (opcional, también puede venir de cookies)
    
    Ejemplo de conexión:
    ```javascript
    const ws = new WebSocket('ws://localhost:8000/ws/?user_id=1&token=your_token');
    ```
    """
    if not is_websocket_enabled():
        await websocket.close(code=1008, reason="WebSocket service disabled")
        return
    
    logger.info(f"🔌 Nueva conexión WebSocket: user_id={user_id}, token={'Present' if token else 'Missing'}")
    
    try:
        await websocket_controller.websocket_endpoint(websocket, user_id)
    except Exception as e:
        logger.error(f"💥 Error en websocket endpoint principal: {e}")
        try:
            await websocket.close(code=1011, reason="Internal server error")  
        except:
            pass

@router.websocket("/secure")
async def secure_websocket_endpoint(websocket: WebSocket):
    """
    🔐 Endpoint seguro de WebSocket - VERSIÓN FINAL CORREGIDA
    
    Este endpoint:
    1. Acepta la conexión WebSocket primero
    2. Lee las cookies HttpOnly automáticamente desde los headers
    3. Autentica al usuario usando las cookies
    4. Establece la conexión WebSocket autenticada SIN doble accept
    """
    if not is_websocket_enabled():
        await websocket.close(code=1008, reason="WebSocket service disabled")
        return
    
    logger.info("🔐 Intento de conexión a WebSocket seguro con cookies HttpOnly")
    
    try:
        # 1. ACEPTAR LA CONEXIÓN PRIMERO (necesario para leer cookies)
        await websocket.accept()
        logger.info("✅ Conexión WebSocket aceptada, procediendo con autenticación...")
        
        # 2. AUTENTICAR USANDO COOKIES HTTPONLY
        user_data = await authenticate_websocket(websocket)
        
        if not user_data:
            logger.warning("🚨 Autenticación WebSocket fallida - cerrando conexión")
            await websocket.close(code=4001, reason="Authentication required")
            return
        
        user_id = user_data.get('id')
        user_email = user_data.get('email', 'unknown')
        
        logger.info(f"✅ Usuario autenticado en WebSocket seguro: {user_email} (ID: {user_id})")
        
        # 3. 🔧 CONTINUAR CON LA LÓGICA WEBSOCKET SIN DOBLE ACCEPT
        await websocket_controller.websocket_endpoint(
            websocket, 
            user_id=user_id, 
            already_accepted=True  # ← IMPORTANTE: Evita el doble accept
        )
        
    except WebSocketDisconnect:
        logger.info("👋 Cliente desconectado del WebSocket seguro")
    except Exception as e:
        logger.error(f"💥 Error en websocket endpoint seguro: {e}")
        try:
            await websocket.close(code=1011, reason="Internal server error")
        except:
            pass

# ===== ENDPOINT DE TESTING SIN AUTENTICACIÓN =====

@router.websocket("/test")
async def test_websocket_endpoint(websocket: WebSocket):
    """
    🧪 Endpoint de testing WebSocket SIN autenticación
    
    SOLO para desarrollo y testing. No usar en producción.
    """
    if not is_websocket_enabled():
        await websocket.close(code=1008, reason="WebSocket service disabled")
        return
    
    logger.warning("🧪 Conexión a WebSocket de testing (SIN AUTENTICACIÓN)")
    
    try:
        # Usar un user_id ficticio para testing
        await websocket_controller.websocket_endpoint(websocket, user_id=999)
    except Exception as e:
        logger.error(f"💥 Error en websocket endpoint de testing: {e}")
        try:
            await websocket.close(code=1011, reason="Internal server error")
        except:
            pass

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
            "endpoints": {
                "main": "ws://localhost:8000/ws/",
                "secure": "ws://localhost:8000/ws/secure", 
                "test": "ws://localhost:8000/ws/test"
            }
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
            stats.get("success", False) and
            stats["manager_stats"]["active_connections"] >= 0
        )
        
        status_code = 200 if is_healthy else 503
        
        return JSONResponse(
            status_code=status_code,
            content={
                "healthy": is_healthy,
                "service": "websocket",
                "active_connections": stats["manager_stats"]["active_connections"],
                "total_connections": stats["manager_stats"]["total_connections"],
                "uptime_seconds": stats["manager_stats"]["uptime_seconds"],
                "available_endpoints": [
                    "ws://localhost:8000/ws/",
                    "ws://localhost:8000/ws/secure",
                    "ws://localhost:8000/ws/test"
                ]
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

# ===== ENDPOINTS DE ADMINISTRACIÓN (sin cambios) =====

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
            "endpoints_info": {
                "main": "ws://localhost:8000/ws/",
                "secure": "ws://localhost:8000/ws/secure",
                "test": "ws://localhost:8000/ws/test (development only)"
            }
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

# ===== ENDPOINT DE TESTING ADMINISTRATIVO =====

@admin_router.post("/test-connection")
async def test_websocket_connection(
    test_user_id: int = 1,
    current_user = Depends(get_current_active_superuser)
):
    """
    🧪 Prueba la funcionalidad WebSocket (solo admins)
    """
    if not is_websocket_enabled():
        raise HTTPException(status_code=503, detail="WebSocket service disabled")
    
    try:
        # Enviar notificación de prueba
        success = await websocket_controller.send_user_notification(
            user_id=test_user_id,
            title="Prueba de Conexión WebSocket",
            message="Esta es una notificación de prueba del sistema WebSocket",
            notification_type="test"
        )
        
        return {
            "test_completed": True,
            "notification_sent": success,
            "test_user_id": test_user_id,
            "tested_by": current_user.id,
            "message": "Test completed successfully" if success else "Test completed but notification not sent"
        }
        
    except Exception as e:
        logger.error(f"💥 Error en test de conexión: {e}")
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")

# ===== INFORMACIÓN DE DEBUGGING =====

@router.get("/debug/info")
async def get_websocket_debug_info():
    """
    🔍 Información de debugging para WebSocket
    """
    if not is_websocket_enabled():
        return {"error": "WebSocket service disabled"}
    
    try:
        config = get_websocket_config()
        stats = websocket_controller.get_connection_stats()
        
        return {
            "websocket_enabled": is_websocket_enabled(),
            "available_endpoints": {
                "main": "/ws/",
                "secure": "/ws/secure", 
                "test": "/ws/test",
                "status": "/ws/status",
                "health": "/ws/health"
            },
            "configuration": {
                "host": config.websocket_host,
                "port": config.websocket_port,
                "max_connections_per_user": config.max_connections_per_user,
                "max_total_connections": config.max_total_connections,
                "require_authentication": config.require_authentication
            },
            "current_stats": stats,
            "authentication_methods": [
                "Query parameter: ?token=your_token",
                "Cookie: access_token", 
                "Header: Authorization: Bearer your_token"
            ]
        }
        
    except Exception as e:
        logger.error(f"💥 Error obteniendo debug info: {e}")
        return {"error": f"Debug info failed: {str(e)}"}

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