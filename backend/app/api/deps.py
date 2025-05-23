from typing import Generator, Optional, List, Callable
from fastapi import Depends, HTTPException, status, Security, Request
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import logging
from datetime import datetime, timedelta

from app.database import get_db
from app.models.auth.users import User
from app.services.auth_service import AuthService
from app.utils.error_handler import ErrorHandler
from app.utils.token_blacklist import token_blacklist

logger = logging.getLogger(__name__)

# Rate limiting cache (en producción usar Redis)
_rate_limit_cache = {}

class CookieOrBearerToken(HTTPBearer):
    """
    Esquema de autenticación que acepta tokens desde cookies httpOnly o headers Authorization
    """
    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)

    async def __call__(self, request: Request) -> Optional[str]:
        # 1. Primero intentar obtener desde cookie httpOnly (más seguro)
        token = request.cookies.get("access_token")
        
        if token:
            logger.debug("Token obtenido desde cookie httpOnly")
            return token
            
        # 2. Si no hay cookie, intentar desde header Authorization (compatibilidad)
        authorization = request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            logger.debug("Token obtenido desde Authorization header")
            return authorization.split(" ")[1]
            
        # 3. Si no hay token en ningún lado
        if self.auto_error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No authentication token found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return None

# Usar el nuevo esquema híbrido
cookie_or_bearer_scheme = CookieOrBearerToken()

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(cookie_or_bearer_scheme)
) -> User:
    """
    Valida el token desde cookie o header Authorization con validaciones de seguridad
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
        
        from app.repositories.user_repository import UserRepository
        user = UserRepository.get_with_roles(db, int(token_data.sub))
        
        if not user:
            logger.warning(f"Token válido pero usuario no encontrado: {token_data.sub}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        if not user.is_active:
            logger.warning(f"Token válido pero usuario inactivo: {user.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Cuenta de usuario inactiva",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en get_current_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Error al validar credenciales",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Valida que el usuario actual esté activo (validación redundante para mayor seguridad)
    """
    if not current_user.is_active:
        logger.warning(f"Usuario inactivo intentó acceder: {current_user.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )
    return current_user

def get_current_active_superuser(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Valida que el usuario actual sea superusuario con logs de auditoría
    """
    # Verificar si el usuario tiene el rol de superusuario
    is_superuser = any(role.name == "ADMIN" for role in current_user.roles)
    
    if not is_superuser:
        logger.warning(f"Intento de acceso de administrador por usuario no autorizado: {current_user.email}")
        raise ErrorHandler.handle_permission_error()
    
    logger.info(f"Acceso de administrador autorizado: {current_user.email}")
    return current_user

def has_permission(required_permission: str) -> Callable:
    """
    Verifica si el usuario tiene un permiso específico con logging mejorado
    """
    def _has_permission(current_user: User = Security(get_current_active_user)) -> User:
        # Obtener todos los permisos del usuario a través de sus roles
        user_permissions = []
        for role in current_user.roles:
            for permission in role.permissions:
                user_permissions.append(permission.name)
        
        # Verificar si el usuario tiene el permiso requerido o es ADMIN
        is_admin = any(role.name == "ADMIN" for role in current_user.roles)
        
        if required_permission not in user_permissions and not is_admin:
            logger.warning(
                f"Acceso denegado - Usuario: {current_user.email}, "
                f"Permiso requerido: {required_permission}, "
                f"Permisos disponibles: {user_permissions}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permiso requerido: {required_permission}"
            )
        
        logger.debug(f"Permiso '{required_permission}' verificado para usuario: {current_user.email}")
        return current_user
    
    return _has_permission

def has_any_permission(permissions: List[str]) -> Callable:
    """
    Verifica si el usuario tiene al menos uno de los permisos especificados
    """
    def _has_any_permission(current_user: User = Security(get_current_active_user)) -> User:
        # Obtener todos los permisos del usuario a través de sus roles
        user_permissions = []
        for role in current_user.roles:
            for permission in role.permissions:
                user_permissions.append(permission.name)
        
        # Verificar si el usuario tiene al menos uno de los permisos requeridos o es ADMIN
        is_admin = any(role.name == "ADMIN" for role in current_user.roles)
        
        if not any(perm in user_permissions for perm in permissions) and not is_admin:
            logger.warning(
                f"Acceso denegado - Usuario: {current_user.email}, "
                f"Permisos requeridos (uno de): {permissions}, "
                f"Permisos disponibles: {user_permissions}"
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
        # Obtener todos los permisos del usuario a través de sus roles
        user_permissions = []
        for role in current_user.roles:
            for permission in role.permissions:
                user_permissions.append(permission.name)
        
        # Verificar si el usuario tiene todos los permisos requeridos o es ADMIN
        is_admin = any(role.name == "ADMIN" for role in current_user.roles)
        
        if not all(perm in user_permissions for perm in permissions) and not is_admin:
            logger.warning(
                f"Acceso denegado - Usuario: {current_user.email}, "
                f"Permisos requeridos (todos): {permissions}, "
                f"Permisos disponibles: {user_permissions}"
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
            logger.debug(f"Acceso autorizado - propio usuario: {current_user.email}")
            return current_user
        
        # Si no es el propio usuario, verificar permiso
        user_permissions = []
        for role in current_user.roles:
            for permission in role.permissions:
                user_permissions.append(permission.name)
        
        # Verificar si el usuario tiene el permiso requerido o es ADMIN
        is_admin = any(role.name == "ADMIN" for role in current_user.roles)
        
        if required_permission not in user_permissions and not is_admin:
            logger.warning(
                f"Acceso denegado - Usuario: {current_user.email} "
                f"intentó modificar usuario {user_id}, "
                f"Permiso requerido: {required_permission}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permiso requerido para modificar otros usuarios: {required_permission}"
            )
        
        logger.debug(f"Acceso autorizado por permiso '{required_permission}': {current_user.email}")
        return current_user
    
    return _is_self_or_has_permission

def rate_limit(
    max_requests: int = 60,
    window_seconds: int = 60,
    identifier_func: Callable = None
) -> Callable:
    """
    Rate limiting decorator para endpoints críticos
    """
    def _rate_limit(request: Request):
        # Determinar identificador único (IP, usuario, etc.)
        if identifier_func:
            identifier = identifier_func(request)
        else:
            # Usar IP como identificador por defecto
            identifier = request.client.host if request.client else "unknown"
        
        current_time = datetime.utcnow()
        window_start = current_time - timedelta(seconds=window_seconds)
        
        # Limpiar entradas antiguas
        if identifier in _rate_limit_cache:
            _rate_limit_cache[identifier] = [
                timestamp for timestamp in _rate_limit_cache[identifier]
                if timestamp > window_start
            ]
        else:
            _rate_limit_cache[identifier] = []
        
        # Verificar límite
        if len(_rate_limit_cache[identifier]) >= max_requests:
            logger.warning(f"Rate limit excedido para: {identifier}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Demasiadas solicitudes. Inténtalo más tarde.",
                headers={"Retry-After": str(window_seconds)}
            )
        
        # Registrar solicitud actual
        _rate_limit_cache[identifier].append(current_time)
        
        return True
    
    return _rate_limit

def require_fresh_token(max_age_minutes: int = 30) -> Callable:
    """
    Requiere que el token sea "fresco" (emitido recientemente)
    Útil para operaciones críticas como cambio de contraseña
    """
    def _require_fresh_token(
        current_user: User = Depends(get_current_active_user),
        token: str = Depends(oauth2_scheme)
    ) -> User:
        try:
            # Verificar token y obtener tiempo de emisión
            token_data = AuthService.verify_token(token)
            issued_at = datetime.fromtimestamp(token_data.iat)
            
            # Verificar que el token sea suficientemente fresco
            max_age = timedelta(minutes=max_age_minutes)
            if datetime.utcnow() - issued_at > max_age:
                logger.warning(f"Token no es suficientemente fresco para usuario: {current_user.email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Se requiere autenticación reciente para esta operación",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            return current_user
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error al verificar frescura del token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Error al validar autenticación reciente"
            )
    
    return _require_fresh_token

def get_optional_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> Optional[User]:
    """
    Obtiene el usuario actual si está autenticado, sino retorna None
    Útil para endpoints que funcionan tanto con usuarios autenticados como anónimos
    """
    if not token:
        return None
    
    try:
        return get_current_user(db, token)
    except HTTPException:
        return None
    except Exception as e:
        logger.debug(f"Error al obtener usuario opcional: {e}")
        return None

# Decoradores adicionales para casos específicos
def admin_required(current_user: User = Depends(get_current_active_superuser)) -> User:
    """Shortcut para requerir permisos de administrador"""
    return current_user

def login_required(current_user: User = Depends(get_current_active_user)) -> User:
    """Shortcut para requerir autenticación básica"""
    return current_user

def fresh_login_required(current_user: User = Depends(require_fresh_token(15))) -> User:
    """Shortcut para requerir autenticación fresca (15 minutos)"""
    return current_user