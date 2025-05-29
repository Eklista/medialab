# backend/app/services/websocket/websocket_manager.py
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

# ✅ IMPORTACIÓN CORREGIDA
from app.config.websocket_config import get_websocket_config

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
        self.rooms: Set[str] = set()  # Salas a las que pertenece esta conexión
        self.metadata: Dict[str, Any] = {}  # Información adicional
        
    def to_dict(self) -> dict:
        return {
            "connection_id": self.connection_id,
            "user_id": self.user_id,
            "connected_at": self.connected_at.isoformat(),
            "last_ping": self.last_ping.isoformat(),
            "is_active": self.is_active,
            "queue_size": len(self.message_queue),
            "rooms": list(self.rooms),
            "uptime_seconds": int((datetime.utcnow() - self.connected_at).total_seconds()),
            "metadata": self.metadata
        }
    
    def update_ping(self):
        """Actualiza el timestamp del último ping"""
        self.last_ping = datetime.utcnow()
    
    def add_to_room(self, room_name: str):
        """Agrega la conexión a una sala"""
        self.rooms.add(room_name)
    
    def remove_from_room(self, room_name: str):
        """Remueve la conexión de una sala"""
        self.rooms.discard(room_name)

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
        
        # Task de limpieza y heartbeat
        self._cleanup_task: Optional[asyncio.Task] = None
        self._heartbeat_task: Optional[asyncio.Task] = None
        
        # Estadísticas
        self.stats = {
            "total_connections": 0,
            "total_messages_sent": 0,
            "total_disconnections": 0,
            "total_errors": 0,
            "start_time": datetime.utcnow()
        }
        
        # Cola de mensajes para envío diferido
        self._message_queue: List[Dict[str, Any]] = []
        
        # Control de shutdown
        self._is_shutting_down = False
        
        # Iniciar tasks de mantenimiento
        self.start_background_tasks()
        
        logger.info("🔌 WebSocket Manager inicializado")
    
    # ===== GESTIÓN DE CONEXIONES =====
    
    async def connect(self, websocket: WebSocket, user_id: int) -> Optional[str]:
        """
        Conectar un nuevo WebSocket
        """
        try:
            # Verificar si estamos en shutdown
            if self._is_shutting_down:
                await websocket.close(code=1012, reason="Server restarting")
                return None
            
            # Generar ID único para la conexión
            connection_id = str(uuid.uuid4())
            
            # Verificar límites
            if not self._can_accept_connection(user_id):
                logger.warning(f"🚫 Conexión rechazada - límites excedidos para usuario {user_id}")
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
                        "heartbeat_interval": self.config.heartbeat_interval,
                        "max_message_size": self.config.max_message_size
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
        
        try:
            # Cerrar la conexión WebSocket si está abierta
            if connection_info.websocket and connection_info.is_active:
                asyncio.create_task(self._close_websocket_safely(connection_info.websocket, code, reason))
                
        except Exception as e:
            logger.error(f"💥 Error cerrando WebSocket {connection_id}: {e}")
        
        # Remover de todas las estructuras
        del self.active_connections[connection_id]
        self.user_connections[user_id].discard(connection_id)
        
        # Limpiar usuario si no tiene más conexiones
        if not self.user_connections[user_id]:
            del self.user_connections[user_id]
        
        # Remover de todas las salas
        for room_name, room_connections in self.rooms.items():
            room_connections.discard(connection_id)
        
        # Limpiar salas vacías
        empty_rooms = [room for room, connections in self.rooms.items() if not connections]
        for room in empty_rooms:
            del self.rooms[room]
        
        # Actualizar estadísticas
        self.stats["total_disconnections"] += 1
        
        if self.config.log_connections:
            logger.info(f"❌ WebSocket desconectado: user_id={user_id}, connection_id={connection_id}, code={code}")
    
    async def _close_websocket_safely(self, websocket: WebSocket, code: int, reason: str):
        """
        Cierra una conexión WebSocket de forma segura
        """
        try:
            await websocket.close(code=code, reason=reason)
        except Exception as e:
            logger.debug(f"Info: Error cerrando WebSocket (normal si ya estaba cerrado): {e}")
    
    # ===== ENVÍO DE MENSAJES =====
    
    async def send_to_connection(self, connection_id: str, message: dict) -> bool:
        """
        Enviar mensaje a una conexión específica
        """
        if connection_id not in self.active_connections:
            return False
        
        connection_info = self.active_connections[connection_id]
        
        try:
            # Verificar que la conexión esté activa
            if not connection_info.is_active:
                return False
            
            # Agregar timestamp y metadata
            message_with_timestamp = {
                **message,
                "timestamp": datetime.utcnow().isoformat(),
                "connection_id": connection_id
            }
            
            # Verificar tamaño del mensaje
            message_str = json.dumps(message_with_timestamp)
            if len(message_str) > self.config.max_message_size:
                logger.warning(f"⚠️ Mensaje demasiado grande para {connection_id}: {len(message_str)} bytes")
                return False
            
            await connection_info.websocket.send_text(message_str)
            
            # Actualizar estadísticas
            self.stats["total_messages_sent"] += 1
            
            if self.config.log_messages:
                logger.debug(f"📤 Mensaje enviado a {connection_id}: {message['type']}")
            
            return True
            
        except Exception as e:
            logger.error(f"💥 Error enviando mensaje a {connection_id}: {e}")
            self.stats["total_errors"] += 1
            
            # Marcar conexión como inactiva y desconectar
            connection_info.is_active = False
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
        failed_connections = []
        
        for connection_id, connection_info in self.active_connections.copy().items():
            if exclude_user_id and connection_info.user_id == exclude_user_id:
                continue
            
            if await self.send_to_connection(connection_id, message):
                sent_count += 1
            else:
                failed_connections.append(connection_id)
        
        # Limpiar conexiones fallidas
        for connection_id in failed_connections:
            self.disconnect(connection_id)
        
        return sent_count
    
    async def send_to_room(self, room_name: str, message: dict) -> int:
        """
        Enviar mensaje a todos en una sala
        """
        if room_name not in self.rooms:
            return 0
        
        sent_count = 0
        failed_connections = []
        
        for connection_id in self.rooms[room_name].copy():
            if await self.send_to_connection(connection_id, message):
                sent_count += 1
            else:
                failed_connections.append(connection_id)
        
        # Limpiar conexiones fallidas
        for connection_id in failed_connections:
            self.disconnect(connection_id)
        
        return sent_count
    
    # ===== GESTIÓN DE SALAS =====
    
    async def join_room(self, connection_id: str, room_name: str) -> bool:
        """
        Unir conexión a una sala
        """
        if connection_id not in self.active_connections:
            return False
        
        # Agregar a la sala
        self.rooms[room_name].add(connection_id)
        
        # Actualizar info de la conexión
        connection_info = self.active_connections[connection_id]
        connection_info.add_to_room(room_name)
        
        await self.send_to_connection(connection_id, {
            "type": "room_joined",
            "data": {
                "room": room_name,
                "members_count": len(self.rooms[room_name])
            }
        })
        
        logger.debug(f"🏠 Conexión {connection_id} unida a sala '{room_name}' ({len(self.rooms[room_name])} miembros)")
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
        
        # Actualizar info de la conexión
        if connection_id in self.active_connections:
            connection_info = self.active_connections[connection_id]
            connection_info.remove_from_room(room_name)
            
            await self.send_to_connection(connection_id, {
                "type": "room_left",
                "data": {
                    "room": room_name
                }
            })
        
        logger.debug(f"🏠 Conexión {connection_id} salió de sala '{room_name}'")
        return True
    
    def get_room_members(self, room_name: str) -> List[Dict[str, Any]]:
        """
        Obtiene los miembros de una sala
        """
        if room_name not in self.rooms:
            return []
        
        members = []
        for connection_id in self.rooms[room_name]:
            if connection_id in self.active_connections:
                connection_info = self.active_connections[connection_id]
                members.append({
                    "connection_id": connection_id,
                    "user_id": connection_info.user_id,
                    "connected_at": connection_info.connected_at.isoformat()
                })
        
        return members
    
    # ===== UTILIDADES =====
    
    def _can_accept_connection(self, user_id: int) -> bool:
        """
        Verificar si se puede aceptar una nueva conexión
        """
        # Verificar límite total
        if len(self.active_connections) >= self.config.max_total_connections:
            logger.warning(f"🚫 Límite total de conexiones alcanzado: {len(self.active_connections)}/{self.config.max_total_connections}")
            return False
        
        # Verificar límite por usuario
        user_connection_count = len(self.user_connections.get(user_id, set()))
        if user_connection_count >= self.config.max_connections_per_user:
            logger.warning(f"🚫 Límite de conexiones por usuario alcanzado para {user_id}: {user_connection_count}/{self.config.max_connections_per_user}")
            return False
        
        return True
    
    def get_stats(self) -> dict:
        """
        Obtener estadísticas completas
        """
        uptime = datetime.utcnow() - self.stats["start_time"]
        
        # Estadísticas de salas
        room_stats = {}
        for room_name, connections in self.rooms.items():
            room_stats[room_name] = len(connections)
        
        return {
            **self.stats,
            "active_connections": len(self.active_connections),
            "unique_users": len(self.user_connections),
            "active_rooms": len(self.rooms),
            "uptime_seconds": int(uptime.total_seconds()),
            "connections_per_user": {
                user_id: len(connections) 
                for user_id, connections in self.user_connections.items()
            },
            "room_stats": room_stats,
            "background_tasks": {
                "cleanup_task_running": self._cleanup_task is not None and not self._cleanup_task.done(),
                "heartbeat_task_running": self._heartbeat_task is not None and not self._heartbeat_task.done()
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
    
    def get_connection_info(self, connection_id: str) -> Optional[dict]:
        """
        Obtener información de una conexión específica
        """
        if connection_id in self.active_connections:
            return self.active_connections[connection_id].to_dict()
        return None
    
    # ===== TASKS DE BACKGROUND =====
    
    def start_background_tasks(self):
        """
        Iniciar tasks de mantenimiento
        """
        if not self._cleanup_task or self._cleanup_task.done():
            self._cleanup_task = asyncio.create_task(self._cleanup_task_runner())
            logger.info("🧹 Task de limpieza iniciado")
        
        if not self._heartbeat_task or self._heartbeat_task.done():
            self._heartbeat_task = asyncio.create_task(self._heartbeat_task_runner())
            logger.info("💓 Task de heartbeat iniciado")
    
    def stop_background_tasks(self):
        """
        Detener tasks de background
        """
        if self._cleanup_task and not self._cleanup_task.done():
            self._cleanup_task.cancel()
            logger.info("🧹 Task de limpieza detenido")
        
        if self._heartbeat_task and not self._heartbeat_task.done():
            self._heartbeat_task.cancel()
            logger.info("💓 Task de heartbeat detenido")
    
    async def _cleanup_task_runner(self):
        """
        Task de limpieza periódica
        """
        while not self._is_shutting_down:
            try:
                await asyncio.sleep(60)  # Cada minuto
                await self._cleanup_stale_connections()
                await self._cleanup_empty_rooms()
            except asyncio.CancelledError:
                logger.info("🧹 Task de limpieza cancelado")
                break
            except Exception as e:
                logger.error(f"💥 Error en cleanup task: {e}")
    
    async def _heartbeat_task_runner(self):
        """
        Task de heartbeat
        """
        while not self._is_shutting_down:
            try:
                await asyncio.sleep(self.config.heartbeat_interval)
                await self._send_heartbeat()
            except asyncio.CancelledError:
                logger.info("💓 Task de heartbeat cancelado")
                break
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
    
    async def _cleanup_empty_rooms(self):
        """
        Limpiar salas vacías
        """
        empty_rooms = [room for room, connections in self.rooms.items() if not connections]
        for room in empty_rooms:
            del self.rooms[room]
            logger.debug(f"🧹 Sala vacía eliminada: {room}")
    
    async def _send_heartbeat(self):
        """
        Enviar heartbeat a todas las conexiones
        """
        if not self.active_connections:
            return
        
        heartbeat_message = {
            "type": "heartbeat",
            "data": {
                "server_time": datetime.utcnow().isoformat(),
                "active_connections": len(self.active_connections)
            }
        }
        
        sent_count = await self.broadcast_to_all(heartbeat_message)
        logger.debug(f"💓 Heartbeat enviado a {sent_count} conexiones")
    
    # ===== SHUTDOWN Y CLEANUP =====
    
    async def shutdown(self):
        """
        Cierra todas las conexiones y limpia recursos
        """
        logger.info("🛑 Iniciando shutdown del WebSocket Manager...")
        
        self._is_shutting_down = True
        
        # Detener tasks de background
        self.stop_background_tasks()
        
        # Enviar mensaje de cierre a todas las conexiones
        if self.active_connections:
            shutdown_message = {
                "type": "server_shutdown",
                "data": {
                    "message": "El servidor se está cerrando",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
            
            await self.broadcast_to_all(shutdown_message)
            
            # Dar tiempo para que llegue el mensaje
            await asyncio.sleep(1)
        
        # Desconectar todas las conexiones activas
        active_connections = list(self.active_connections.keys())
        for connection_id in active_connections:
            self.disconnect(connection_id, 1001, "Server shutdown")
        
        logger.info(f"🛑 WebSocket Manager cerrado - {len(active_connections)} conexiones desconectadas")

# ===== INSTANCIA GLOBAL =====
websocket_manager = WebSocketManager()

# ===== FUNCIONES DE UTILIDAD =====

def get_websocket_manager() -> WebSocketManager:
    """
    Obtiene la instancia global del WebSocket Manager
    """
    return websocket_manager

async def get_connection_count() -> int:
    """
    Obtiene el número total de conexiones activas
    """
    return len(websocket_manager.active_connections)

async def get_user_count() -> int:
    """
    Obtiene el número de usuarios únicos conectados
    """
    return len(websocket_manager.user_connections)

async def is_user_connected(user_id: int) -> bool:
    """
    Verifica si un usuario tiene al menos una conexión activa
    """
    return user_id in websocket_manager.user_connections

async def get_room_count() -> int:
    """
    Obtiene el número de salas activas
    """
    return len(websocket_manager.rooms)

# ===== DECORADORES PARA MANEJO DE ERRORES =====

def handle_websocket_errors(func):
    """
    Decorador para manejar errores en operaciones WebSocket
    """
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            logger.error(f"💥 Error en operación WebSocket {func.__name__}: {e}")
            return None
    return wrapper

# ===== MONITOREO Y DEBUGGING =====

class WebSocketMonitor:
    """
    Clase para monitorear el estado del WebSocket Manager
    """
    
    @staticmethod
    def get_health_status() -> Dict[str, Any]:
        """
        Obtiene el estado de salud del WebSocket Manager
        """
        stats = websocket_manager.get_stats()
        
        # Definir umbrales de salud
        connection_threshold = websocket_manager.config.max_total_connections * 0.8
        error_rate_threshold = 0.1  # 10% de errores máximo
        
        # Calcular métricas de salud
        connection_usage = stats["active_connections"] / websocket_manager.config.max_total_connections
        total_operations = stats["total_messages_sent"] + stats["total_connections"]
        error_rate = stats["total_errors"] / max(total_operations, 1)
        
        is_healthy = (
            stats["active_connections"] < connection_threshold and
            error_rate < error_rate_threshold and
            not websocket_manager._is_shutting_down
        )
        
        return {
            "healthy": is_healthy,
            "connection_usage_percent": round(connection_usage * 100, 2),
            "error_rate_percent": round(error_rate * 100, 2),
            "active_connections": stats["active_connections"],
            "max_connections": websocket_manager.config.max_total_connections,
            "background_tasks_running": {
                "cleanup": websocket_manager._cleanup_task is not None and not websocket_manager._cleanup_task.done(),
                "heartbeat": websocket_manager._heartbeat_task is not None and not websocket_manager._heartbeat_task.done()
            },
            "uptime_seconds": stats["uptime_seconds"],
            "total_errors": stats["total_errors"],
            "is_shutting_down": websocket_manager._is_shutting_down
        }
    
    @staticmethod
    def get_performance_metrics() -> Dict[str, Any]:
        """
        Obtiene métricas de rendimiento del WebSocket Manager
        """
        stats = websocket_manager.get_stats()
        uptime_hours = stats["uptime_seconds"] / 3600
        
        return {
            "messages_per_hour": round(stats["total_messages_sent"] / max(uptime_hours, 1), 2),
            "connections_per_hour": round(stats["total_connections"] / max(uptime_hours, 1), 2),
            "disconnections_per_hour": round(stats["total_disconnections"] / max(uptime_hours, 1), 2),
            "average_connections": round(stats["active_connections"] / max(len(websocket_manager.user_connections), 1), 2),
            "total_rooms_created": len(websocket_manager.rooms),
            "memory_usage": {
                "active_connections": len(websocket_manager.active_connections),
                "user_mappings": len(websocket_manager.user_connections),
                "room_mappings": len(websocket_manager.rooms)
            }
        }
    
    @staticmethod
    def get_connection_details() -> List[Dict[str, Any]]:
        """
        Obtiene detalles de todas las conexiones activas
        """
        connections = []
        
        for connection_id, connection_info in websocket_manager.active_connections.items():
            connections.append({
                "connection_id": connection_id,
                "user_id": connection_info.user_id,
                "connected_at": connection_info.connected_at.isoformat(),
                "uptime_seconds": int((datetime.utcnow() - connection_info.connected_at).total_seconds()),
                "last_ping": connection_info.last_ping.isoformat(),
                "rooms": list(connection_info.rooms),
                "queue_size": len(connection_info.message_queue),
                "is_active": connection_info.is_active
            })
        
        return connections
    
    @staticmethod
    def get_room_details() -> Dict[str, Dict[str, Any]]:
        """
        Obtiene detalles de todas las salas activas
        """
        room_details = {}
        
        for room_name, connection_ids in websocket_manager.rooms.items():
            users_in_room = set()
            connections_info = []
            
            for connection_id in connection_ids:
                if connection_id in websocket_manager.active_connections:
                    connection_info = websocket_manager.active_connections[connection_id]
                    users_in_room.add(connection_info.user_id)
                    connections_info.append({
                        "connection_id": connection_id,
                        "user_id": connection_info.user_id,
                        "connected_at": connection_info.connected_at.isoformat()
                    })
            
            room_details[room_name] = {
                "total_connections": len(connection_ids),
                "unique_users": len(users_in_room),
                "connections": connections_info
            }
        
        return room_details

# ===== TESTING Y DEBUGGING =====

class WebSocketTester:
    """
    Utilidades para testing del WebSocket Manager
    """
    
    @staticmethod
    async def simulate_connection_load(num_users: int = 10, connections_per_user: int = 2) -> Dict[str, Any]:
        """
        Simula carga de conexiones para testing
        NOTA: Solo para desarrollo/testing
        """
        if websocket_manager.config.development_mode:
            logger.warning("🧪 Ejecutando simulación de carga - SOLO PARA DESARROLLO")
            
            simulated_connections = 0
            
            # Esta sería una simulación básica - en realidad necesitarías WebSocket reales
            for user_id in range(1, num_users + 1):
                for conn_num in range(connections_per_user):
                    # Simular estadísticas sin conexiones reales
                    websocket_manager.stats["total_connections"] += 1
                    simulated_connections += 1
            
            return {
                "test_completed": True,
                "simulated_connections": simulated_connections,
                "message": "Simulación de estadísticas completada",
                "warning": "Esto es solo una simulación para desarrollo"
            }
        else:
            return {
                "test_completed": False,
                "error": "Test de carga solo disponible en modo desarrollo"
            }
    
    @staticmethod
    def validate_manager_state() -> Dict[str, Any]:
        """
        Valida la consistencia del estado interno del manager
        """
        issues = []
        
        # Verificar consistencia entre conexiones activas y mapeos de usuario
        for user_id, connection_ids in websocket_manager.user_connections.items():
            for connection_id in connection_ids:
                if connection_id not in websocket_manager.active_connections:
                    issues.append(f"Conexión {connection_id} en user_connections pero no en active_connections")
        
        # Verificar consistencia entre conexiones activas y salas
        for room_name, connection_ids in websocket_manager.rooms.items():
            for connection_id in connection_ids:
                if connection_id not in websocket_manager.active_connections:
                    issues.append(f"Conexión {connection_id} en room {room_name} pero no en active_connections")
        
        # Verificar que las conexiones tengan referencias correctas a las salas
        for connection_id, connection_info in websocket_manager.active_connections.items():
            for room_name in connection_info.rooms:
                if room_name not in websocket_manager.rooms or connection_id not in websocket_manager.rooms[room_name]:
                    issues.append(f"Conexión {connection_id} cree estar en sala {room_name} pero no está registrada")
        
        return {
            "is_consistent": len(issues) == 0,
            "issues_found": len(issues),
            "issues": issues,
            "validation_timestamp": datetime.utcnow().isoformat()
        }

# ===== EXPORTACIONES =====

__all__ = [
    'WebSocketManager',
    'ConnectionInfo',
    'websocket_manager',
    'get_websocket_manager',
    'get_connection_count',
    'get_user_count',
    'is_user_connected',
    'get_room_count',
    'WebSocketMonitor',
    'WebSocketTester',
    'handle_websocket_errors'
]