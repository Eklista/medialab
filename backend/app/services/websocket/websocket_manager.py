# backend/services/websocket/websocket_manager.py
"""
🔌 GESTOR DE CONEXIONES WEBSOCKET
Maneja todas las conexiones WebSocket activas
"""

from typing import Dict, List, Set, Optional, Any
from fastapi import WebSocket, WebSocketDisconnect
import json
import asyncio
import logging
from datetime import datetime, timedelta
import uuid
from collections import defaultdict

from config.websocket_config import get_websocket_config

logger = logging.getLogger(__name__)

class ConnectionInfo:
    """
    Información de una conexión WebSocket
    """
    
    def __init__(self, websocket: WebSocket, user_id: int, connection_id: str):
        self.websocket = websocket
        self.user_id = user_id
        self.connection_id = connection_id
        self.connected_at = datetime.utcnow()
        self.last_ping = datetime.utcnow()
        self.is_active = True
        self.message_queue: List[dict] = []
        
    def to_dict(self) -> dict:
        return {
            "connection_id": self.connection_id,
            "user_id": self.user_id,
            "connected_at": self.connected_at.isoformat(),
            "last_ping": self.last_ping.isoformat(),
            "is_active": self.is_active,
            "queue_size": len(self.message_queue)
        }

class WebSocketManager:
    """
    Gestor de conexiones WebSocket
    """
    
    def __init__(self):
        self.config = get_websocket_config()
        
        # Conexiones activas: {connection_id: ConnectionInfo}
        self.active_connections: Dict[str, ConnectionInfo] = {}
        
        # Conexiones por usuario: {user_id: {connection_id, ...}}
        self.user_connections: Dict[int, Set[str]] = defaultdict(set)
        
        # Salas/grupos: {room_name: {connection_id, ...}}
        self.rooms: Dict[str, Set[str]] = defaultdict(set)
        
        # Task de limpieza
        self._cleanup_task: Optional[asyncio.Task] = None
        self._heartbeat_task: Optional[asyncio.Task] = None
        
        # Estadísticas
        self.stats = {
            "total_connections": 0,
            "total_messages_sent": 0,
            "total_disconnections": 0,
            "start_time": datetime.utcnow()
        }
        
        # Iniciar tasks de mantenimiento
        self.start_background_tasks()
    
    # ===== GESTIÓN DE CONEXIONES =====
    
    async def connect(self, websocket: WebSocket, user_id: int) -> str:
        """
        Conectar un nuevo WebSocket
        """
        try:
            # Generar ID único para la conexión
            connection_id = str(uuid.uuid4())
            
            # Verificar límites
            if not self._can_accept_connection(user_id):
                await websocket.close(code=1008, reason="Connection limit exceeded")
                return None
            
            # Aceptar conexión WebSocket
            await websocket.accept()
            
            # Crear info de conexión
            connection_info = ConnectionInfo(websocket, user_id, connection_id)
            
            # Registrar conexión
            self.active_connections[connection_id] = connection_info
            self.user_connections[user_id].add(connection_id)
            
            # Actualizar estadísticas
            self.stats["total_connections"] += 1
            
            if self.config.log_connections:
                logger.info(f"✅ WebSocket conectado: user_id={user_id}, connection_id={connection_id}")
            
            # Enviar mensaje de bienvenida
            await self.send_to_connection(connection_id, {
                "type": "connected",
                "data": {
                    "connection_id": connection_id,
                    "user_id": user_id,
                    "server_time": datetime.utcnow().isoformat(),
                    "config": {
                        "heartbeat_interval": self.config.heartbeat_interval
                    }
                }
            })
            
            # Agregar a sala de usuario por defecto
            await self.join_room(connection_id, f"user_{user_id}")
            
            return connection_id
            
        except Exception as e:
            logger.error(f"💥 Error conectando WebSocket: {e}")
            try:
                await websocket.close(code=1011, reason="Internal server error")
            except:
                pass
            return None
    
    def disconnect(self, connection_id: str, code: int = 1000, reason: str = "Normal closure"):
        """
        Desconectar WebSocket
        """
        if connection_id not in self.active_connections:
            return
        
        connection_info = self.active_connections[connection_id]
        user_id = connection_info.user_id
        
        # Remover de todas las estructuras
        del self.active_connections[connection_id]
        self.user_connections[user_id].discard(connection_id)
        
        # Limpiar usuario si no tiene más conexiones
        if not self.user_connections[user_id]:
            del self.user_connections[user_id]
        
        # Remover de todas las salas
        for room_connections in self.rooms.values():
            room_connections.discard(connection_id)
        
        # Limpiar salas vacías
        empty_rooms = [room for room, connections in self.rooms.items() if not connections]
        for room in empty_rooms:
            del self.rooms[room]
        
        # Actualizar estadísticas
        self.stats["total_disconnections"] += 1
        
        if self.config.log_connections:
            logger.info(f"❌ WebSocket desconectado: user_id={user_id}, connection_id={connection_id}, code={code}")
    
    # ===== ENVÍO DE MENSAJES =====
    
    async def send_to_connection(self, connection_id: str, message: dict) -> bool:
        """
        Enviar mensaje a una conexión específica
        """
        if connection_id not in self.active_connections:
            return False
        
        connection_info = self.active_connections[connection_id]
        
        try:
            # Agregar timestamp
            message_with_timestamp = {
                **message,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await connection_info.websocket.send_text(json.dumps(message_with_timestamp))
            
            # Actualizar estadísticas
            self.stats["total_messages_sent"] += 1
            
            if self.config.log_messages:
                logger.debug(f"📤 Mensaje enviado a {connection_id}: {message['type']}")
            
            return True
            
        except Exception as e:
            logger.error(f"💥 Error enviando mensaje a {connection_id}: {e}")
            self.disconnect(connection_id, 1011, "Send error")
            return False
    
    async def send_to_user(self, user_id: int, message: dict) -> int:
        """
        Enviar mensaje a todas las conexiones de un usuario
        """
        if user_id not in self.user_connections:
            return 0
        
        sent_count = 0
        failed_connections = []
        
        for connection_id in self.user_connections[user_id].copy():
            if await self.send_to_connection(connection_id, message):
                sent_count += 1
            else:
                failed_connections.append(connection_id)
        
        # Limpiar conexiones fallidas
        for connection_id in failed_connections:
            self.disconnect(connection_id)
        
        return sent_count
    
    async def broadcast_to_all(self, message: dict, exclude_user_id: Optional[int] = None) -> int:
        """
        Broadcast a todas las conexiones
        """
        sent_count = 0
        
        for connection_id, connection_info in self.active_connections.copy().items():
            if exclude_user_id and connection_info.user_id == exclude_user_id:
                continue
            
            if await self.send_to_connection(connection_id, message):
                sent_count += 1
        
        return sent_count
    
    async def send_to_room(self, room_name: str, message: dict) -> int:
        """
        Enviar mensaje a todos en una sala
        """
        if room_name not in self.rooms:
            return 0
        
        sent_count = 0
        
        for connection_id in self.rooms[room_name].copy():
            if await self.send_to_connection(connection_id, message):
                sent_count += 1
        
        return sent_count
    
    # ===== GESTIÓN DE SALAS =====
    
    async def join_room(self, connection_id: str, room_name: str) -> bool:
        """
        Unir conexión a una sala
        """
        if connection_id not in self.active_connections:
            return False
        
        self.rooms[room_name].add(connection_id)
        
        await self.send_to_connection(connection_id, {
            "type": "room_joined",
            "data": {"room": room_name}
        })
        
        return True
    
    async def leave_room(self, connection_id: str, room_name: str) -> bool:
        """
        Salir de una sala
        """
        if room_name in self.rooms:
            self.rooms[room_name].discard(connection_id)
            
            # Limpiar sala si está vacía
            if not self.rooms[room_name]:
                del self.rooms[room_name]
        
        if connection_id in self.active_connections:
            await self.send_to_connection(connection_id, {
                "type": "room_left",
                "data": {"room": room_name}
            })
        
        return True
    
    # ===== UTILIDADES =====
    
    def _can_accept_connection(self, user_id: int) -> bool:
        """
        Verificar si se puede aceptar una nueva conexión
        """
        # Verificar límite total
        if len(self.active_connections) >= self.config.max_total_connections:
            return False
        
        # Verificar límite por usuario
        user_connection_count = len(self.user_connections.get(user_id, set()))
        if user_connection_count >= self.config.max_connections_per_user:
            return False
        
        return True
    
    def get_stats(self) -> dict:
        """
        Obtener estadísticas
        """
        uptime = datetime.utcnow() - self.stats["start_time"]
        
        return {
            **self.stats,
            "active_connections": len(self.active_connections),
            "unique_users": len(self.user_connections),
            "active_rooms": len(self.rooms),
            "uptime_seconds": int(uptime.total_seconds()),
            "connections_per_user": {
                user_id: len(connections) 
                for user_id, connections in self.user_connections.items()
            }
        }
    
    def get_user_connections(self, user_id: int) -> List[dict]:
        """
        Obtener conexiones de un usuario
        """
        if user_id not in self.user_connections:
            return []
        
        return [
            self.active_connections[conn_id].to_dict()
            for conn_id in self.user_connections[user_id]
            if conn_id in self.active_connections
        ]
    
    # ===== TASKS DE BACKGROUND =====
    
    def start_background_tasks(self):
        """
        Iniciar tasks de mantenimiento
        """
        if not self._cleanup_task:
            self._cleanup_task = asyncio.create_task(self._cleanup_task_runner())
        
        if not self._heartbeat_task:
            self._heartbeat_task = asyncio.create_task(self._heartbeat_task_runner())
    
    async def _cleanup_task_runner(self):
        """
        Task de limpieza periódica
        """
        while True:
            try:
                await asyncio.sleep(60)  # Cada minuto
                await self._cleanup_stale_connections()
            except Exception as e:
                logger.error(f"💥 Error en cleanup task: {e}")
    
    async def _heartbeat_task_runner(self):
        """
        Task de heartbeat
        """
        while True:
            try:
                await asyncio.sleep(self.config.heartbeat_interval)
                await self._send_heartbeat()
            except Exception as e:
                logger.error(f"💥 Error en heartbeat task: {e}")
    
    async def _cleanup_stale_connections(self):
        """
        Limpiar conexiones obsoletas
        """
        timeout_threshold = datetime.utcnow() - timedelta(seconds=self.config.connection_timeout)
        stale_connections = []
        
        for connection_id, connection_info in self.active_connections.items():
            if connection_info.last_ping < timeout_threshold:
                stale_connections.append(connection_id)
        
        for connection_id in stale_connections:
            logger.warning(f"🧹 Limpiando conexión obsoleta: {connection_id}")
            self.disconnect(connection_id, 1001, "Connection timeout")
    
    async def _send_heartbeat(self):
        """
        Enviar heartbeat a todas las conexiones
        """
        if not self.active_connections:
            return
        
        heartbeat_message = {
            "type": "heartbeat",
            "data": {"server_time": datetime.utcnow().isoformat()}
        }
        
        await self.broadcast_to_all(heartbeat_message)

# ===== INSTANCIA GLOBAL =====
websocket_manager = WebSocketManager()