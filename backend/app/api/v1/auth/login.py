# app/api/v1/auth/login.py
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import timedelta
import logging

from app.database import get_db
from app.services.auth_service import AuthService
from app.schemas.auth.token import Token
from app.api.deps import get_current_user
from app.models.auth.users import User
from app.utils.token_blacklist import token_blacklist
from app.config.settings import (
    ACCESS_TOKEN_EXPIRE_MINUTES, 
    COOKIE_SECURE, 
    COOKIE_SAMESITE, 
    COOKIE_DOMAIN,
    ENVIRONMENT,
    REFRESH_TOKEN_EXPIRE_DAYS
)

logger = logging.getLogger(__name__)
router = APIRouter()

# Esquemas mejorados con validación
class PasswordVerify(BaseModel):
    password: str
    
    class Config:
        schema_extra = {
            "example": {
                "password": "mi_contraseña_actual"
            }
        }

class RefreshTokenRequest(BaseModel):
    refresh_token: str
    
    class Config:
        schema_extra = {
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }

class LogoutRequest(BaseModel):
    refresh_token: str = None
    logout_all_devices: bool = False
    
    class Config:
        schema_extra = {
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "logout_all_devices": False
            }
        }

@router.post("/login", response_model=dict)
def login_access_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    Login con cookies httpOnly para máxima seguridad
    Funciona en desarrollo y producción
    """
    try:
        # Verificar rate limit
        from app.utils.simple_rate_limit import check_rate_limit
        check_rate_limit(request, max_requests=5, window_seconds=300, endpoint_name="login")
        
        client_ip = request.client.host if request.client else "unknown"
        logger.info(f"Intento de login para usuario: {form_data.username} desde IP: {client_ip}")
        
        # Autenticar usuario
        user = AuthService.authenticate_user(db, form_data.username, form_data.password)
       
        if not user:
            logger.warning(f"Login fallido para usuario: {form_data.username} desde IP: {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario o contraseña incorrectos",
                headers={"WWW-Authenticate": "Bearer"},
            )
       
        if not user.is_active:
            logger.warning(f"Intento de login de usuario inactivo: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuario inactivo"
            )
       
        # Actualizar último acceso
        AuthService.update_user_login(db, user)
       
        # Generar tokens
        additional_claims = {}
        
        tokens = AuthService.create_tokens(user.id, additional_claims)
       
        # Configurar cookies httpOnly con configuración específica por entorno
        response.set_cookie(
            key="access_token",
            value=tokens["access_token"],
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            httponly=True,              # ← No accesible desde JavaScript
            secure=COOKIE_SECURE,       # ← Solo HTTPS en producción
            samesite=COOKIE_SAMESITE,   # ← Protección CSRF
            domain=COOKIE_DOMAIN,       # ← Configuración de dominio
            path="/"                    # ← Disponible en toda la app
        )
        
        response.set_cookie(
            key="refresh_token", 
            value=tokens["refresh_token"],
            max_age=7 * 24 * 60 * 60,   # 7 días
            httponly=True,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            domain=COOKIE_DOMAIN,
            path="/"
        )
        
        logger.info(f"Login exitoso para usuario: {user.email} desde IP: {client_ip}")
        logger.info(f"Cookies configuradas - Secure: {COOKIE_SECURE}, SameSite: {COOKIE_SAMESITE}")
        
        return {
            "message": "Login successful",
            "user_id": user.id,
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "environment": ENVIRONMENT
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno en el proceso de autenticación"
        )

@router.post("/refresh")
def refresh_access_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
) -> Any:
    """
    Renueva access token usando refresh token desde cookie
    """
    try:
        # Verificar rate limit
        from app.utils.simple_rate_limit import check_rate_limit
        check_rate_limit(request, max_requests=10, window_seconds=60, endpoint_name="refresh")
        
        refresh_token = request.cookies.get("refresh_token")
        if not refresh_token:
            logger.warning("Intento de refresh sin refresh token en cookie")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No refresh token found"
            )
        
        new_tokens = AuthService.refresh_access_token(refresh_token, db)
        
        # Actualizar cookie del access token
        response.set_cookie(
            key="access_token",
            value=new_tokens["access_token"],
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            httponly=True,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            domain=COOKIE_DOMAIN,
            path="/"
        )
        
        logger.info("Access token renovado exitosamente")
        
        return {
            "message": "Token refreshed successfully",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al renovar access token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Error al renovar token de acceso"
        )

@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Logout con limpieza de cookies y blacklist de tokens
    """
    try:
        logger.info(f"Iniciando logout para usuario: {current_user.email}")
        
        # Obtener tokens desde cookies para blacklist
        access_token = request.cookies.get("access_token")
        refresh_token = request.cookies.get("refresh_token")
        
        logger.info(f"Tokens encontrados - Access: {'✓' if access_token else '✗'}, Refresh: {'✓' if refresh_token else '✗'}")
        
        # Añadir tokens a blacklist si existen
        tokens_blacklisted = 0
        if access_token:
            if token_blacklist.add_token(access_token, current_user.id):
                tokens_blacklisted += 1
                logger.info("Access token añadido a blacklist")
            else:
                logger.warning("No se pudo añadir access token a blacklist")
                
        if refresh_token:
            if token_blacklist.add_token(refresh_token, current_user.id):
                tokens_blacklisted += 1
                logger.info("Refresh token añadido a blacklist")
            else:
                logger.warning("No se pudo añadir refresh token a blacklist")
        
        # Limpiar cookies - IMPORTANTE: usar las mismas configuraciones que al establecerlas
        logger.info("Limpiando cookies...")
        
        response.delete_cookie(
            key="access_token", 
            httponly=True, 
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            domain=COOKIE_DOMAIN,
            path="/"
        )
        response.delete_cookie(
            key="refresh_token", 
            httponly=True, 
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            domain=COOKIE_DOMAIN,
            path="/"
        )
        
        # ADICIONAL: Limpiar cookies con diferentes configuraciones por si acaso
        # Esto ayuda cuando hay diferencias en configuración entre entornos
        response.delete_cookie(key="access_token", path="/")
        response.delete_cookie(key="refresh_token", path="/")
        response.delete_cookie(key="access_token")
        response.delete_cookie(key="refresh_token")
        
        logger.info(f"Logout exitoso para usuario: {current_user.email}, tokens en blacklist: {tokens_blacklisted}")
        
        return {
            "message": "Logout exitoso", 
            "user": current_user.email,
            "tokens_blacklisted": tokens_blacklisted
        }
        
    except Exception as e:
        logger.error(f"Error en logout para {current_user.email if current_user else 'usuario desconocido'}: {e}")
        
        # IMPORTANTE: Limpiar cookies incluso si hay error
        try:
            response.delete_cookie("access_token", path="/")
            response.delete_cookie("refresh_token", path="/")
            response.delete_cookie("access_token")
            response.delete_cookie("refresh_token")
            logger.info("Cookies limpiadas después de error")
        except Exception as cookie_error:
            logger.error(f"Error al limpiar cookies: {cookie_error}")
        
        return {"message": "Logout exitoso (con errores)", "error": str(e)}

@router.post("/logout-all")
def logout_all_sessions(
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Cierra todas las sesiones del usuario usando sistema híbrido
    """
    try:
        logger.info(f"🚪🌍 Iniciando logout global para usuario: {current_user.email}")
        
        # Invalidar todas las sesiones usando sistema híbrido
        success = AuthService.logout_all_sessions(current_user.id)
        
        # Limpiar cookies de la sesión actual
        response.delete_cookie("access_token", path="/", domain=COOKIE_DOMAIN)
        response.delete_cookie("refresh_token", path="/", domain=COOKIE_DOMAIN)
        response.delete_cookie("access_token", path="/")
        response.delete_cookie("refresh_token", path="/")
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        
        if success:
            logger.info(f"✅ Todas las sesiones cerradas para usuario: {current_user.email}")
            return {
                "message": "Todas las sesiones han sido cerradas exitosamente",
                "user": {
                    "id": current_user.id,
                    "email": current_user.email
                },
                "global_logout": True,
                "cookies_cleared": True
            }
        else:
            logger.warning(f"⚠️ Logout global con advertencias para usuario: {current_user.email}")
            return {
                "message": "Sesiones cerradas (con advertencias menores)",
                "user": {
                    "id": current_user.id,
                    "email": current_user.email
                },
                "global_logout": True,
                "cookies_cleared": True,
                "warning": "Algunos tokens podrían no haber sido invalidados completamente"
            }
            
    except Exception as e:
        logger.error(f"💥 Error en logout-all para usuario {current_user.id}: {e}")
        
        # Limpiar cookies locales de todas formas
        try:
            response.delete_cookie("access_token", path="/")
            response.delete_cookie("refresh_token", path="/")
            response.delete_cookie("access_token")
            response.delete_cookie("refresh_token")
            logger.info("🧹 Cookies locales limpiadas después de error")
        except:
            pass
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al cerrar todas las sesiones"
        )

@router.get("/me")
def get_current_user_info(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Obtiene información del usuario actual
    """
    try:
        from app.utils.user_transforms import transform_user_with_roles
        return transform_user_with_roles(current_user)
        
    except Exception as e:
        logger.error(f"Error al obtener información del usuario {current_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener información del usuario"
        )


@router.post("/validate-token")
def validate_token(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Valida que el token actual sea válido (desde cookie o header)
    Útil para verificar el estado de autenticación desde el frontend
    """
    return {
        "valid": True,
        "user_id": current_user.id,
        "email": current_user.email,
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "environment": ENVIRONMENT
    }

@router.post("/verify-password")
def verify_current_password(
    password_data: PasswordVerify,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Verifica la contraseña actual del usuario (útil para operaciones sensibles)
    """
    try:
        from app.config.security import verify_password
        
        is_valid = verify_password(password_data.password, current_user.password_hash)
        
        if is_valid:
            logger.info(f"✅ Contraseña verificada correctamente para usuario: {current_user.email}")
            return {
                "valid": True,
                "message": "Contraseña verificada correctamente"
            }
        else:
            logger.warning(f"❌ Contraseña incorrecta para usuario: {current_user.email}")
            return {
                "valid": False,
                "message": "Contraseña incorrecta"
            }
            
    except Exception as e:
        logger.error(f"💥 Error verificando contraseña para usuario {current_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al verificar contraseña"
        )

@router.get("/security/status")
def get_security_status(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Obtiene el estado de seguridad del sistema para el usuario actual
    """
    try:
        # Obtener estadísticas básicas de seguridad
        security_stats = AuthService.get_security_stats()
        
        return {
            "user_id": current_user.id,
            "environment": ENVIRONMENT,
            "security_features": {
                "httponly_cookies": True,
                "secure_cookies": COOKIE_SECURE,
                "token_blacklist": token_blacklist.enabled,
                "rate_limiting": security_stats.get("rate_limiting", {}).get("enabled", False),
                "hybrid_blacklist": True,
                "jwe_encryption": True
            },
            "session_info": {
                "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                "refresh_expires_in": 7 * 24 * 60 * 60,
                "secure_transport": COOKIE_SECURE
            },
            "system_health": {
                "redis_available": security_stats.get("token_blacklist", {}).get("redis_available", False),
                "blacklist_operational": token_blacklist.enabled
            }
        }
        
    except Exception as e:
        logger.error(f"💥 Error obteniendo estado de seguridad: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener estado de seguridad"
        )