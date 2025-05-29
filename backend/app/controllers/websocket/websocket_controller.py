# backend/controllers/websocket/websocket_controller.py
"""
🔌 CONTROLADOR WEBSOCKET
Maneja las conexiones WebSocket y el routing de mensajes
"""

from fastapi import WebSocket, WebSocketDisconnect, HTTPException, Depends
from typing import Dict, Any, Optional
import json
import logging
from datetime import datetime

from config.websocket_config import get_websocket_config, is_websocket_enabled
from services.websocket.websocket_manager import websocket_manager
from services.websocket.websocket_service import websocket_service
from controllers.auth_controller import get_current_user_websocket

logger = logging.getLogger(__name__)

class WebSocketController:
    """
    Controlador principal para WebSocket
    """
    
    def __init__(self):
        self.config = get_websocket_config()
    
    async def websocket_endpoint(self, websocket: WebSocket, user_id: Optional[int] = None):
        """
        Endpoint principal de WebSocket
        """
        if not is_websocket_enabled():
            await websocket.close(code=1008, reason="WebSocket disabled")
            return
            
        connection_id = None
        
        try:
            # Validar usuario si se requiere autenticación
            if self.config.require_authentication:
                if not user_id:
                    await websocket.close(code=1008, reason="Authentication required")
                    return
                
                # Aquí podrías validar el token del usuario
                # user = await get_current_user_websocket(websocket)
                # user_id = user.id
            
            # Conectar WebSocket
            connection_id = await websocket_manager.connect(websocket, user_id or 0)
            
            if not connection_id:
                await websocket.close(code=1008, reason="Connection rejected")
                return
            
            logger.info(f"🔌 WebSocket conectado: {connection_id} (user: {user_id})")
            
            # Configurar salas según el rol del usuario
            await self._setup_user_rooms(connection_id, user_id)
            
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
    
    async def _setup_user_rooms(self, connection_id: str, user_id: Optional[int]):
        """
        Configura las salas para el usuario
        """
        if not user_id:
            return
        
        try:
            # Unir a sala de usuario
            await websocket_service.join_user_room(connection_id, user_id)
            
            # Si es admin, unir a sala de administradores
            # Aquí deberías verificar el rol del usuario
            # if user.is_admin:
            #     await websocket_service.join_admin_room(connection_id)
            
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
        
        logger.debug(f"📨 Mensaje recibido: {message_type} de {connection_id}")
        
        try:
            # Routing de mensajes
            if message_type == "ping":
                await websocket_service.handle_ping(connection_id)
                
            elif message_type == "subscribe":
                await self._handle_subscribe(connection_id, user_id, message_data)
                
            elif message_type == "unsubscribe":
                await self._handle_unsubscribe(connection_id, user_id, message_data)
                
            elif message_type == "user_status":
                await self._handle_user_status(connection_id, user_id, message_data)
                
            else:
                logger.warning(f"⚠️ Tipo de mensaje desconocido: {message_type}")
                await self._send_error(connection_id, f"Unknown message type: {message_type}")
                
        except Exception as e:
            logger.error(f"💥 Error manejando mensaje {message_type}: {e}")
            await self._send_error(connection_id, "Error processing message")
    
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
            if room_type == "area" and room_id:
                success = await websocket_service.join_area_room(connection_id, room_id)
                
            elif room_type == "admin" and user_id:
                # Verificar permisos de admin aquí
                success = await websocket_service.join_admin_room(connection_id)
                
            else:
                await self._send_error(connection_id, f"Invalid room type: {room_type}")
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
    
    async def _send_error(self, connection_id: str, error_message: str):
        """
        Envía mensaje de error al cliente
        """
        error_msg = {
            "type": "error",
            "data": {
                "message": error_message,
                "timestamp": datetime.utcnow().isoformat()
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

# ===== INSTANCIA GLOBAL =====
websocket_controller = WebSocketController()