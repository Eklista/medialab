# backend/app/middleware/websocket_auth.py
"""
🔐 MIDDLEWARE DE AUTENTICACIÓN WEBSOCKET
Manejo de autenticación específica para conexiones WebSocket
"""

from fastapi import WebSocket, HTTPException, status
from typing import Optional, Dict, Any
import logging
from functools import wraps

logger = logging.getLogger(__name__)

# ===== CLASE PRINCIPAL DE AUTENTICACIÓN WEBSOCKET =====

class WebSocketAuthMiddleware:
    """
    Middleware de autenticación para WebSocket - VERSIÓN CORREGIDA
    """
    
    @staticmethod
    async def get_current_user_websocket(websocket: WebSocket) -> Optional[Dict[str, Any]]:
        """
        Obtiene el usuario actual desde WebSocket - VERSIÓN MEJORADA
        """
        try:
            token = None
            
            # Método 1: Token en query parameters
            token = websocket.query_params.get("token")
            
            # Método 2: Token en headers Authorization
            if not token:
                auth_header = websocket.headers.get("authorization")
                if auth_header and auth_header.startswith("Bearer "):
                    token = auth_header.split(" ")[1]
            
            # Método 3: Cookie access_token (MEJORADO)
            if not token:
                cookies = websocket.cookies
                token = cookies.get("access_token")
                logger.debug(f"🍪 Token extraído de cookie: {token[:50] if token else 'None'}...")
            
            if not token:
                logger.warning("🔐 No se encontró token en WebSocket")
                return None
            
            # Validar token usando el sistema existente
            return await WebSocketAuthMiddleware._validate_token(token)
            
        except Exception as e:
            logger.error(f"💥 Error en autenticación WebSocket: {e}")
            return None
    
    @staticmethod
    async def _validate_token(token: str) -> Optional[Dict[str, Any]]:
        """
        Valida un token específico para WebSocket - VERSIÓN CORREGIDA
        """
        try:
            # Usar el servicio de autenticación existente directamente
            from app.services.auth.auth_service import AuthService
            from app.database import get_db
            from app.repositories.users.user_repository import UserRepository
            
            # Verificar token
            token_data = AuthService.verify_token(token)
            logger.debug(f"🔐 Token verificado para user_id: {token_data.sub}")
            
            # Obtener usuario con roles
            db = next(get_db())
            user = UserRepository.get_with_roles(db, int(token_data.sub))
            
            if not user:
                logger.warning(f"🚨 Token válido pero usuario no encontrado: {token_data.sub}")
                return None
            
            if not user.is_active:
                logger.warning(f"🚨 Token válido pero usuario inactivo: {user.email}")
                return None
            
            logger.info(f"🔐 Usuario autenticado en WebSocket: {user.email}")
            
            return {
                "id": user.id,
                "email": user.email,
                "first_name": getattr(user, 'first_name', ''),
                "last_name": getattr(user, 'last_name', ''),
                "is_admin": any(role.name == "ADMIN" for role in user.roles),
                "roles": [role.name for role in user.roles],
                "is_active": user.is_active
            }
                
        except Exception as e:
            logger.error(f"💥 Error validando token WebSocket: {e}")
            return None
    
    @staticmethod
    async def check_websocket_permission(user: Dict[str, Any], permission: str) -> bool:
        """
        Verifica si un usuario tiene un permiso específico
        """
        try:
            # Los admins tienen todos los permisos
            if user.get("is_admin"):
                return True
            
            # Obtener permisos del usuario desde la base de datos
            from app.database import get_db
            from app.models.auth.users import User
            
            db = next(get_db())
            db_user = db.query(User).filter(User.id == user["id"]).first()
            
            if not db_user:
                return False
            
            # Verificar permiso específico
            user_permissions = set()
            for role in db_user.roles:
                for perm in role.permissions:
                    user_permissions.add(perm.name)
            
            return permission in user_permissions
            
        except Exception as e:
            logger.error(f"💥 Error verificando permiso WebSocket: {e}")
            return False
    
    @staticmethod
    async def get_user_rooms(user_id: int) -> list:
        """
        Obtiene las salas a las que un usuario debería unirse automáticamente
        """
        try:
            from app.database import get_db
            from app.models.auth.users import User
            
            db = next(get_db())
            user = db.query(User).filter(User.id == user_id).first()
            
            if not user:
                return []
            
            rooms = [f"user_{user_id}"]  # Sala personal del usuario
            
            # Agregar sala de admin si es administrador
            if any(role.name == "ADMIN" for role in user.roles):
                rooms.append("admin_room")
            
            # Agregar salas por área (si el modelo lo soporta)
            for role in user.roles:
                if hasattr(role, 'area') and role.area:
                    rooms.append(f"area_{role.area.id}")
            
            return rooms
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo salas de usuario {user_id}: {e}")
            return [f"user_{user_id}"]  # Sala mínima
    
    @staticmethod
    async def log_websocket_connection(user_id: int, connection_id: str, action: str):
        """
        Registra conexiones/desconexiones WebSocket para auditoría
        """
        try:
            from datetime import datetime
            
            log_entry = {
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": user_id,
                "connection_id": connection_id,
                "action": action,  # "connect" o "disconnect"
                "service": "websocket"
            }
            
            # Log estándar
            logger.info(f"🔌 WebSocket {action}: User {user_id} - Connection {connection_id}")
            
            # Opcional: Guardar en Redis para estadísticas si está disponible
            try:
                from app.config.redis_config import redis_manager
                if redis_manager.is_available():
                    redis_manager.lpush(
                        "websocket_audit_log",
                        log_entry,
                        expire=7 * 24 * 60 * 60  # 7 días
                    )
            except ImportError:
                pass  # Redis no disponible
            
        except Exception as e:
            logger.error(f"💥 Error registrando conexión WebSocket: {e}")

# ===== DECORADORES PARA WEBSOCKET =====

def require_websocket_auth(func):
    """
    Decorador que requiere autenticación para endpoints WebSocket
    """
    @wraps(func)
    async def wrapper(websocket: WebSocket, *args, **kwargs):
        user = await WebSocketAuthMiddleware.get_current_user_websocket(websocket)
        if not user:
            await websocket.close(code=4001, reason="Authentication required")
            return
        
        return await func(websocket, user, *args, **kwargs)
    
    return wrapper

def require_websocket_permission(permission: str):
    """
    Decorador que requiere un permiso específico para WebSocket
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(websocket: WebSocket, *args, **kwargs):
            user = await WebSocketAuthMiddleware.get_current_user_websocket(websocket)
            if not user:
                await websocket.close(code=4001, reason="Authentication required")
                return
            
            has_permission = await WebSocketAuthMiddleware.check_websocket_permission(user, permission)
            if not has_permission:
                await websocket.close(code=4003, reason="Insufficient permissions")
                return
            
            return await func(websocket, user, *args, **kwargs)
        
        return wrapper
    return decorator

# ===== CONSTANTES DE CÓDIGOS DE CIERRE =====

class WebSocketCloseCodes:
    """
    Códigos de cierre estandarizados para WebSocket
    """
    # Códigos estándar RFC 6455
    NORMAL_CLOSURE = 1000
    GOING_AWAY = 1001
    PROTOCOL_ERROR = 1002
    UNSUPPORTED_DATA = 1003
    NO_STATUS_RCVD = 1005
    ABNORMAL_CLOSURE = 1006
    INVALID_FRAME_PAYLOAD_DATA = 1007
    POLICY_VIOLATION = 1008
    MESSAGE_TOO_BIG = 1009
    MANDATORY_EXTENSION = 1010
    INTERNAL_ERROR = 1011
    SERVICE_RESTART = 1012
    TRY_AGAIN_LATER = 1013
    BAD_GATEWAY = 1014
    TLS_HANDSHAKE = 1015
    
    # Códigos personalizados para la aplicación (4000-4999)
    AUTHENTICATION_REQUIRED = 4001
    AUTHENTICATION_FAILED = 4002
    INSUFFICIENT_PERMISSIONS = 4003
    RATE_LIMITED = 4004
    CONNECTION_LIMIT_EXCEEDED = 4005
    USER_BANNED = 4006
    SESSION_EXPIRED = 4007

# ===== UTILIDADES ADICIONALES =====

class WebSocketUtils:
    """
    Utilidades adicionales para WebSocket
    """
    
    @staticmethod
    def get_client_info(websocket: WebSocket) -> Dict[str, Any]:
        """
        Obtiene información del cliente WebSocket
        """
        return {
            "client_host": websocket.client.host if websocket.client else "unknown",
            "client_port": websocket.client.port if websocket.client else 0,
            "user_agent": websocket.headers.get("user-agent", "unknown"),
            "origin": websocket.headers.get("origin", "unknown"),
            "real_ip": websocket.headers.get("x-real-ip") or websocket.headers.get("x-forwarded-for", "unknown")
        }
    
    @staticmethod
    def is_valid_message_type(message_type: str) -> bool:
        """
        Valida si un tipo de mensaje es válido
        """
        valid_types = {
            "ping", "pong", "subscribe", "unsubscribe", 
            "user_status", "notification", "broadcast",
            "heartbeat", "error", "connected", "disconnected"
        }
        return message_type in valid_types

# ===== EXPORTACIONES =====

__all__ = [
    'WebSocketAuthMiddleware',
    'require_websocket_auth',
    'require_websocket_permission',
    'WebSocketCloseCodes',
    'WebSocketUtils'
]