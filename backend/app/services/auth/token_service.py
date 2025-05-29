# backend/app/services/auth/token_service.py
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import logging

from app.repositories.auth.auth_repository import AuthRepository
from app.repositories.users.user_repository import UserRepository
from app.config.security import SecureTokenManager
from app.config.settings import (
    ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
)
from app.utils.token_blacklist import token_blacklist
from app.schemas.auth.token import TokenPayload
from app.schemas.security.security import TokenBlacklistInfo

logger = logging.getLogger(__name__)

class TokenService:
    """
    Servicio especializado para gestión de tokens JWT/JWE
    Maneja creación, verificación, refresh y blacklist de tokens
    """
    
    # ===== CREACIÓN DE TOKENS =====
    
    @staticmethod
    def create_user_tokens(user_id: int, additional_claims: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Crea tokens de acceso y refresco para un usuario
        """
        try:
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
            
            # Preparar claims adicionales
            base_claims = {
                "token_created_at": datetime.utcnow().isoformat(),
                "token_version": "2.0"
            }
            
            if additional_claims:
                base_claims.update(additional_claims)
            
            # Crear tokens usando SecureTokenManager
            access_token = SecureTokenManager.create_access_token(
                subject=user_id,
                expires_delta=access_token_expires,
                additional_claims=base_claims
            )
            
            refresh_token = SecureTokenManager.create_refresh_token(
                subject=user_id,
                expires_delta=refresh_token_expires
            )
            
            logger.info(f"✅ Tokens creados para usuario {user_id}")
            
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                "refresh_expires_in": REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
            }
            
        except Exception as e:
            logger.error(f"💥 Error creando tokens para usuario {user_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al generar tokens de autenticación"
            )
    
    @staticmethod
    def create_short_lived_token(user_id: int, purpose: str, expires_minutes: int = 15) -> str:
        """
        Crea un token de corta duración para operaciones específicas
        """
        try:
            expires_delta = timedelta(minutes=expires_minutes)
            
            additional_claims = {
                "purpose": purpose,
                "short_lived": True,
                "created_at": datetime.utcnow().isoformat()
            }
            
            token = SecureTokenManager.create_access_token(
                subject=user_id,
                expires_delta=expires_delta,
                additional_claims=additional_claims
            )
            
            logger.info(f"✅ Token de corta duración creado para usuario {user_id}, propósito: {purpose}")
            return token
            
        except Exception as e:
            logger.error(f"💥 Error creando token de corta duración: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al generar token temporal"
            )
    
    # ===== VERIFICACIÓN DE TOKENS =====
    
    @staticmethod
    def verify_access_token(token: str, db: Session) -> TokenPayload:
        """
        Verifica un token de acceso y retorna sus datos
        """
        try:
            # Verificar que el token no esté en blacklist
            if token_blacklist.is_blacklisted(token):
                logger.warning("🚫 Intento de usar token en blacklist")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token inválido",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Verificar y decodificar token
            payload = SecureTokenManager.verify_token(token, "access")
            
            # Extraer información del payload
            user_id = int(payload.get("sub"))
            token_issued_at = datetime.fromtimestamp(payload.get("iat", 0))
            
            # Verificar que el usuario no haya sido invalidado globalmente
            if token_blacklist.is_user_invalidated(user_id, token_issued_at):
                logger.warning(f"🚫 Token de usuario invalidado globalmente: {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Sesión expirada. Por favor, inicia sesión nuevamente.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Verificar que el usuario existe y está activo
            user = UserRepository.get_by_id(db, user_id)
            if not user or not user.is_active:
                logger.warning(f"🚫 Token para usuario inexistente o inactivo: {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Usuario no autorizado",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Crear TokenPayload para retorno
            token_data = TokenPayload(
                sub=payload.get("sub"),
                exp=payload.get("exp"),
                iat=payload.get("iat"),
                jti=payload.get("jti")
            )
            
            logger.debug(f"✅ Token verificado para usuario {user_id}")
            return token_data
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error verificando token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Error al validar credenciales",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    @staticmethod
    def verify_refresh_token(token: str, db: Session) -> TokenPayload:
        """
        Verifica un token de refresco
        """
        try:
            # Verificar que el token no esté en blacklist
            if token_blacklist.is_blacklisted(token):
                logger.warning("🚫 Intento de usar refresh token en blacklist")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token de refresh inválido"
                )
            
            # Verificar y decodificar token
            payload = SecureTokenManager.verify_token(token, "refresh")
            
            user_id = int(payload.get("sub"))
            token_issued_at = datetime.fromtimestamp(payload.get("iat", 0))
            
            # Verificar invalidación global
            if token_blacklist.is_user_invalidated(user_id, token_issued_at):
                logger.warning(f"🚫 Refresh token de usuario invalidado: {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Sesión expirada. Por favor, inicia sesión nuevamente."
                )
            
            # Verificar usuario
            user = UserRepository.get_by_id(db, user_id)
            if not user or not user.is_active:
                logger.warning(f"🚫 Refresh token para usuario inexistente/inactivo: {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Usuario no autorizado"
                )
            
            token_data = TokenPayload(
                sub=payload.get("sub"),
                exp=payload.get("exp"),
                iat=payload.get("iat"),
                jti=payload.get("jti")
            )
            
            logger.debug(f"✅ Refresh token verificado para usuario {user_id}")
            return token_data
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error verificando refresh token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Error al validar token de refresh"
            )
    
    # ===== REFRESH DE TOKENS =====
    
    @staticmethod
    def refresh_access_token(refresh_token: str, db: Session) -> Dict[str, Any]:
        """
        Genera nuevo access token usando refresh token válido
        """
        try:
            # Verificar refresh token
            token_data = TokenService.verify_refresh_token(refresh_token, db)
            user_id = int(token_data.sub)
            
            # Crear nuevo access token
            additional_claims = {"refresh_used": True}
            new_access_token = SecureTokenManager.create_access_token(
                subject=user_id,
                additional_claims=additional_claims
            )
            
            logger.info(f"✅ Access token renovado para usuario {user_id}")
            
            return {
                "access_token": new_access_token,
                "token_type": "bearer",
                "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error renovando access token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Error al renovar token de acceso"
            )
    
    # ===== BLACKLIST DE TOKENS =====
    
    @staticmethod
    def blacklist_token(token: str, user_id: int = None, reason: str = "logout") -> bool:
        """
        Añade un token a la blacklist
        """
        try:
            success = token_blacklist.add_token(token, user_id)
            
            if success:
                logger.info(f"✅ Token añadido a blacklist - Usuario: {user_id}, Razón: {reason}")
            else:
                logger.warning(f"⚠️ No se pudo añadir token a blacklist - Usuario: {user_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"💥 Error añadiendo token a blacklist: {e}")
            return False
    
    @staticmethod
    def blacklist_user_tokens(user_id: int, reason: str = "logout_all") -> bool:
        """
        Invalida todos los tokens de un usuario
        """
        try:
            success = token_blacklist.blacklist_all_user_tokens(user_id)
            
            if success:
                logger.info(f"✅ Todos los tokens invalidados para usuario {user_id} - Razón: {reason}")
            else:
                logger.warning(f"⚠️ No se pudieron invalidar todos los tokens para usuario {user_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"💥 Error invalidando tokens de usuario {user_id}: {e}")
            return False
    
    @staticmethod
    def check_token_blacklist_status(token: str) -> TokenBlacklistInfo:
        """
        Verifica el estado de blacklist de un token
        """
        try:
            is_blacklisted = token_blacklist.is_blacklisted(token)
            
            return TokenBlacklistInfo(
                is_blacklisted=is_blacklisted,
                blacklist_type="hybrid" if is_blacklisted else None,
                blacklisted_at=datetime.utcnow() if is_blacklisted else None,
                reason="Token in blacklist" if is_blacklisted else None
            )
            
        except Exception as e:
            logger.error(f"💥 Error verificando estado de blacklist: {e}")
            return TokenBlacklistInfo(
                is_blacklisted=True,  # Por seguridad, asumir blacklisted en error
                blacklist_type="error",
                blacklisted_at=datetime.utcnow(),
                reason=f"Error: {str(e)}"
            )
    
    # ===== UTILIDADES DE TOKENS =====
    
    @staticmethod
    def decode_token_payload(token: str, verify: bool = False) -> Optional[Dict[str, Any]]:
        """
        Decodifica payload de un token sin verificar (útil para inspección)
        """
        try:
            if verify:
                # Verificación completa
                payload = SecureTokenManager.verify_token(token, "access")
            else:
                # Solo decodificación sin verificación
                from jose import jwt
                payload = jwt.get_unverified_claims(token)
            
            return payload
            
        except Exception as e:
            logger.error(f"💥 Error decodificando token: {e}")
            return None
    
    @staticmethod
    def extract_token_info(token: str) -> Dict[str, Any]:
        """
        Extrae información útil de un token
        """
        try:
            payload = TokenService.decode_token_payload(token, verify=False)
            
            if not payload:
                return {"error": "No se pudo decodificar token"}
            
            # Convertir timestamps a fechas legibles
            issued_at = None
            expires_at = None
            
            if payload.get("iat"):
                issued_at = datetime.fromtimestamp(payload["iat"]).isoformat()
            
            if payload.get("exp"):
                expires_at = datetime.fromtimestamp(payload["exp"]).isoformat()
            
            return {
                "user_id": payload.get("sub"),
                "token_type": payload.get("type", "unknown"),
                "jti": payload.get("jti"),
                "issued_at": issued_at,
                "expires_at": expires_at,
                "algorithm": payload.get("alg", "unknown"),
                "additional_claims": {
                    k: v for k, v in payload.items() 
                    if k not in ["sub", "type", "jti", "iat", "exp", "alg"]
                }
            }
            
        except Exception as e:
            logger.error(f"💥 Error extrayendo información del token: {e}")
            return {"error": str(e)}
    
    @staticmethod
    def validate_token_freshness(token: str, max_age_minutes: int = 30) -> Tuple[bool, str]:
        """
        Valida que un token sea "fresco" (emitido recientemente)
        """
        try:
            payload = TokenService.decode_token_payload(token, verify=True)
            
            if not payload:
                return False, "Token inválido"
            
            issued_at = payload.get("iat")
            if not issued_at:
                return False, "Token sin timestamp de emisión"
            
            token_age = datetime.utcnow() - datetime.fromtimestamp(issued_at)
            max_age = timedelta(minutes=max_age_minutes)
            
            if token_age > max_age:
                return False, f"Token demasiado antiguo ({token_age.total_seconds()/60:.1f} min)"
            
            return True, f"Token fresco ({token_age.total_seconds()/60:.1f} min)"
            
        except Exception as e:
            logger.error(f"💥 Error validando frescura del token: {e}")
            return False, f"Error: {str(e)}"
    
    # ===== GESTIÓN DE SESIONES =====
    
    @staticmethod
    def create_session_tokens(user_id: int, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Crea tokens con información de sesión
        """
        try:
            session_claims = {
                "session_id": session_data.get("session_id"),
                "client_info": session_data.get("client_info", {}),
                "login_method": session_data.get("login_method", "standard"),
                "ip_address": session_data.get("ip_address"),
                "user_agent": session_data.get("user_agent")
            }
            
            return TokenService.create_user_tokens(user_id, session_claims)
            
        except Exception as e:
            logger.error(f"💥 Error creando tokens de sesión: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear tokens de sesión"
            )
    
    @staticmethod
    def revoke_session_tokens(user_id: int, session_id: str) -> bool:
        """
        Revoca tokens específicos de una sesión
        """
        try:
            # En un sistema más avanzado, aquí buscaríamos tokens específicos de la sesión
            # Por ahora, invalidamos todos los tokens del usuario
            success = TokenService.blacklist_user_tokens(user_id, f"session_revoke:{session_id}")
            
            logger.info(f"✅ Tokens de sesión revocados - Usuario: {user_id}, Sesión: {session_id}")
            return success
            
        except Exception as e:
            logger.error(f"💥 Error revocando tokens de sesión: {e}")
            return False
    
    # ===== ESTADÍSTICAS Y MONITOREO =====
    
    @staticmethod
    def get_token_stats() -> Dict[str, Any]:
        """
        Obtiene estadísticas de tokens y blacklist
        """
        try:
            blacklist_stats = token_blacklist.get_stats()
            
            return {
                "blacklist_stats": blacklist_stats,
                "token_settings": {
                    "access_token_expire_minutes": ACCESS_TOKEN_EXPIRE_MINUTES,
                    "refresh_token_expire_days": REFRESH_TOKEN_EXPIRE_DAYS,
                    "secure_token_manager": True,
                    "hybrid_blacklist": True
                },
                "security_features": {
                    "jwe_support": True,
                    "robust_jti_extraction": True,
                    "global_user_invalidation": True,
                    "session_tracking": True,
                    "token_freshness_validation": True
                }
            }
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo estadísticas de tokens: {e}")
            return {"error": str(e)}
    
    @staticmethod
    def cleanup_expired_tokens() -> Dict[str, int]:
        """
        Limpia tokens expirados del sistema
        """
        try:
            cleaned_count = token_blacklist.cleanup_expired_tokens()
            
            logger.info(f"🧹 Limpieza de tokens completada: {cleaned_count} tokens eliminados")
            
            return {
                "cleaned_tokens": cleaned_count,
                "cleanup_timestamp": int(datetime.utcnow().timestamp())
            }
            
        except Exception as e:
            logger.error(f"💥 Error limpiando tokens expirados: {e}")
            return {"error": str(e), "cleaned_tokens": 0}
    
    # ===== OPERACIONES ADMINISTRATIVAS =====
    
    @staticmethod
    def emergency_revoke_all_tokens(admin_user_id: int, reason: str = "emergency_revoke") -> Dict[str, Any]:
        """
        Revoca todos los tokens del sistema (solo para emergencias)
        """
        try:
            from app.config.settings import ENVIRONMENT
            
            if ENVIRONMENT == "production":
                logger.error("🚨 Intento de revocación global en producción")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Operación no permitida en producción"
                )
            
            # Limpiar toda la blacklist (forzando re-autenticación)
            success = token_blacklist.flush_all_blacklist_data()
            
            if success:
                logger.warning(f"🚨 REVOCACIÓN GLOBAL DE TOKENS por admin {admin_user_id} - Razón: {reason}")
                
                return {
                    "success": True,
                    "message": "Todos los tokens del sistema han sido revocados",
                    "admin_user": admin_user_id,
                    "reason": reason,
                    "timestamp": datetime.utcnow().isoformat(),
                    "warning": "Todos los usuarios necesitarán re-autenticarse"
                }
            else:
                return {
                    "success": False,
                    "message": "No se pudieron revocar todos los tokens",
                    "admin_user": admin_user_id
                }
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"💥 Error en revocación global de tokens: {e}")
            return {
                "success": False,
                "error": str(e),
                "admin_user": admin_user_id
            }