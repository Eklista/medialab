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
import time
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
    def __init__(self):
        # Conexiones activas: {connection_id: connection_info}
        self.active_connections: Dict[str, Dict] = {}
        
        # Mapeo de usuarios a conexiones: {user_id: {connection_ids}}
        self.user_connections: Dict[int, Set[str]] = {}
        
        # Salas: {room_name: {connection_ids}}
        self.rooms: Dict[str, Set[str]] = {}
        
        # Estadísticas
        self.stats = {
            "total_connections": 0,
            "active_connections": 0,
            "total_messages": 0,
            "start_time": datetime.utcnow()
        }
        
        # Configuración
        self.max_connections_per_user = 5
        self.max_total_connections = 1000
        self.heartbeat_interval = 30  # segundos
        self.connection_timeout = 300  # 5 minutos
        
        # Tareas en background
        self._cleanup_task = None
        self._heartbeat_task = None
        
        # Iniciar tareas de mantenimiento
        self._start_background_tasks()
    
    async def connect(self, websocket: WebSocket, user_id: int, already_accepted: bool = False) -> Optional[str]:
        """
        Conecta un nuevo WebSocket - CORREGIDO PARA MANEJAR DICT
        """
        try:
            # Solo aceptar si no ha sido aceptado previamente
            if not already_accepted:
                await websocket.accept()
                logger.info(f"✅ Conexión WebSocket aceptada para usuario {user_id}")
            else:
                logger.info(f"✅ Usando conexión WebSocket ya aceptada para usuario {user_id}")
            
            # Generar ID único para la conexión
            connection_id = f"{user_id}_{int(time.time())}_{len(self.active_connections)}"
            
            # Verificar límites de conexión
            if not self._can_accept_connection(user_id):
                logger.warning(f"🚫 Límite de conexiones alcanzado para usuario {user_id}")
                await websocket.close(code=1008, reason="Connection limit reached")
                return None
            
            # 🔧 ALMACENAR LA CONEXIÓN (SIN ASUMIR QUE user_data ES UN OBJETO)
            self.active_connections[connection_id] = {
                "websocket": websocket,
                "user_id": user_id,
                "connected_at": datetime.utcnow(),
                "last_ping": datetime.utcnow(),
                "is_active": True  # ← Valor por defecto, no acceder al objeto usuario
            }
            
            # Mapear usuario a conexión
            if user_id not in self.user_connections:
                self.user_connections[user_id] = set()
            self.user_connections[user_id].add(connection_id)
            
            # Actualizar estadísticas
            self.stats["total_connections"] += 1
            self.stats["active_connections"] = len(self.active_connections)
            
            logger.info(f"✅ Nueva conexión WebSocket: {connection_id} para usuario {user_id}")
            
            # Enviar mensaje de confirmación
            await self.send_to_connection(connection_id, {
                "type": "connected",
                "data": {
                    "connection_id": connection_id,
                    "user_id": user_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
            })
            
            return connection_id
            
        except Exception as e:
            logger.error(f"💥 Error conectando WebSocket: {e}")
            return None
    
    def disconnect(self, connection_id: str, code: int = 1000, reason: str = "Normal closure") -> bool:
        """
        Desconecta una conexión WebSocket específica
        """
        try:
            if connection_id not in self.active_connections:
                logger.warning(f"⚠️ Intento de desconectar conexión inexistente: {connection_id}")
                return False
            
            connection_info = self.active_connections[connection_id]
            websocket = connection_info["websocket"]
            user_id = connection_info["user_id"]
            
            # Cerrar la conexión WebSocket
            try:
                asyncio.create_task(websocket.close(code=code, reason=reason))
            except Exception as close_error:
                logger.warning(f"⚠️ Error cerrando WebSocket {connection_id}: {close_error}")
            
            # Remover de conexiones activas
            del self.active_connections[connection_id]
            
            # Remover del mapeo de usuario
            if user_id in self.user_connections:
                self.user_connections[user_id].discard(connection_id)
                if not self.user_connections[user_id]:
                    del self.user_connections[user_id]
            
            # Remover de todas las salas
            for room_name, room_connections in self.rooms.items():
                room_connections.discard(connection_id)
            
            # Actualizar estadísticas
            self.stats["active_connections"] = len(self.active_connections)
            
            logger.info(f"✅ Conexión {connection_id} desconectada (usuario {user_id})")
            return True
            
        except Exception as e:
            logger.error(f"💥 Error desconectando {connection_id}: {e}")
            return False
    
    async def send_to_connection(self, connection_id: str, message: Dict[str, Any]) -> bool:
        """
        Envía un mensaje a una conexión específica - CORREGIDO
        """
        try:
            if connection_id not in self.active_connections:
                logger.warning(f"⚠️ Intento de enviar a conexión inexistente: {connection_id}")
                return False
            
            connection_info = self.active_connections[connection_id]
            websocket = connection_info["websocket"]
            
            # 🔧 VERIFICAR ESTADO DE LA CONEXIÓN SIN ACCEDER A ATRIBUTOS DE USUARIO
            if websocket.client_state.name != "CONNECTED":
                logger.warning(f"⚠️ Conexión {connection_id} no está en estado CONNECTED")
                return False
            
            # Enviar mensaje
            await websocket.send_text(json.dumps(message))
            
            # Actualizar estadísticas
            self.stats["total_messages"] += 1
            
            logger.debug(f"📤 Mensaje enviado a {connection_id}: {message.get('type', 'unknown')}")
            return True
            
        except Exception as e:
            logger.error(f"💥 Error enviando mensaje a {connection_id}: {e}")
            # Marcar conexión como problemática y desconectar
            self.disconnect(connection_id, 1011, "Send error")
            return False
    
    async def send_to_user(self, user_id: int, message: Dict[str, Any]) -> int:
        """
        Envía un mensaje a todas las conexiones de un usuario
        """
        sent_count = 0
        
        if user_id not in self.user_connections:
            logger.debug(f"👤 Usuario {user_id} no tiene conexiones activas")
            return 0
        
        # Crear copia de la lista para evitar modificaciones durante iteración
        connection_ids = list(self.user_connections[user_id])
        
        for connection_id in connection_ids:
            success = await self.send_to_connection(connection_id, message)
            if success:
                sent_count += 1
        
        logger.debug(f"📨 Mensaje enviado a {sent_count}/{len(connection_ids)} conexiones del usuario {user_id}")
        return sent_count
    
    async def broadcast_to_all(self, message: Dict[str, Any]) -> int:
        """
        Envía un mensaje a todas las conexiones activas
        """
        sent_count = 0
        connection_ids = list(self.active_connections.keys())
        
        for connection_id in connection_ids:
            success = await self.send_to_connection(connection_id, message)
            if success:
                sent_count += 1
        
        logger.info(f"📢 Broadcast enviado a {sent_count}/{len(connection_ids)} conexiones")
        return sent_count
    
    async def join_room(self, connection_id: str, room_name: str) -> bool:
        """
        Une una conexión a una sala
        """
        try:
            if connection_id not in self.active_connections:
                logger.warning(f"⚠️ Conexión {connection_id} no existe para unir a sala {room_name}")
                return False
            
            if room_name not in self.rooms:
                self.rooms[room_name] = set()
            
            self.rooms[room_name].add(connection_id)
            
            # Enviar confirmación
            await self.send_to_connection(connection_id, {
                "type": "room_joined",
                "data": {
                    "room": room_name,
                    "timestamp": datetime.utcnow().isoformat()
                }
            })
            
            logger.debug(f"🏠 Conexión {connection_id} unida a sala {room_name}")
            return True
            
        except Exception as e:
            logger.error(f"💥 Error uniendo {connection_id} a sala {room_name}: {e}")
            return False
    
    async def leave_room(self, connection_id: str, room_name: str) -> bool:
        """
        Saca una conexión de una sala
        """
        try:
            if room_name in self.rooms:
                self.rooms[room_name].discard(connection_id)
                
                # Limpiar sala vacía
                if not self.rooms[room_name]:
                    del self.rooms[room_name]
                
                logger.debug(f"🚪 Conexión {connection_id} salió de sala {room_name}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"💥 Error sacando {connection_id} de sala {room_name}: {e}")
            return False
    
    async def broadcast_to_room(self, room_name: str, message: Dict[str, Any]) -> int:
        """
        Envía un mensaje a todas las conexiones de una sala
        """
        if room_name not in self.rooms:
            logger.debug(f"🏠 Sala {room_name} no existe")
            return 0
        
        sent_count = 0
        connection_ids = list(self.rooms[room_name])
        
        for connection_id in connection_ids:
            success = await self.send_to_connection(connection_id, message)
            if success:
                sent_count += 1
        
        logger.debug(f"📨 Mensaje enviado a {sent_count}/{len(connection_ids)} conexiones en sala {room_name}")
        return sent_count
    
    def _can_accept_connection(self, user_id: int) -> bool:
        """
        Verifica si se puede aceptar una nueva conexión
        """
        # Verificar límite total
        if len(self.active_connections) >= self.max_total_connections:
            logger.warning(f"🚫 Límite total de conexiones alcanzado: {len(self.active_connections)}")
            return False
        
        # Verificar límite por usuario
        user_connections_count = len(self.user_connections.get(user_id, set()))
        if user_connections_count >= self.max_connections_per_user:
            logger.warning(f"🚫 Usuario {user_id} alcanzó límite de conexiones: {user_connections_count}")
            return False
        
        return True
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Obtiene estadísticas del WebSocket Manager
        """
        uptime = datetime.utcnow() - self.stats["start_time"]
        
        return {
            "active_connections": len(self.active_connections),
            "total_connections": self.stats["total_connections"],
            "total_messages": self.stats["total_messages"],
            "unique_users": len(self.user_connections),
            "active_rooms": len(self.rooms),
            "uptime_seconds": int(uptime.total_seconds()),
            "max_connections_per_user": self.max_connections_per_user,
            "max_total_connections": self.max_total_connections
        }
    
    def _start_background_tasks(self):
        """
        Inicia tareas de mantenimiento en background
        """
        try:
            # Tarea de limpieza de conexiones
            self._cleanup_task = asyncio.create_task(self._periodic_cleanup())
            
            # Tarea de heartbeat
            self._heartbeat_task = asyncio.create_task(self._periodic_heartbeat())
            
            logger.info("✅ Tareas de mantenimiento WebSocket iniciadas")
            
        except Exception as e:
            logger.error(f"💥 Error iniciando tareas de mantenimiento: {e}")
    
    async def _periodic_cleanup(self):
        """
        Limpieza periódica de conexiones muertas
        """
        while True:
            try:
                await asyncio.sleep(60)  # Ejecutar cada minuto
                
                cleanup_count = 0
                current_time = datetime.utcnow()
                connection_ids_to_remove = []
                
                for connection_id, connection_info in self.active_connections.items():
                    # Verificar timeout de conexión
                    last_activity = connection_info.get("last_ping", connection_info["connected_at"])
                    if current_time - last_activity > timedelta(seconds=self.connection_timeout):
                        connection_ids_to_remove.append(connection_id)
                        cleanup_count += 1
                
                # Remover conexiones expiradas
                for connection_id in connection_ids_to_remove:
                    self.disconnect(connection_id, 1000, "Connection timeout")
                
                if cleanup_count > 0:
                    logger.info(f"🧹 Limpieza completada: {cleanup_count} conexiones removidas")
                
            except Exception as e:
                logger.error(f"💥 Error en limpieza periódica: {e}")
    
    async def _periodic_heartbeat(self):
        """
        Heartbeat periódico para mantener conexiones vivas
        """
        while True:
            try:
                await asyncio.sleep(self.heartbeat_interval)
                
                heartbeat_message = {
                    "type": "heartbeat",
                    "data": {"timestamp": datetime.utcnow().isoformat()}
                }
                
                sent_count = await self.broadcast_to_all(heartbeat_message)
                logger.debug(f"💓 Heartbeat enviado a {sent_count} conexiones")
                
            except Exception as e:
                logger.error(f"💥 Error en heartbeat periódico: {e}")
    
    async def shutdown(self):
        """
        Cierra el WebSocket Manager y todas las conexiones
        """
        logger.info("🛑 Iniciando shutdown del WebSocket Manager...")
        
        # Cancelar tareas de background
        if self._cleanup_task:
            self._cleanup_task.cancel()
        
        if self._heartbeat_task:
            self._heartbeat_task.cancel()
        
        # Cerrar todas las conexiones
        connection_ids = list(self.active_connections.keys())
        for connection_id in connection_ids:
            self.disconnect(connection_id, 1001, "Server shutdown")
        
        logger.info("✅ WebSocket Manager cerrado correctamente")

# Instancia global del manager
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