# backend/app/services/websocket/websocket_service.py
"""
🔌 SERVICIO WEBSOCKET
"""

from typing import Dict, List, Optional, Any
import json
import logging
from datetime import datetime

# ✅ IMPORTACIONES CORREGIDAS
from app.config.websocket_config import get_websocket_config
from app.services.websocket.websocket_manager import websocket_manager

logger = logging.getLogger(__name__)

class WebSocketService:
    """
    Servicio de WebSocket - Maneja la lógica de negocio
    """
    
    def __init__(self):
        self.config = get_websocket_config()
    
    # ===== NOTIFICACIONES DE USUARIOS =====
    
    async def notify_user_updated(self, user_data: Dict[str, Any]) -> int:
        """
        Notifica actualización de usuario
        """
        message = {
            "type": "user_updated",
            "data": user_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        user_id = user_data.get("id")
        if user_id:
            # Notificar al usuario específico
            sent_count = await websocket_manager.send_to_user(user_id, message)
            
            # También notificar a administradores
            admin_message = {
                "type": "user_updated",
                "data": {
                    **user_data,
                    "is_admin_notification": True
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Broadcast a sala de administradores
            admin_count = await websocket_manager.send_to_room("admin_room", admin_message)
            
            logger.info(f"Usuario {user_id} actualizado: {sent_count} conexiones personales, {admin_count} admins")
            return sent_count + admin_count
        
        return 0
    
    async def notify_user_created(self, user_data: Dict[str, Any]) -> int:
        """
        Notifica creación de usuario
        """
        message = {
            "type": "system_data_updated",
            "data": {
                "type": "user",
                "action": "created",
                "user": user_data
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Notificar a administradores
        sent_count = await websocket_manager.send_to_room("admin_room", message)
        logger.info(f"Usuario creado notificado a {sent_count} administradores")
        return sent_count
    
    async def notify_user_deleted(self, user_id: int) -> int:
        """
        Notifica eliminación de usuario
        """
        message = {
            "type": "system_data_updated",
            "data": {
                "type": "user",
                "action": "deleted",
                "userId": user_id
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Notificar a administradores
        sent_count = await websocket_manager.send_to_room("admin_room", message)
        logger.info(f"Usuario {user_id} eliminado notificado a {sent_count} administradores")
        return sent_count
    
    # ===== NOTIFICACIONES DE ROLES =====
    
    async def notify_role_updated(self, role_data: Dict[str, Any]) -> int:
        """
        Notifica actualización de rol
        """
        message = {
            "type": "system_data_updated",
            "data": {
                "type": "role",
                "action": "updated",
                "role": role_data
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Broadcast a todos los usuarios (los roles pueden afectar permisos)
        sent_count = await websocket_manager.broadcast_to_all(message)
        logger.info(f"Rol actualizado notificado a {sent_count} conexiones")
        return sent_count
    
    async def notify_role_created(self, role_data: Dict[str, Any]) -> int:
        """
        Notifica creación de rol
        """
        message = {
            "type": "system_data_updated",
            "data": {
                "type": "role",
                "action": "created",
                "role": role_data
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        sent_count = await websocket_manager.send_to_room("admin_room", message)
        logger.info(f"Rol creado notificado a {sent_count} administradores")
        return sent_count
    
    async def notify_role_deleted(self, role_id: int) -> int:
        """
        Notifica eliminación de rol
        """
        message = {
            "type": "system_data_updated",
            "data": {
                "type": "role",
                "action": "deleted",
                "roleId": role_id
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        sent_count = await websocket_manager.broadcast_to_all(message)
        logger.info(f"Rol {role_id} eliminado notificado a {sent_count} conexiones")
        return sent_count
    
    # ===== NOTIFICACIONES DE ÁREAS =====
    
    async def notify_area_updated(self, area_data: Dict[str, Any]) -> int:
        """
        Notifica actualización de área
        """
        message = {
            "type": "system_data_updated",
            "data": {
                "type": "area",
                "action": "updated",
                "area": area_data
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        sent_count = await websocket_manager.broadcast_to_all(message)
        logger.info(f"Área actualizada notificada a {sent_count} conexiones")
        return sent_count
    
    async def notify_area_created(self, area_data: Dict[str, Any]) -> int:
        """
        Notifica creación de área
        """
        message = {
            "type": "system_data_updated",
            "data": {
                "type": "area",
                "action": "created",
                "area": area_data
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        sent_count = await websocket_manager.send_to_room("admin_room", message)
        logger.info(f"Área creada notificada a {sent_count} administradores")
        return sent_count
    
    async def notify_area_deleted(self, area_id: int) -> int:
        """
        Notifica eliminación de área
        """
        message = {
            "type": "system_data_updated",
            "data": {
                "type": "area",
                "action": "deleted",
                "areaId": area_id
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        sent_count = await websocket_manager.broadcast_to_all(message)
        logger.info(f"Área {area_id} eliminada notificada a {sent_count} conexiones")
        return sent_count
    
    # ===== NOTIFICACIONES GENERALES =====
    
    async def send_notification(
        self, 
        user_id: int, 
        title: str, 
        message: str, 
        type: str = "info",
        data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Envía notificación a un usuario específico
        """
        notification = {
            "type": "notification",
            "data": {
                "title": title,
                "message": message,
                "notification_type": type,
                "timestamp": datetime.utcnow().isoformat(),
                "data": data or {}
            }
        }
        
        sent_count = await websocket_manager.send_to_user(user_id, notification)
        return sent_count > 0
    
    async def broadcast_system_notification(
        self, 
        title: str, 
        message: str, 
        type: str = "system",
        exclude_user_id: Optional[int] = None
    ) -> int:
        """
        Broadcast de notificación del sistema
        """
        notification = {
            "type": "notification",
            "data": {
                "title": title,
                "message": message,
                "notification_type": type,
                "timestamp": datetime.utcnow().isoformat(),
                "is_system": True
            }
        }
        
        sent_count = await websocket_manager.broadcast_to_all(
            notification, 
            exclude_user_id=exclude_user_id
        )
        logger.info(f"Notificación del sistema enviada a {sent_count} conexiones")
        return sent_count
    
    # ===== MANEJO DE SALAS =====
    
    async def join_admin_room(self, connection_id: str) -> bool:
        """
        Une una conexión a la sala de administradores
        """
        return await websocket_manager.join_room(connection_id, "admin_room")
    
    async def join_user_room(self, connection_id: str, user_id: int) -> bool:
        """
        Une una conexión a la sala específica del usuario
        """
        return await websocket_manager.join_room(connection_id, f"user_{user_id}")
    
    async def join_area_room(self, connection_id: str, area_id: int) -> bool:
        """
        Une una conexión a la sala de un área específica
        """
        return await websocket_manager.join_room(connection_id, f"area_{area_id}")
    
    # ===== ESTADÍSTICAS Y MONITOREO =====
    
    def get_service_stats(self) -> Dict[str, Any]:
        """
        Obtiene estadísticas del servicio WebSocket
        """
        manager_stats = websocket_manager.get_stats()
        
        return {
            "service_info": {
                "enabled": self.config.websocket_enabled,
                "host": self.config.websocket_host,
                "port": self.config.websocket_port
            },
            "manager_stats": manager_stats,
            "configuration": {
                "max_connections_per_user": self.config.max_connections_per_user,
                "max_total_connections": self.config.max_total_connections,
                "heartbeat_interval": self.config.heartbeat_interval,
                "connection_timeout": self.config.connection_timeout
            }
        }
    
    # ===== MANTENIMIENTO =====
    
    async def send_maintenance_notification(self, message: str, minutes_until: int = 5) -> int:
        """
        Envía notificación de mantenimiento
        """
        notification = {
            "type": "notification",
            "data": {
                "type": "system_maintenance",
                "title": "Mantenimiento Programado",
                "message": message,
                "minutes_until": minutes_until,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        sent_count = await websocket_manager.broadcast_to_all(notification)
        logger.warning(f"Notificación de mantenimiento enviada a {sent_count} conexiones")
        return sent_count
    
    async def handle_ping(self, connection_id: str) -> bool:
        """
        Maneja ping de conexión
        """
        pong_message = {
            "type": "pong",
            "data": {
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        return await websocket_manager.send_to_connection(connection_id, pong_message)
    
    # ===== LIMPIEZA =====
    
    async def cleanup_stale_connections(self) -> int:
        """
        Limpia conexiones obsoletas (delegado al manager)
        """
        # Esta funcionalidad ya está implementada en el manager
        # con tasks en background
        return len(websocket_manager.active_connections)

# ===== INSTANCIA GLOBAL =====
websocket_service = WebSocketService()