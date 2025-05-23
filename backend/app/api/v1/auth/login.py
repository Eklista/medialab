# app/api/v1/auth/login.py
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
import logging

from app.database import get_db
from app.services.auth_service import AuthService
from app.schemas.auth.token import Token
from app.api.deps import get_current_user, rate_limit, require_fresh_token
from app.models.auth.users import User
from app.config.settings import ACCESS_TOKEN_EXPIRE_MINUTES

logger = logging.getLogger(__name__)

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

@router.post("/login", response_model=Token)
def login_access_token(
    request: Request,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
    _rate_limit: bool = Depends(rate_limit(max_requests=5, window_seconds=300))
) -> Any:
    """
    Obtiene un token de acceso mediante OAuth2 password flow con protecciones de seguridad
    """
    try:
        # Log del intento de login (sin datos sensibles)
        client_ip = request.client.host if request.client else "unknown"
        logger.info(f"Intento de login para usuario: {form_data.username} desde IP: {client_ip}")
        
        # Autenticar usuario con protecciones anti-brute force
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
       
        # Generar tokens con información adicional para auditoría
        additional_claims = {
            "login_ip": client_ip,
            "login_time": user.last_login.isoformat() if user.last_login else None,
            "user_agent": request.headers.get("user-agent", "")[:100]  # Limitar tamaño
        }
        
        tokens = AuthService.create_tokens(user.id, additional_claims)
       
        logger.info(f"Login exitoso para usuario: {user.email} desde IP: {client_ip}")
        
        return {
            **tokens,
            "user_id": user.id,
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
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
    request: RefreshTokenRequest,
    db: Session = Depends(get_db),
    _rate_limit: bool = Depends(rate_limit(max_requests=10, window_seconds=60))
) -> Any:
    """
    Renueva un access token usando un refresh token válido
    """
    try:
        # Renovar access token
        new_tokens = AuthService.refresh_access_token(request.refresh_token, db)
        
        logger.info("Access token renovado exitosamente")
        
        return new_tokens
        
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
    request: LogoutRequest,
    current_user: User = Depends(get_current_user)
    # ↑ QUITAR la línea problemática del access_token
) -> Any:
    """
    Cierra la sesión del usuario invalidando los tokens
    """
    return {"message": "Logout exitoso", "user": current_user.email}

@router.post("/verify-password")
def verify_password_endpoint(
    password_data: PasswordVerify,
    current_user: User = Depends(require_fresh_token(15)),
    db: Session = Depends(get_db)
) -> Any:
    """
    Verifica si la contraseña del usuario es correcta
    Requiere autenticación reciente para mayor seguridad
    """
    try:
        from app.services.user_service import UserService
        
        is_valid = UserService.verify_password(db, current_user.id, password_data.password)
       
        if not is_valid:
            logger.warning(f"Verificación de contraseña fallida para usuario: {current_user.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contraseña incorrecta"
            )
       
        logger.info(f"Contraseña verificada exitosamente para usuario: {current_user.email}")
        return {"valid": True}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al verificar contraseña para usuario {current_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al verificar contraseña"
        )

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
    Valida que el token actual sea válido
    Útil para verificar el estado de autenticación desde el frontend
    """
    return {
        "valid": True,
        "user_id": current_user.id,
        "email": current_user.email,
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }