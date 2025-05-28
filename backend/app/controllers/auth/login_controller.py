# backend/app/controllers/auth/password_controller.py
"""
Versión limpia que usa los services especializados
"""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
import logging

from app.database import get_db
from app.api.deps import get_current_user
from app.models.auth.users import User
from app.services.auth import TokenService, SecurityService
from app.services.auth_service import AuthService  # Service original para compatibilidad
from app.schemas.auth.login import (
    LoginRequest, LoginResponse, RefreshTokenResponse, 
    LogoutResponse, LogoutAllResponse, TokenValidationResponse,
    PasswordVerifyRequest, PasswordVerifyResponse
)
from app.config.settings import (
    ACCESS_TOKEN_EXPIRE_MINUTES, COOKIE_SECURE, COOKIE_SAMESITE, 
    COOKIE_DOMAIN, ENVIRONMENT
)

logger = logging.getLogger(__name__)
router = APIRouter()

class LoginController:
    """
    Controlador refactorizado para operaciones de login
    Separado en métodos estáticos para mejor organización
    """
    
    @staticmethod
    def login(
        request: Request,
        response: Response,
        login_data: LoginRequest,
        db: Session
    ) -> LoginResponse:
        """
        Login con cookies httpOnly usando services especializados
        """
        try:
            client_ip = request.client.host if request.client else "unknown"
            logger.info(f"🔐 Intento de login para: {login_data.username} desde IP: {client_ip}")
            
            # 1. Verificar rate limiting usando SecurityService
            rate_limit_info = SecurityService.check_rate_limit(
                request, max_requests=5, window_seconds=300, endpoint="login"
            )
            
            if not rate_limit_info.allowed:
                logger.warning(f"🚦 Rate limit excedido para: {login_data.username}")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Demasiados intentos de login. Inténtalo más tarde.",
                    headers={"Retry-After": str(rate_limit_info.retry_after)}
                )
            
            # 2. Autenticar usuario (usando AuthService existente por compatibilidad)
            user = AuthService.authenticate_user(db, login_data.username, login_data.password)
            
            if not user:
                logger.warning(f"❌ Login fallido para: {login_data.username}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Usuario o contraseña incorrectos",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            if not user.is_active:
                logger.warning(f"⚠️ Intento de login de usuario inactivo: {login_data.username}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Usuario inactivo"
                )
            
            # 3. Actualizar información de login
            AuthService.update_user_login(db, user)
            
            # 4. Crear tokens usando TokenService
            session_data = {
                "session_id": f"session_{user.id}_{int(request.headers.get('x-request-id', '0'))}",
                "ip_address": client_ip,
                "user_agent": request.headers.get("user-agent", "unknown"),
                "login_method": "password"
            }
            
            tokens = TokenService.create_session_tokens(user.id, session_data)
            
            # 5. Configurar cookies httpOnly
            LoginController._set_auth_cookies(response, tokens)
            
            logger.info(f"✅ Login exitoso para: {user.email} desde IP: {client_ip}")
            
            return LoginResponse(
                message="Login successful",
                user_id=user.id,
                expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                environment=ENVIRONMENT
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error inesperado en login: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno en el proceso de autenticación"
            )
    
    @staticmethod
    def refresh_token(
        request: Request,
        response: Response,
        db: Session
    ) -> RefreshTokenResponse:
        """
        Renueva access token usando TokenService
        """
        try:
            # 1. Verificar rate limiting
            rate_limit_info = SecurityService.check_rate_limit(
                request, max_requests=10, window_seconds=60, endpoint="refresh"
            )
            
            if not rate_limit_info.allowed:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Demasiadas solicitudes de refresh",
                    headers={"Retry-After": str(rate_limit_info.retry_after)}
                )
            
            # 2. Obtener refresh token desde cookie
            refresh_token = request.cookies.get("refresh_token")
            if not refresh_token:
                logger.warning("🚫 Intento de refresh sin token en cookie")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="No refresh token found"
                )
            
            # 3. Generar nuevo access token usando TokenService
            new_tokens = TokenService.refresh_access_token(refresh_token, db)
            
            # 4. Actualizar cookie del access token
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
            
            logger.info("✅ Access token renovado exitosamente")
            
            return RefreshTokenResponse(
                message="Token refreshed successfully",
                expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error al renovar access token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Error al renovar token de acceso"
            )
    
    @staticmethod
    def logout(
        request: Request,
        response: Response,
        current_user: User
    ) -> LogoutResponse:
        """
        Logout con limpieza usando TokenService
        """
        try:
            logger.info(f"🚪 Iniciando logout para usuario: {current_user.email}")
            
            # 1. Obtener tokens desde cookies
            access_token = request.cookies.get("access_token")
            refresh_token = request.cookies.get("refresh_token")
            
            # 2. Añadir tokens a blacklist usando TokenService
            tokens_blacklisted = 0
            
            if access_token:
                if TokenService.blacklist_token(access_token, current_user.id, "logout"):
                    tokens_blacklisted += 1
                    logger.info("✅ Access token añadido a blacklist")
            
            if refresh_token:
                if TokenService.blacklist_token(refresh_token, current_user.id, "logout"):
                    tokens_blacklisted += 1
                    logger.info("✅ Refresh token añadido a blacklist")
            
            # 3. Limpiar cookies
            LoginController._clear_auth_cookies(response)
            
            logger.info(f"✅ Logout exitoso para: {current_user.email}, tokens: {tokens_blacklisted}")
            
            return LogoutResponse(
                message="Logout exitoso",
                user=current_user.email,
                tokens_blacklisted=tokens_blacklisted
            )
            
        except Exception as e:
            logger.error(f"💥 Error en logout: {e}")
            # Limpiar cookies incluso si hay error
            LoginController._clear_auth_cookies(response)
            
            return LogoutResponse(
                message="Logout exitoso (con errores)",
                user=current_user.email,
                tokens_blacklisted=0
            )
    
    @staticmethod
    def logout_all(
        response: Response,
        current_user: User
    ) -> LogoutAllResponse:
        """
        Logout global usando TokenService
        """
        try:
            logger.info(f"🚪🌍 Logout global para usuario: {current_user.email}")
            
            # 1. Invalidar todas las sesiones usando TokenService
            success = TokenService.blacklist_user_tokens(current_user.id, "logout_all")
            
            # 2. Limpiar cookies locales
            LoginController._clear_auth_cookies(response)
            
            if success:
                logger.info(f"✅ Todas las sesiones cerradas para: {current_user.email}")
                return LogoutAllResponse(
                    message="Todas las sesiones han sido cerradas exitosamente",
                    user={"id": current_user.id, "email": current_user.email},
                    global_logout=True,
                    cookies_cleared=True
                )
            else:
                logger.warning(f"⚠️ Logout global con advertencias para: {current_user.email}")
                return LogoutAllResponse(
                    message="Sesiones cerradas (con advertencias menores)",
                    user={"id": current_user.id, "email": current_user.email},
                    global_logout=True,
                    cookies_cleared=True
                )
                
        except Exception as e:
            logger.error(f"💥 Error en logout global: {e}")
            # Limpiar cookies locales de todas formas
            LoginController._clear_auth_cookies(response)
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al cerrar todas las sesiones"
            )
    
    @staticmethod
    def validate_token(current_user: User) -> TokenValidationResponse:
        """
        Valida token actual
        """
        return TokenValidationResponse(
            valid=True,
            user_id=current_user.id,
            email=current_user.email,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            environment=ENVIRONMENT
        )
    
    @staticmethod
    def verify_password(
        password_data: PasswordVerifyRequest,
        current_user: User
    ) -> PasswordVerifyResponse:
        """
        Verifica contraseña actual usando SecurityService
        """
        try:
            from app.config.security import verify_password
            
            is_valid = verify_password(password_data.password, current_user.password_hash)
            
            if is_valid:
                logger.info(f"✅ Contraseña verificada para: {current_user.email}")
                return PasswordVerifyResponse(
                    valid=True,
                    message="Contraseña verificada correctamente"
                )
            else:
                logger.warning(f"❌ Contraseña incorrecta para: {current_user.email}")
                return PasswordVerifyResponse(
                    valid=False,
                    message="Contraseña incorrecta"
                )
                
        except Exception as e:
            logger.error(f"💥 Error verificando contraseña: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al verificar contraseña"
            )
    
    # ===== MÉTODOS AUXILIARES =====
    
    @staticmethod
    def _set_auth_cookies(response: Response, tokens: dict) -> None:
        """
        Configura cookies de autenticación
        """
        response.set_cookie(
            key="access_token",
            value=tokens["access_token"],
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            httponly=True,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            domain=COOKIE_DOMAIN,
            path="/"
        )
        
        response.set_cookie(
            key="refresh_token",
            value=tokens["refresh_token"],
            max_age=7 * 24 * 60 * 60,  # 7 días
            httponly=True,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            domain=COOKIE_DOMAIN,
            path="/"
        )
    
    @staticmethod
    def _clear_auth_cookies(response: Response) -> None:
        """
        Limpia cookies de autenticación
        """
        # Limpiar con configuración específica
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
        
        # Limpiar con configuraciones alternativas por compatibilidad
        response.delete_cookie(key="access_token", path="/")
        response.delete_cookie(key="refresh_token", path="/")
        response.delete_cookie(key="access_token")
        response.delete_cookie(key="refresh_token")

# ===== ENDPOINTS USANDO EL CONTROLADOR =====

@router.post("/login", response_model=LoginResponse)
def login_endpoint(
    login_data: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
) -> Any:
    """
    🆕 Login endpoint refactorizado
    """
    return LoginController.login(request, response, login_data, db)

@router.post("/refresh", response_model=RefreshTokenResponse)
def refresh_endpoint(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
) -> Any:
    """
    🆕 Refresh endpoint refactorizado
    """
    return LoginController.refresh_token(request, response, db)

@router.post("/logout", response_model=LogoutResponse)
def logout_endpoint(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    🆕 Logout endpoint refactorizado
    """
    return LoginController.logout(request, response, current_user)

@router.post("/logout-all", response_model=LogoutAllResponse)
def logout_all_endpoint(
    response: Response,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    🆕 Logout global endpoint refactorizado
    """
    return LoginController.logout_all(response, current_user)

@router.post("/validate-token", response_model=TokenValidationResponse)
def validate_token_endpoint(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    🆕 Validación de token endpoint refactorizado
    """
    return LoginController.validate_token(current_user)

@router.post("/verify-password", response_model=PasswordVerifyResponse)
def verify_password_endpoint(
    password_data: PasswordVerifyRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    🆕 Verificación de contraseña endpoint refactorizado
    """
    return LoginController.verify_password(password_data, current_user)