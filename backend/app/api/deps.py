# backend/app/api/deps.py
"""
🔄 DEPENDENCIAS REFACTORIZADAS
Limpieza completa, eliminación de código muerto, organización mejorada
"""

from typing import Optional, List, Callable, Dict, Any
from fastapi import Depends, HTTPException, status, Security, Request, WebSocket, Cookie
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import Optional
import logging
from datetime import datetime, timedelta

from app.database import get_db
from app.models.auth.users import User
from app.services.auth.auth_service import AuthService
from app.utils.error_handler import ErrorHandler
from app.utils.redis_rate_limiter import redis_rate_limiter
from app.utils.redis_token_blacklist import redis_token_blacklist

logger = logging.getLogger(__name__)

# ===== ESQUEMAS DE AUTENTICACIÓN =====

class CookieOrBearerToken(HTTPBearer):
    """
    Esquema de autenticación híbrido: cookies httpOnly + Authorization headers
    """
    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)

    async def __call__(self, request: Request) -> Optional[str]:
        # 1. Prioridad: cookie httpOnly (más seguro)
        token = request.cookies.get("access_token")
        if token:
            logger.debug("🍪 Token obtenido desde cookie httpOnly")
            return token
            
        # 2. Fallback: header Authorization (compatibilidad)
        authorization = request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            logger.debug("🔑 Token obtenido desde Authorization header")
            return authorization.split(" ")[1]
            
        # 3. Sin token disponible
        if self.auto_error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No authentication token found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return None

# Instancia global del esquema de autenticación
cookie_or_bearer_scheme = CookieOrBearerToken()

# ===== DEPENDENCIAS DE AUTENTICACIÓN =====

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(cookie_or_bearer_scheme)
) -> User:
    """
    Valida token y obtiene usuario actual con verificaciones de seguridad robustas
    """
    try:
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No authentication token provided",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verificar token usando el servicio de autenticación
        token_data = AuthService.verify_token(token)
        
        # Obtener usuario con roles cargados
        from app.repositories.users.user_repository import UserRepository
        user = UserRepository.get_with_roles(db, int(token_data.sub))
        
        if not user:
            logger.warning(f"🚨 Token válido pero usuario no encontrado: {token_data.sub}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        if not user.is_active:
            logger.warning(f"🚨 Token válido pero usuario inactivo: {user.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Cuenta de usuario inactiva",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        logger.debug(f"✅ Usuario autenticado: {user.email}")
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"💥 Error inesperado en get_current_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Error al validar credenciales",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Validación redundante de usuario activo (seguridad adicional)
    """
    if not current_user.is_active:
        logger.warning(f"🚨 Usuario inactivo intentó acceder: {current_user.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )
    return current_user

def get_current_active_superuser(current_user: User = Depends(get_current_active_user)) -> User:
    """
    Valida que el usuario sea administrador con auditoría
    """
    is_superuser = any(role.name == "ADMIN" for role in current_user.roles)
    
    if not is_superuser:
        logger.warning(f"🚨 Intento de acceso admin no autorizado: {current_user.email}")
        raise ErrorHandler.handle_permission_error()
    
    logger.info(f"✅ Acceso admin autorizado: {current_user.email}")
    return current_user

def get_optional_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(cookie_or_bearer_scheme)
) -> Optional[User]:
    """
    Obtiene usuario si está autenticado, sino None (para endpoints mixtos)
    """
    if not token:
        return None
    
    try:
        return get_current_user(db, token)
    except HTTPException:
        return None
    except Exception as e:
        logger.debug(f"Usuario opcional no disponible: {e}")
        return None

# ===== DEPENDENCIAS DE PERMISOS =====

def has_permission(required_permission: str) -> Callable:
    """
    Verifica si el usuario tiene un permiso específico
    """
    def _has_permission(current_user: User = Security(get_current_active_user)) -> User:
        # Obtener permisos del usuario
        user_permissions = []
        for role in current_user.roles:
            for permission in role.permissions:
                user_permissions.append(permission.name)
        
        # Los administradores tienen todos los permisos
        is_admin = any(role.name == "ADMIN" for role in current_user.roles)
        
        if required_permission not in user_permissions and not is_admin:
            logger.warning(
                f"🚨 Acceso denegado - Usuario: {current_user.email}, "
                f"Permiso requerido: {required_permission}, "
                f"Permisos disponibles: {user_permissions[:5]}..."  # Solo mostrar primeros 5
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permiso requerido: {required_permission}"
            )
        
        logger.debug(f"✅ Permiso '{required_permission}' verificado para: {current_user.email}")
        return current_user
    
    return _has_permission

def has_any_permission(permissions: List[str]) -> Callable:
    """
    Verifica si el usuario tiene al menos uno de los permisos especificados
    """
    def _has_any_permission(current_user: User = Security(get_current_active_user)) -> User:
        user_permissions = []
        for role in current_user.roles:
            for permission in role.permissions:
                user_permissions.append(permission.name)
        
        is_admin = any(role.name == "ADMIN" for role in current_user.roles)
        
        if not any(perm in user_permissions for perm in permissions) and not is_admin:
            logger.warning(
                f"🚨 Acceso denegado - Usuario: {current_user.email}, "
                f"Permisos requeridos (uno de): {permissions}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requiere uno de estos permisos: {', '.join(permissions)}"
            )
        
        return current_user
    
    return _has_any_permission

def has_all_permissions(permissions: List[str]) -> Callable:
    """
    Verifica si el usuario tiene todos los permisos especificados
    """
    def _has_all_permissions(current_user: User = Security(get_current_active_user)) -> User:
        user_permissions = []
        for role in current_user.roles:
            for permission in role.permissions:
                user_permissions.append(permission.name)
        
        is_admin = any(role.name == "ADMIN" for role in current_user.roles)
        
        if not all(perm in user_permissions for perm in permissions) and not is_admin:
            logger.warning(
                f"🚨 Acceso denegado - Usuario: {current_user.email}, "
                f"Permisos requeridos (todos): {permissions}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requieren todos estos permisos: {', '.join(permissions)}"
            )
        
        return current_user
    
    return _has_all_permissions

def is_self_or_has_permission(user_id_param: str, required_permission: str) -> Callable:
    """
    Permite acceso si es el propio usuario o tiene un permiso específico
    """
    def _is_self_or_has_permission(
        current_user: User = Security(get_current_active_user),
        user_id: int = None
    ) -> User:
        # Verificar si es el propio usuario
        if user_id and current_user.id == user_id:
            logger.debug(f"✅ Acceso autorizado - propio usuario: {current_user.email}")
            return current_user
        
        # Si no es el propio usuario, verificar permiso
        user_permissions = []
        for role in current_user.roles:
            for permission in role.permissions:
                user_permissions.append(permission.name)
        
        is_admin = any(role.name == "ADMIN" for role in current_user.roles)
        
        if required_permission not in user_permissions and not is_admin:
            logger.warning(
                f"🚨 Acceso denegado - Usuario: {current_user.email} "
                f"intentó modificar usuario {user_id}, "
                f"Permiso requerido: {required_permission}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permiso requerido para modificar otros usuarios: {required_permission}"
            )
        
        logger.debug(f"✅ Acceso autorizado por permiso '{required_permission}': {current_user.email}")
        return current_user
    
    return _is_self_or_has_permission

# ===== DEPENDENCIAS DE SEGURIDAD AVANZADA =====

def require_fresh_token(max_age_minutes: int = 30) -> Callable:
    """
    Requiere que el token sea "fresco" (emitido recientemente)
    Útil para operaciones críticas como cambio de contraseña
    """
    def _require_fresh_token(
        current_user: User = Depends(get_current_active_user),
        token: str = Depends(cookie_or_bearer_scheme)
    ) -> User:
        try:
            # Verificar token y obtener tiempo de emisión
            token_data = AuthService.verify_token(token)
            issued_at = datetime.fromtimestamp(token_data.iat)
            
            # Verificar que el token sea suficientemente fresco
            max_age = timedelta(minutes=max_age_minutes)
            if datetime.utcnow() - issued_at > max_age:
                logger.warning(f"🚨 Token no fresco para usuario: {current_user.email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Se requiere autenticación reciente para esta operación",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            return current_user
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error verificando frescura del token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Error al validar autenticación reciente"
            )
    
    return _require_fresh_token

# ===== DEPENDENCIAS DE RATE LIMITING =====

def rate_limit_check(
    max_requests: int = 60,
    window_seconds: int = 60,
    per_user: bool = False,
    endpoint_name: Optional[str] = None
) -> Callable:
    """
    🆕 NUEVA: Dependencia para rate limiting usando Redis
    """
    def _rate_limit_check(request: Request):
        try:
            # Obtener identificador (IP o usuario)
            identifier = redis_rate_limiter.get_identifier(request, use_user_id=per_user)
            
            # Determinar nombre del endpoint
            endpoint = endpoint_name or "unknown"
            
            # Verificar rate limit usando Redis
            limit_info = redis_rate_limiter.check_rate_limit(
                identifier=identifier,
                max_requests=max_requests,
                window_seconds=window_seconds,
                endpoint=endpoint
            )
            
            if not limit_info["allowed"]:
                logger.warning(f"🚦 Rate limit excedido: {identifier} en {endpoint}")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Demasiadas solicitudes. Inténtalo más tarde.",
                    headers={
                        "Retry-After": str(limit_info["retry_after"]),
                        "X-RateLimit-Limit": str(max_requests),
                        "X-RateLimit-Remaining": str(limit_info["remaining"]),
                        "X-RateLimit-Reset": str(limit_info["reset_time"])
                    }
                )
            
            return True
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error en rate limiting: {e}")
            # En caso de error, permitir la request
            return True
    
    return _rate_limit_check

# ===== DEPENDENCIAS DE REDIS =====

def redis_health_check() -> Dict[str, Any]:
    """
    Verifica el estado de salud de Redis
    """
    try:
        redis_available = redis_rate_limiter.redis.is_available()
        
        if redis_available:
            redis_info = redis_rate_limiter.redis.info()
            return {
                "redis_available": True,
                "redis_version": redis_info.get("redis_version", "unknown"),
                "used_memory": redis_info.get("used_memory_human", "unknown"),
                "connected_clients": redis_info.get("connected_clients", 0),
                "total_keys": redis_rate_limiter.redis.dbsize()
            }
        else:
            return {
                "redis_available": False,
                "fallback_mode": True
            }
            
    except Exception as e:
        logger.error(f"💥 Error en health check de Redis: {e}")
        return {
            "redis_available": False,
            "error": str(e)
        }

def require_redis_available():
    """
    Dependencia que requiere que Redis esté disponible
    """
    if not redis_rate_limiter.redis.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Redis no está disponible. Funcionalidad limitada."
        )
    return True

def get_security_stats() -> Dict[str, Any]:
    """
    Obtiene estadísticas completas de seguridad
    """
    try:
        return AuthService.get_security_stats()
    except Exception as e:
        logger.error(f"💥 Error obteniendo estadísticas de seguridad: {e}")
        return {"error": str(e)}

# ===== SHORTCUTS Y ALIASES =====

def admin_required(current_user: User = Depends(get_current_active_superuser)) -> User:
    """Shortcut para requerir permisos de administrador"""
    return current_user

def login_required(current_user: User = Depends(get_current_active_user)) -> User:
    """Shortcut para requerir autenticación básica"""
    return current_user

def fresh_login_required(current_user: User = Depends(require_fresh_token(15))) -> User:
    """Shortcut para requerir autenticación fresca (15 minutos)"""
    return current_user

def redis_required(redis_check: bool = Depends(require_redis_available)) -> bool:
    """Shortcut para requerir Redis disponible"""
    return redis_check

# ===== DECORADORES DE RATE LIMITING SIMPLES =====

def basic_rate_limit(max_requests: int = 60, window_seconds: int = 60):
    """
    🆕 Decorador simple para rate limiting
    """
    def decorator(endpoint_func):
        def wrapper(request: Request, *args, **kwargs):
            # Aplicar rate limiting
            rate_limit_check(max_requests, window_seconds, False, endpoint_func.__name__)(request)
            # Ejecutar endpoint original
            return endpoint_func(request, *args, **kwargs)
        return wrapper
    return decorator

def strict_rate_limit(max_requests: int = 10, window_seconds: int = 60):
    """
    🆕 Rate limiting estricto para endpoints críticos
    """
    def decorator(endpoint_func):
        def wrapper(request: Request, *args, **kwargs):
            # Rate limiting más estricto
            rate_limit_check(max_requests, window_seconds, False, f"strict_{endpoint_func.__name__}")(request)
            return endpoint_func(request, *args, **kwargs)
        return wrapper
    return decorator

# ===== INFORMACIÓN Y DIAGNÓSTICOS =====

def get_dependencies_info() -> Dict[str, Any]:
    """
    🆕 Información sobre las dependencias cargadas
    """
    return {
        "authentication": {
            "scheme": "CookieOrBearerToken",
            "supports_cookies": True,
            "supports_headers": True,
            "security_features": ["httpOnly", "JWT+JWE", "blacklist", "fresh_tokens"]
        },
        "authorization": {
            "permission_checks": ["has_permission", "has_any_permission", "has_all_permissions"],
            "role_based": True,
            "admin_shortcuts": True
        },
        "rate_limiting": {
            "enabled": True,
            "storage": "redis",
            "features": ["sliding_window", "per_user", "per_ip", "auto_cleanup"]
        },
        "redis_integration": {
            "available": redis_rate_limiter.redis.is_available(),
            "features": ["token_blacklist", "rate_limiting", "security_stats"]
        }
    }

# ===== DEPENDENCIAS WEBSOCKET =====

async def get_current_user_websocket(websocket: WebSocket) -> Optional[Dict[str, Any]]:
    """
    Dependencia para obtener el usuario actual en WebSocket
    Reutiliza la lógica de autenticación existente
    """
    try:
        from app.middleware.websocket_auth import WebSocketAuthMiddleware
        return await WebSocketAuthMiddleware.get_current_user_websocket(websocket)
    except ImportError:
        logger.warning("⚠️ WebSocket auth middleware no disponible")
        return None

def websocket_require_permission(permission: str):
    """
    Dependencia que requiere un permiso específico para WebSocket
    """
    async def dependency(websocket: WebSocket) -> Optional[Dict[str, Any]]:
        try:
            from app.middleware.websocket_auth import WebSocketAuthMiddleware
            
            user = await WebSocketAuthMiddleware.get_current_user_websocket(websocket)
            if not user:
                await websocket.close(code=4001, reason="Authentication required")
                return None
            
            has_permission = await WebSocketAuthMiddleware.check_websocket_permission(user, permission)
            if not has_permission:
                await websocket.close(code=4003, reason="Insufficient permissions")
                return None
            
            return user
            
        except ImportError:
            logger.warning("⚠️ WebSocket auth middleware no disponible")
            await websocket.close(code=1011, reason="Service unavailable")
            return None
    
    return dependency

def websocket_admin_required():
    """
    Dependencia que requiere permisos de administrador para WebSocket
    """
    async def dependency(websocket: WebSocket) -> Optional[Dict[str, Any]]:
        try:
            from app.middleware.websocket_auth import WebSocketAuthMiddleware
            
            user = await WebSocketAuthMiddleware.get_current_user_websocket(websocket)
            if not user:
                await websocket.close(code=4001, reason="Authentication required")
                return None
            
            if not user.get("is_admin"):
                await websocket.close(code=4003, reason="Admin privileges required")
                return None
            
            return user
            
        except ImportError:
            logger.warning("⚠️ WebSocket auth middleware no disponible")
            await websocket.close(code=1011, reason="Service unavailable")
            return None
    
    return dependency

# ===== LOGGING DE INICIALIZACIÓN =====

logger.info("🔧 Dependencias refactorizadas cargadas exitosamente")
logger.info(f"✅ Redis disponible: {redis_rate_limiter.redis.is_available()}")
logger.info(f"✅ Token blacklist habilitado: {redis_token_blacklist.enabled}")
logger.info(f"✅ Rate limiting habilitado: {redis_rate_limiter.enabled}")