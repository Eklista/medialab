# backend/app/controllers/websocket/websocket_controller.py
"""
🔌 CONTROLADOR WEBSOCKET
Maneja las conexiones WebSocket y el routing de mensajes
"""

from fastapi import WebSocket, WebSocketDisconnect, HTTPException, Depends
from typing import Dict, Any, Optional, List
import json
import logging
from datetime import datetime

# ✅ IMPORTACIONES CORREGIDAS
from app.config.websocket_config import get_websocket_config, is_websocket_enabled
from app.services.websocket.websocket_manager import websocket_manager
from app.services.websocket.websocket_service import websocket_service

logger = logging.getLogger(__name__)

class WebSocketController:
    """
    Controlador principal para WebSocket
    """
    
    def __init__(self):
        self.config = get_websocket_config()
    
    async def websocket_endpoint(self, websocket: WebSocket, user_id: Optional[int] = None):
        """
        Endpoint principal de WebSocket - VERSIÓN CON AUTENTICACIÓN OPCIONAL
        """
        if not is_websocket_enabled():
            await websocket.close(code=1008, reason="WebSocket disabled")
            return
            
        connection_id = None
        authenticated_user = None
        
        try:
            # 🔧 NUEVA LÓGICA: Intentar autenticación, pero no fallar si no hay token
            if self.config.require_authentication:
                from app.middleware.websocket_auth import WebSocketAuthMiddleware
                
                try:
                    authenticated_user = await WebSocketAuthMiddleware.get_current_user_websocket(websocket)
                    if authenticated_user:
                        user_id = authenticated_user["id"]
                        logger.info(f"🔐 WebSocket autenticado para: {authenticated_user['email']}")
                    else:
                        logger.info("🔌 WebSocket sin autenticación - permitiendo conexión anónima")
                        user_id = user_id or 0  # Usuario anónimo
                except Exception as auth_error:
                    logger.error(f"💥 Error en autenticación WebSocket: {auth_error}")
                    # 🔧 CAMBIO: No fallar, permitir conexión anónima
                    logger.info("🔌 Fallback a conexión anónima debido a error de auth")
                    user_id = user_id or 0
            
            # Conectar WebSocket (ahora con autenticación opcional)
            connection_id = await websocket_manager.connect(websocket, user_id or 0)
            
            if not connection_id:
                await websocket.close(code=1008, reason="Connection rejected")
                return
            
            logger.info(f"🔌 WebSocket conectado: {connection_id} (user: {user_id}, authenticated: {authenticated_user is not None})")
            
            # Configurar salas según el rol del usuario
            await self._setup_user_rooms(connection_id, user_id, authenticated_user)
            
            # Loop principal de mensajes
            await self._message_loop(websocket, connection_id, user_id)
            
        except WebSocketDisconnect:
            logger.info(f"🔌 WebSocket desconectado: {connection_id}")
        except Exception as e:
            logger.error(f"💥 Error en WebSocket {connection_id}: {e}")
        finally:
            # Limpiar conexión
            if connection_id:
                websocket_manager.disconnect(connection_id)
    
    async def _setup_user_rooms(self, connection_id: str, user_id: Optional[int], authenticated_user: Optional[Dict]):
        """
        Configura las salas para el usuario - VERSIÓN MEJORADA
        """
        if not user_id:
            return
        
        try:
            # Unir a sala de usuario
            await websocket_service.join_user_room(connection_id, user_id)
            
            # Si está autenticado y es admin, unir a sala de administradores
            if authenticated_user and authenticated_user.get("is_admin"):
                await websocket_service.join_admin_room(connection_id)
                logger.info(f"🏠 Usuario admin {user_id} unido a sala de administradores")
            
            logger.debug(f"🏠 Usuario {user_id} configurado en salas")
            
        except Exception as e:
            logger.error(f"💥 Error configurando salas para usuario {user_id}: {e}")
    
    async def _message_loop(self, websocket: WebSocket, connection_id: str, user_id: Optional[int]):
        """
        Loop principal para manejar mensajes entrantes
        """
        while True:
            try:
                # Recibir mensaje
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Validar tamaño del mensaje
                if len(data) > self.config.max_message_size:
                    await self._send_error(connection_id, "Message too large")
                    continue
                
                # Procesar mensaje
                await self._handle_message(connection_id, user_id, message)
                
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                logger.warning(f"⚠️ Mensaje JSON inválido de {connection_id}")
                await self._send_error(connection_id, "Invalid JSON format")
            except Exception as e:
                logger.error(f"💥 Error procesando mensaje de {connection_id}: {e}")
                await self._send_error(connection_id, "Message processing error")
    
    async def _handle_message(self, connection_id: str, user_id: Optional[int], message: Dict[str, Any]):
        """
        Maneja mensajes entrantes del cliente
        """
        message_type = message.get("type")
        message_data = message.get("data", {})
        
        if self.config.log_messages:
            logger.debug(f"📨 Mensaje recibido: {message_type} de {connection_id}")
        
        try:
            # Routing de mensajes
            if message_type == "ping":
                await websocket_service.handle_ping(connection_id)
                
            elif message_type == "pong":
                await self._handle_pong(connection_id)
                
            elif message_type == "subscribe":
                await self._handle_subscribe(connection_id, user_id, message_data)
                
            elif message_type == "unsubscribe":
                await self._handle_unsubscribe(connection_id, user_id, message_data)
                
            elif message_type == "user_status":
                await self._handle_user_status(connection_id, user_id, message_data)
                
            elif message_type == "heartbeat":
                await self._handle_heartbeat(connection_id)
                
            else:
                logger.warning(f"⚠️ Tipo de mensaje desconocido: {message_type}")
                await self._send_error(connection_id, f"Unknown message type: {message_type}")
                
        except Exception as e:
            logger.error(f"💥 Error manejando mensaje {message_type}: {e}")
            await self._send_error(connection_id, "Error processing message")
    
    async def _handle_pong(self, connection_id: str):
        """
        Maneja respuesta pong del cliente
        """
        # Actualizar timestamp de último ping en el manager si es necesario
        if connection_id in websocket_manager.active_connections:
            websocket_manager.active_connections[connection_id].last_ping = datetime.utcnow()
    
    async def _handle_subscribe(self, connection_id: str, user_id: Optional[int], data: Dict[str, Any]):
        """
        Maneja suscripciones a salas/eventos
        """
        room_type = data.get("room_type")
        room_id = data.get("room_id")
        
        if not room_type:
            await self._send_error(connection_id, "room_type required")
            return
        
        try:
            success = False
            
            if room_type == "area" and room_id:
                success = await websocket_service.join_area_room(connection_id, room_id)
                
            elif room_type == "admin" and user_id:
                # TODO: Verificar permisos de admin aquí
                # has_admin_permission = await self._check_admin_permission(user_id)
                # if has_admin_permission:
                success = await websocket_service.join_admin_room(connection_id)
                
            elif room_type == "user" and user_id:
                success = await websocket_service.join_user_room(connection_id, user_id)
                
            else:
                await self._send_error(connection_id, f"Invalid room type or missing parameters: {room_type}")
                return
            
            if success:
                await websocket_manager.send_to_connection(connection_id, {
                    "type": "subscribed",
                    "data": {
                        "room_type": room_type,
                        "room_id": room_id,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                })
            else:
                await self._send_error(connection_id, "Failed to subscribe")
                
        except Exception as e:
            logger.error(f"💥 Error en suscripción: {e}")
            await self._send_error(connection_id, "Subscription error")
    
    async def _handle_unsubscribe(self, connection_id: str, user_id: Optional[int], data: Dict[str, Any]):
        """
        Maneja desuscripciones de salas/eventos
        """
        room_type = data.get("room_type")
        room_id = data.get("room_id")
        
        if not room_type:
            return
        
        try:
            room_name = f"{room_type}_{room_id}" if room_id else room_type
            success = await websocket_manager.leave_room(connection_id, room_name)
            
            if success:
                await websocket_manager.send_to_connection(connection_id, {
                    "type": "unsubscribed",
                    "data": {
                        "room_type": room_type,
                        "room_id": room_id,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                })
                
        except Exception as e:
            logger.error(f"💥 Error en desuscripción: {e}")
    
    async def _handle_user_status(self, connection_id: str, user_id: Optional[int], data: Dict[str, Any]):
        """
        Maneja actualizaciones de estado del usuario
        """
        if not user_id:
            return
        
        status = data.get("status", "online")
        
        # Aquí podrías actualizar el estado del usuario en la base de datos
        # await user_service.update_user_status(user_id, status)
        
        # Notificar cambio de estado
        status_message = {
            "type": "user_status_changed",
            "data": {
                "user_id": user_id,
                "status": status,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        # Notificar a contactos/administradores
        await websocket_manager.send_to_room("admin_room", status_message)
        
        logger.debug(f"👤 Estado de usuario {user_id} actualizado a: {status}")
    
    async def _handle_heartbeat(self, connection_id: str):
        """
        Maneja heartbeat del cliente
        """
        heartbeat_response = {
            "type": "heartbeat_ack",
            "data": {
                "timestamp": datetime.utcnow().isoformat(),
                "connection_id": connection_id
            }
        }
        
        await websocket_manager.send_to_connection(connection_id, heartbeat_response)
    
    async def _send_error(self, connection_id: str, error_message: str):
        """
        Envía mensaje de error al cliente
        """
        error_msg = {
            "type": "error",
            "data": {
                "message": error_message,
                "timestamp": datetime.utcnow().isoformat(),
                "connection_id": connection_id
            }
        }
        
        await websocket_manager.send_to_connection(connection_id, error_msg)
    
    # ===== MÉTODOS DE ADMINISTRACIÓN =====
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """
        Obtiene estadísticas de conexiones
        """
        return websocket_service.get_service_stats()
    
    async def broadcast_admin_message(self, message: str, message_type: str = "admin") -> int:
        """
        Broadcast mensaje a administradores
        """
        return await websocket_service.broadcast_system_notification(
            title="Mensaje Administrativo",
            message=message,
            type=message_type
        )
    
    async def disconnect_user(self, user_id: int, reason: str = "Admin disconnect") -> int:
        """
        Desconecta todas las conexiones de un usuario
        """
        connections = websocket_manager.user_connections.get(user_id, set())
        disconnected = 0
        
        for connection_id in connections.copy():
            websocket_manager.disconnect(connection_id, 1008, reason)
            disconnected += 1
        
        logger.info(f"👮 Desconectadas {disconnected} conexiones del usuario {user_id}")
        return disconnected
    
    async def send_user_notification(
        self, 
        user_id: int, 
        title: str, 
        message: str, 
        notification_type: str = "info"
    ) -> bool:
        """
        Envía notificación a un usuario específico
        """
        return await websocket_service.send_notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notification_type
        )
    
    async def get_user_connections(self, user_id: int) -> List[Dict[str, Any]]:
        """
        Obtiene las conexiones activas de un usuario
        """
        return websocket_manager.get_user_connections(user_id)
    
    async def send_to_user(self, user_id: int, message: Dict[str, Any]) -> int:
        """
        Envía mensaje a todas las conexiones de un usuario
        """
        return await websocket_manager.send_to_user(user_id, message)
    
    async def send_to_room(self, room_name: str, message: Dict[str, Any]) -> int:
        """
        Envía mensaje a todas las conexiones en una sala
        """
        return await websocket_manager.send_to_room(room_name, message)
    
    async def broadcast_to_all(self, message: Dict[str, Any], exclude_user_id: Optional[int] = None) -> int:
        """
        Broadcast mensaje a todas las conexiones
        """
        return await websocket_manager.broadcast_to_all(message, exclude_user_id)
    
    # ===== MÉTODOS DE MONITOREO =====
    
    def get_active_rooms(self) -> Dict[str, int]:
        """
        Obtiene información de las salas activas
        """
        rooms_info = {}
        for room_name, connections in websocket_manager.rooms.items():
            rooms_info[room_name] = len(connections)
        return rooms_info
    
    def get_connection_by_id(self, connection_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene información de una conexión específica
        """
        if connection_id in websocket_manager.active_connections:
            return websocket_manager.active_connections[connection_id].to_dict()
        return None
    
    async def ping_all_connections(self) -> Dict[str, Any]:
        """
        Envía ping a todas las conexiones activas
        """
        ping_message = {
            "type": "ping",
            "data": {
                "timestamp": datetime.utcnow().isoformat(),
                "server_ping": True
            }
        }
        
        sent_count = await websocket_manager.broadcast_to_all(ping_message)
        
        return {
            "ping_sent": True,
            "connections_pinged": sent_count,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    # ===== MÉTODOS DE DEBUGGING =====
    
    def get_debug_info(self) -> Dict[str, Any]:
        """
        Obtiene información de debugging del controlador
        """
        return {
            "controller_config": {
                "websocket_enabled": self.config.websocket_enabled,
                "require_authentication": self.config.require_authentication,
                "max_message_size": self.config.max_message_size,
                "heartbeat_interval": self.config.heartbeat_interval,
                "connection_timeout": self.config.connection_timeout
            },
            "manager_status": {
                "active_connections": len(websocket_manager.active_connections),
                "user_connections": len(websocket_manager.user_connections),
                "active_rooms": len(websocket_manager.rooms),
                "background_tasks_running": websocket_manager._cleanup_task is not None
            },
            "service_stats": websocket_service.get_service_stats()
        }
    
    async def test_connection_flow(self) -> Dict[str, Any]:
        """
        Prueba el flujo de conexión para debugging
        """
        try:
            stats_before = self.get_connection_stats()
            
            # Información del estado actual
            test_info = {
                "test_timestamp": datetime.utcnow().isoformat(),
                "websocket_enabled": is_websocket_enabled(),
                "config_loaded": self.config is not None,
                "manager_initialized": websocket_manager is not None,
                "service_initialized": websocket_service is not None,
                "stats_before_test": stats_before
            }
            
            return {
                "success": True,
                "test_info": test_info,
                "message": "Connection flow test completed successfully"
            }
            
        except Exception as e:
            logger.error(f"💥 Error en test de conexión: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Connection flow test failed"
            }
    
    # ===== MÉTODOS PRIVADOS DE UTILIDAD =====
    
    async def _check_admin_permission(self, user_id: int) -> bool:
        """
        Verifica si un usuario tiene permisos de administrador
        TODO: Implementar verificación real con la base de datos
        """
        try:
            # Aquí deberías verificar en la base de datos
            # from app.database import get_db
            # from app.models.auth.users import User
            # 
            # db = next(get_db())
            # user = db.query(User).filter(User.id == user_id).first()
            # return any(role.name == "ADMIN" for role in user.roles)
            
            # Por ahora retorna False hasta implementar la verificación completa
            return False
            
        except Exception as e:
            logger.error(f"💥 Error verificando permisos de admin para usuario {user_id}: {e}")
            return False
    
    def _validate_message_format(self, message: Dict[str, Any]) -> bool:
        """
        Valida el formato de un mensaje WebSocket
        """
        required_fields = ["type"]
        
        for field in required_fields:
            if field not in message:
                return False
        
        # Validar tipo de mensaje
        valid_types = [
            "ping", "pong", "subscribe", "unsubscribe", 
            "user_status", "notification", "heartbeat",
            "error", "connected", "disconnected"
        ]
        
        return message["type"] in valid_types
    
    def _get_room_name(self, room_type: str, room_id: Optional[int] = None) -> str:
        """
        Genera nombre de sala consistente
        """
        if room_id:
            return f"{room_type}_{room_id}"
        return room_type
    
    # ===== CLEANUP Y SHUTDOWN =====
    
    async def shutdown(self):
        """
        Cierra todas las conexiones y limpia recursos
        """
        try:
            logger.info("🛑 Iniciando shutdown del WebSocket controller...")
            
            # Enviar mensaje de cierre a todas las conexiones
            shutdown_message = {
                "type": "server_shutdown",
                "data": {
                    "message": "El servidor se está cerrando",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
            
            await websocket_manager.broadcast_to_all(shutdown_message)
            
            # Dar tiempo para que llegue el mensaje
            import asyncio
            await asyncio.sleep(1)
            
            # Desconectar todas las conexiones
            active_connections = list(websocket_manager.active_connections.keys())
            for connection_id in active_connections:
                websocket_manager.disconnect(connection_id, 1001, "Server shutdown")
            
            logger.info(f"🛑 WebSocket controller cerrado - {len(active_connections)} conexiones desconectadas")
            
        except Exception as e:
            logger.error(f"💥 Error durante shutdown del WebSocket controller: {e}")

# ===== INSTANCIA GLOBAL =====
websocket_controller = WebSocketController()

# ===== FUNCIONES DE UTILIDAD PARA USAR EN OTROS MÓDULOS =====

async def get_websocket_stats() -> Dict[str, Any]:
    """
    Función utilitaria para obtener estadísticas WebSocket
    """
    return websocket_controller.get_connection_stats()

async def notify_websocket_users(user_ids: List[int], title: str, message: str, notification_type: str = "info") -> int:
    """
    Función utilitaria para notificar a múltiples usuarios
    """
    total_sent = 0
    
    for user_id in user_ids:
        success = await websocket_controller.send_user_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type
        )
        if success:
            total_sent += 1
    
    return total_sent

async def broadcast_system_message(title: str, message: str, message_type: str = "system") -> int:
    """
    Función utilitaria para broadcast de mensajes del sistema
    """
    return await websocket_controller.broadcast_admin_message(message, message_type)