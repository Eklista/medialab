# backend/app/services/websocket/notification_service.py
"""
🔔 SERVICIO DE NOTIFICACIONES WEBSOCKET
Integra WebSocket con los servicios existentes para notificaciones en tiempo real
"""

from typing import Dict, Any, List, Optional
import asyncio
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class WebSocketNotificationService:
    """
    Servicio que conecta las operaciones CRUD con notificaciones WebSocket
    """
    
    def __init__(self):
        self.websocket_service = None
        self._initialize_websocket_service()
    
    def _initialize_websocket_service(self):
        """
        Inicializa el servicio WebSocket de forma lazy
        """
        try:
            from app.services.websocket.websocket_service import websocket_service
            self.websocket_service = websocket_service
            logger.info("✅ WebSocket notification service inicializado")
        except ImportError:
            logger.warning("⚠️ WebSocket service no disponible")
            self.websocket_service = None
    
    async def notify_user_updated(self, user_data: Dict[str, Any], updated_by_id: Optional[int] = None) -> bool:
        """
        Notifica actualización de usuario
        """
        if not self.websocket_service:
            return False
        
        try:
            # Notificar al usuario específico
            user_count = await self.websocket_service.notify_user_updated(user_data)
            
            # Si fue actualizado por otro usuario (admin), notificar también
            if updated_by_id and updated_by_id != user_data.get("id"):
                await self.websocket_service.send_notification(
                    user_id=updated_by_id,
                    title="Usuario Actualizado",
                    message=f"Usuario {user_data.get('email')} actualizado exitosamente",
                    type="success"
                )
            
            logger.info(f"📨 Notificación de usuario actualizado enviada a {user_count} conexiones")
            return user_count > 0
            
        except Exception as e:
            logger.error(f"💥 Error notificando actualización de usuario: {e}")
            return False
    
    async def notify_user_created(self, user_data: Dict[str, Any], created_by_id: int) -> bool:
        """
        Notifica creación de usuario
        """
        if not self.websocket_service:
            return False
        
        try:
            # Notificar a administradores
            admin_count = await self.websocket_service.notify_user_created(user_data)
            
            # Notificar al creador
            await self.websocket_service.send_notification(
                user_id=created_by_id,
                title="Usuario Creado",
                message=f"Usuario {user_data.get('email')} creado exitosamente",
                type="success"
            )
            
            logger.info(f"📨 Notificación de usuario creado enviada a {admin_count} administradores")
            return admin_count > 0
            
        except Exception as e:
            logger.error(f"💥 Error notificando creación de usuario: {e}")
            return False
    
    async def notify_user_deleted(self, user_id: int, user_email: str, deleted_by_id: int) -> bool:
        """
        Notifica eliminación de usuario
        """
        if not self.websocket_service:
            return False
        
        try:
            # Notificar a administradores
            admin_count = await self.websocket_service.notify_user_deleted(user_id)
            
            # Notificar al que eliminó
            await self.websocket_service.send_notification(
                user_id=deleted_by_id,
                title="Usuario Eliminado",
                message=f"Usuario {user_email} eliminado exitosamente",
                type="success"
            )
            
            logger.info(f"📨 Notificación de usuario eliminado enviada a {admin_count} administradores")
            return admin_count > 0
            
        except Exception as e:
            logger.error(f"💥 Error notificando eliminación de usuario: {e}")
            return False
    
    async def notify_role_updated(self, role_data: Dict[str, Any], updated_by_id: int) -> bool:
        """
        Notifica actualización de rol
        """
        if not self.websocket_service:
            return False
        
        try:
            # Notificar a todos los usuarios (puede afectar permisos)
            user_count = await self.websocket_service.notify_role_updated(role_data)
            
            # Notificar al actualizador
            await self.websocket_service.send_notification(
                user_id=updated_by_id,
                title="Rol Actualizado",
                message=f"Rol {role_data.get('name')} actualizado exitosamente",
                type="success"
            )
            
            logger.info(f"📨 Notificación de rol actualizado enviada a {user_count} conexiones")
            return user_count > 0
            
        except Exception as e:
            logger.error(f"💥 Error notificando actualización de rol: {e}")
            return False
    
    async def notify_area_updated(self, area_data: Dict[str, Any], updated_by_id: int) -> bool:
        """
        Notifica actualización de área
        """
        if not self.websocket_service:
            return False
        
        try:
            # Notificar a todos los usuarios
            user_count = await self.websocket_service.notify_area_updated(area_data)
            
            # Notificar al actualizador
            await self.websocket_service.send_notification(
                user_id=updated_by_id,
                title="Área Actualizada",
                message=f"Área {area_data.get('name')} actualizada exitosamente",
                type="success"
            )
            
            logger.info(f"📨 Notificación de área actualizada enviada a {user_count} conexiones")
            return user_count > 0
            
        except Exception as e:
            logger.error(f"💥 Error notificando actualización de área: {e}")
            return False
    
    async def notify_system_maintenance(self, message: str, minutes_until: int = 5) -> bool:
        """
        Notifica mantenimiento del sistema
        """
        if not self.websocket_service:
            return False
        
        try:
            sent_count = await self.websocket_service.send_maintenance_notification(message, minutes_until)
            logger.warning(f"🔧 Notificación de mantenimiento enviada a {sent_count} conexiones")
            return sent_count > 0
            
        except Exception as e:
            logger.error(f"💥 Error notificando mantenimiento: {e}")
            return False
    
    def is_available(self) -> bool:
        """
        Verifica si el servicio de notificaciones está disponible
        """
        return self.websocket_service is not None

# ===== INSTANCIA GLOBAL =====
websocket_notification_service = WebSocketNotificationService()

# ===== DECORADOR PARA INTEGRACIÓN AUTOMÁTICA =====

def notify_websocket_on_crud(entity_type: str, operation: str):
    """
    Decorador para notificar automáticamente cambios CRUD via WebSocket
    🔧 VERSIÓN CORREGIDA - Maneja tanto funciones síncronas como asíncronas
    """
    def decorator(func):
        # Verificar si la función es asíncrona
        if asyncio.iscoroutinefunction(func):
            # Para funciones async
            async def async_wrapper(*args, **kwargs):
                # Ejecutar la función original
                result = await func(*args, **kwargs)
                
                # Intentar notificar via WebSocket (en background)
                asyncio.create_task(
                    _send_websocket_notification(entity_type, operation, result, args, kwargs)
                )
                
                return result
            return async_wrapper
        else:
            # Para funciones síncronas
            def sync_wrapper(*args, **kwargs):
                # Ejecutar la función original
                result = func(*args, **kwargs)
                
                # Intentar notificar via WebSocket (en background)
                try:
                    loop = asyncio.get_event_loop()
                    loop.create_task(
                        _send_websocket_notification(entity_type, operation, result, args, kwargs)
                    )
                except RuntimeError:
                    # Si no hay loop activo, ignorar la notificación
                    logger.debug(f"No se pudo enviar notificación WebSocket para {entity_type}_{operation} (no hay event loop)")
                
                return result
            return sync_wrapper
    
    return decorator

async def _send_websocket_notification(entity_type: str, operation: str, result, args, kwargs):
    """
    Función auxiliar para enviar notificaciones WebSocket
    """
    try:
        if not websocket_notification_service.is_available():
            return
            
        # Extraer datos relevantes del resultado
        entity_data = result if isinstance(result, dict) else getattr(result, '__dict__', {})
        
        # Extraer ID del usuario que realizó la operación
        current_user_id = None
        for arg in args:
            if hasattr(arg, 'id') and hasattr(arg, 'email'):  # Es un User
                current_user_id = arg.id
                break
        
        # Llamar al método de notificación apropiado
        notification_method = f"notify_{entity_type}_{operation}d"
        if hasattr(websocket_notification_service, notification_method):
            method = getattr(websocket_notification_service, notification_method)
            
            if operation == 'delete':
                # Para eliminaciones, pasar información especial
                entity_id = entity_data.get('id')
                entity_name = entity_data.get('name') or entity_data.get('email') or str(entity_id)
                await method(entity_id, entity_name, current_user_id)
            else:
                # Para creaciones y actualizaciones
                await method(entity_data, current_user_id)
                
    except Exception as e:
        logger.warning(f"⚠️ Error en notificación WebSocket para {entity_type}_{operation}: {e}")
        # No fallar la operación principal por error de notificación

# ===== INTEGRACIÓN CON CONTROLADORES EXISTENTES =====

class WebSocketControllerIntegration:
    """
    Clase para integrar WebSocket con controladores existentes
    """
    
    @staticmethod
    async def integrate_user_controller():
        """
        Integra WebSocket con UserController
        """
        try:
            from app.controllers.users.user_controller import UserController
            
            # Decorar métodos del UserController
            if hasattr(UserController, 'create_new_user'):
                UserController.create_new_user = notify_websocket_on_crud('user', 'create')(UserController.create_new_user)
            
            if hasattr(UserController, 'update_user'):
                UserController.update_user = notify_websocket_on_crud('user', 'update')(UserController.update_user)
            
            if hasattr(UserController, 'delete_user'):
                UserController.delete_user = notify_websocket_on_crud('user', 'delete')(UserController.delete_user)
            
            logger.info("✅ UserController integrado con WebSocket")
            
        except ImportError:
            logger.warning("⚠️ UserController no disponible para integración WebSocket")
        except Exception as e:
            logger.error(f"💥 Error integrando UserController con WebSocket: {e}")
    
    @staticmethod
    async def integrate_role_controller():
        """
        Integra WebSocket con RoleController
        """
        try:
            from app.controllers.security.role_controller import RoleController
            
            # Decorar métodos del RoleController
            if hasattr(RoleController, 'create_new_role'):
                RoleController.create_new_role = notify_websocket_on_crud('role', 'create')(RoleController.create_new_role)
            
            if hasattr(RoleController, 'update_role'):
                RoleController.update_role = notify_websocket_on_crud('role', 'update')(RoleController.update_role)
            
            if hasattr(RoleController, 'delete_role'):
                RoleController.delete_role = notify_websocket_on_crud('role', 'delete')(RoleController.delete_role)
            
            logger.info("✅ RoleController integrado con WebSocket")
            
        except ImportError:
            logger.warning("⚠️ RoleController no disponible para integración WebSocket")
        except Exception as e:
            logger.error(f"💥 Error integrando RoleController con WebSocket: {e}")
    
    @staticmethod
    async def integrate_area_controller():
        """
        Integra WebSocket con AreaController
        """
        try:
            from app.controllers.organization.area_controller import AreaController
            
            # Decorar métodos del AreaController
            if hasattr(AreaController, 'create_new_area'):
                AreaController.create_new_area = notify_websocket_on_crud('area', 'create')(AreaController.create_new_area)
            
            if hasattr(AreaController, 'update_area'):
                AreaController.update_area = notify_websocket_on_crud('area', 'update')(AreaController.update_area)
            
            if hasattr(AreaController, 'delete_area'):
                AreaController.delete_area = notify_websocket_on_crud('area', 'delete')(AreaController.delete_area)
            
            logger.info("✅ AreaController integrado con WebSocket")
            
        except ImportError:
            logger.warning("⚠️ AreaController no disponible para integración WebSocket")
        except Exception as e:
            logger.error(f"💥 Error integrando AreaController con WebSocket: {e}")
    
    @staticmethod
    async def integrate_all_controllers():
        """
        Integra todos los controladores disponibles con WebSocket
        """
        logger.info("🔗 Iniciando integración de controladores con WebSocket...")
        
        await WebSocketControllerIntegration.integrate_user_controller()
        await WebSocketControllerIntegration.integrate_role_controller()
        await WebSocketControllerIntegration.integrate_area_controller()
        
        logger.info("✅ Integración de controladores con WebSocket completada")

# ===== FUNCIÓN DE INICIALIZACIÓN =====

async def initialize_websocket_notifications():
    """
    Inicializa el sistema de notificaciones WebSocket
    """
    try:
        logger.info("🔔 Inicializando sistema de notificaciones WebSocket...")
        
        # Verificar disponibilidad del servicio
        if not websocket_notification_service.is_available():
            logger.warning("⚠️ Servicio WebSocket no disponible - notificaciones deshabilitadas")
            return False
        
        # Integrar con controladores existentes
        await WebSocketControllerIntegration.integrate_all_controllers()
        
        logger.info("✅ Sistema de notificaciones WebSocket inicializado")
        return True
        
    except Exception as e:
        logger.error(f"💥 Error inicializando notificaciones WebSocket: {e}")
        return False

# ===== UTILIDADES PARA TESTING =====

class WebSocketNotificationTester:
    """
    Utilidades para probar notificaciones WebSocket
    """
    
    @staticmethod
    async def test_user_notification(user_id: int):
        """
        Envía notificación de prueba a un usuario
        """
        try:
            success = await websocket_notification_service.websocket_service.send_notification(
                user_id=user_id,
                title="Prueba de Notificación",
                message="Esta es una notificación de prueba del sistema WebSocket",
                type="test"
            )
            
            return {
                "success": success,
                "message": "Notificación de prueba enviada" if success else "Error enviando notificación"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    async def test_broadcast_notification():
        """
        Envía notificación broadcast de prueba
        """
        try:
            sent_count = await websocket_notification_service.websocket_service.broadcast_system_notification(
                title="Prueba de Broadcast",
                message="Esta es una notificación broadcast de prueba",
                type="test"
            )
            
            return {
                "success": sent_count > 0,
                "sent_count": sent_count,
                "message": f"Broadcast enviado a {sent_count} conexiones"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

# ===== EXPORTAR FUNCIONES PRINCIPALES =====

__all__ = [
    'websocket_notification_service',
    'notify_websocket_on_crud',
    'WebSocketControllerIntegration',
    'initialize_websocket_notifications',
    'WebSocketNotificationTester'
]

