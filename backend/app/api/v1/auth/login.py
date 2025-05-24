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
from app.api.deps import get_current_user, rate_limit, require_fresh_token
from app.models.auth.users import User
from app.utils.token_blacklist import token_blacklist
from app.config.settings import (
    ACCESS_TOKEN_EXPIRE_MINUTES, 
    COOKIE_SECURE, 
    COOKIE_SAMESITE, 
    COOKIE_DOMAIN,
    ENVIRONMENT
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

router = APIRouter()

@router.post("/login", response_model=dict)
def login_access_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
    _rate_limit: bool = Depends(rate_limit(max_requests=5, window_seconds=300))
) -> Any:
    """
    Login con cookies httpOnly para máxima seguridad
    Funciona en desarrollo y producción
    """
    try:
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
    db: Session = Depends(get_db),
    _rate_limit: bool = Depends(rate_limit(max_requests=10, window_seconds=60))
) -> Any:
    """
    Renueva access token usando refresh token desde cookie
    """
    try:
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

@router.get("/me")
def get_current_user_info(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Obtiene información del usuario actual
    """
    try:
        return {
            "id": current_user.id,
            "email": current_user.email,
            "username": current_user.username,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "is_active": current_user.is_active,
            "last_login": current_user.last_login.isoformat() if current_user.last_login else None,
            "roles": [{"id": role.id, "name": role.name} for role in current_user.roles],
            "permissions": list(set([
                permission.name 
                for role in current_user.roles 
                for permission in role.permissions
            ]))
        }
        
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