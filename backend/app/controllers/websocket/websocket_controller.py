# backend/app/controllers/websocket/websocket_controller.py - CORRECCIÓN
# 🔧 VERSIÓN CORREGIDA QUE EVITA EL DOBLE ACCEPT

from fastapi import WebSocket, WebSocketDisconnect
from typing import Optional, Dict, Any
import logging
import json
import asyncio

from app.services.websocket.websocket_manager import websocket_manager

logger = logging.getLogger(__name__)

class WebSocketController:
    """
    Controlador principal para WebSocket - VERSIÓN CORREGIDA
    """
    
    async def websocket_endpoint(self, websocket: WebSocket, user_id: Optional[int] = None, already_accepted: bool = False):
        """
        Endpoint principal de WebSocket - CORREGIDO PARA EVITAR DOBLE ACCEPT
        
        Args:
            websocket: La conexión WebSocket
            user_id: ID del usuario (opcional)
            already_accepted: Si True, la conexión ya fue aceptada (evita doble accept)
        """
        connection_id = None
        
        try:
            logger.info(f"🔌 Procesando conexión WebSocket - user_id: {user_id}, already_accepted: {already_accepted}")
            
            # Si no hay user_id, usar uno por defecto para testing
            if user_id is None:
                user_id = 1  # Usuario por defecto para testing
                logger.warning(f"⚠️ Usando user_id por defecto: {user_id}")
            
            # 🔧 ESTABLECER CONEXIÓN CON EL MANAGER (SIN ACCEPT SI YA FUE ACEPTADA)
            connection_id = await websocket_manager.connect(websocket, user_id, already_accepted=already_accepted)
            
            if not connection_id:
                logger.error("❌ No se pudo establecer conexión con WebSocket Manager")
                if not already_accepted:
                    await websocket.close(code=1011, reason="Connection failed")
                return
            
            logger.info(f"✅ Conexión establecida: {connection_id} para user_id: {user_id}")
            
            # Unir a sala personal del usuario
            await websocket_manager.join_room(connection_id, f"user_{user_id}")
            
            # Loop principal de mensajes
            await self._handle_messages(websocket, connection_id, user_id)
            
        except WebSocketDisconnect:
            logger.info(f"👋 Cliente desconectado normalmente: {connection_id}")
            
        except Exception as e:
            logger.error(f"💥 Error en websocket_endpoint: {e}")
            try:
                if not already_accepted:
                    await websocket.close(code=1011, reason="Internal server error")
            except:
                pass
                
        finally:
            # Limpiar conexión
            if connection_id:
                websocket_manager.disconnect(connection_id)
                logger.info(f"🧹 Conexión limpiada: {connection_id}")
    
    async def _handle_messages(
        self, 
        websocket: WebSocket, 
        connection_id: str, 
        user_id: int
    ):
        """
        Maneja los mensajes entrantes del WebSocket
        """
        try:
            while True:
                # Recibir mensaje del cliente
                data = await websocket.receive_text()
                
                try:
                    message = json.loads(data)
                    message_type = message.get("type", "unknown")
                    message_data = message.get("data", {})
                    
                    logger.debug(f"📨 Mensaje recibido de {connection_id}: {message_type}")
                    
                    # Procesar diferentes tipos de mensajes
                    await self._process_message(
                        connection_id, 
                        user_id, 
                        message_type, 
                        message_data
                    )
                    
                except json.JSONDecodeError:
                    logger.warning(f"⚠️ Mensaje no válido de {connection_id}: {data}")
                    await websocket_manager.send_to_connection(connection_id, {
                        "type": "error",
                        "data": {"message": "Invalid JSON format"}
                    })
                    
        except WebSocketDisconnect:
            logger.info(f"👋 Cliente {connection_id} desconectado durante manejo de mensajes")
            raise
            
        except Exception as e:
            logger.error(f"💥 Error manejando mensajes de {connection_id}: {e}")
            raise
    
    async def _process_message(
        self,
        connection_id: str,
        user_id: int,
        message_type: str,
        message_data: dict
    ):
        """
        Procesa diferentes tipos de mensajes
        """
        try:
            if message_type == "ping":
                # Responder con pong
                await websocket_manager.send_to_connection(connection_id, {
                    "type": "pong",
                    "data": {"timestamp": message_data.get("timestamp")}
                })
                
            elif message_type == "subscribe":
                # Suscribirse a una sala
                room_type = message_data.get("room_type")
                room_id = message_data.get("room_id")
                
                if room_type == "user" and room_id:
                    await websocket_manager.join_room(connection_id, f"user_{room_id}")
                elif room_type == "admin":
                    await websocket_manager.join_room(connection_id, "admin_room")
                elif room_type == "area" and room_id:
                    await websocket_manager.join_room(connection_id, f"area_{room_id}")
                    
            elif message_type == "unsubscribe":
                # Desuscribirse de una sala
                room_type = message_data.get("room_type")
                room_id = message_data.get("room_id")
                
                if room_type == "user" and room_id:
                    await websocket_manager.leave_room(connection_id, f"user_{room_id}")
                elif room_type == "admin":
                    await websocket_manager.leave_room(connection_id, "admin_room")
                elif room_type == "area" and room_id:
                    await websocket_manager.leave_room(connection_id, f"area_{room_id}")
                    
            elif message_type == "user_status":
                # Actualizar estado del usuario
                status = message_data.get("status", "active")
                logger.debug(f"👤 Usuario {user_id} cambió estado a: {status}")
                
            elif message_type == "test":
                # Mensaje de prueba
                await websocket_manager.send_to_connection(connection_id, {
                    "type": "test_response",
                    "data": {
                        "message": "Mensaje de prueba recibido",
                        "original": message_data,
                        "user_id": user_id,
                        "connection_id": connection_id
                    }
                })
                
            else:
                logger.warning(f"⚠️ Tipo de mensaje no reconocido: {message_type}")
                await websocket_manager.send_to_connection(connection_id, {
                    "type": "error",
                    "data": {"message": f"Unknown message type: {message_type}"}
                })
                
        except Exception as e:
            logger.error(f"💥 Error procesando mensaje {message_type}: {e}")
            await websocket_manager.send_to_connection(connection_id, {
                "type": "error",
                "data": {"message": "Error processing message"}
            })
    
    # ===== MÉTODOS PARA ADMINISTRACIÓN (sin cambios) =====
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """
        Obtiene estadísticas de conexiones
        """
        try:
            return {
                "success": True,
                "manager_stats": websocket_manager.get_stats()
            }
        except Exception as e:
            logger.error(f"💥 Error obteniendo stats: {e}")
            return {
                "success": False,
                "error": str(e),
                "manager_stats": {"active_connections": 0, "total_connections": 0}
            }
    
    async def broadcast_admin_message(self, message: str, message_type: str = "admin") -> int:
        """
        Broadcast mensaje administrativo
        """
        try:
            admin_message = {
                "type": "admin_message",
                "data": {
                    "message": message,
                    "message_type": message_type,
                    "from": "system_admin"
                }
            }
            
            sent_count = await websocket_manager.broadcast_to_all(admin_message)
            logger.info(f"📢 Mensaje admin enviado a {sent_count} conexiones")
            return sent_count
            
        except Exception as e:
            logger.error(f"💥 Error en broadcast admin: {e}")
            return 0
    
    async def disconnect_user(self, user_id: int, reason: str = "Admin disconnect") -> int:
        """
        Desconecta todas las conexiones de un usuario
        """
        try:
            disconnected_count = 0
            
            if user_id in websocket_manager.user_connections:
                connection_ids = list(websocket_manager.user_connections[user_id])
                
                for connection_id in connection_ids:
                    websocket_manager.disconnect(connection_id, 1008, reason)
                    disconnected_count += 1
            
            logger.info(f"🔌 Desconectadas {disconnected_count} conexiones del usuario {user_id}")
            return disconnected_count
            
        except Exception as e:
            logger.error(f"💥 Error desconectando usuario {user_id}: {e}")
            return 0
    
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
        try:
            notification = {
                "type": "notification",
                "data": {
                    "title": title,
                    "message": message,
                    "notification_type": notification_type
                }
            }
            
            sent_count = await websocket_manager.send_to_user(user_id, notification)
            logger.info(f"📨 Notificación enviada a usuario {user_id}: {sent_count} conexiones")
            return sent_count > 0
            
        except Exception as e:
            logger.error(f"💥 Error enviando notificación a usuario {user_id}: {e}")
            return False

# Instancia global del controlador
websocket_controller = WebSocketController()