# backend/app/middleware/websocket_auth.py - VERSIÓN CORREGIDA
"""
🔐 MIDDLEWARE DE AUTENTICACIÓN WEBSOCKET - CORREGIDO
"""

from fastapi import WebSocket, HTTPException, status
from typing import Optional, Dict, Any
import logging
from urllib.parse import parse_qs
import json

logger = logging.getLogger(__name__)

class WebSocketAuthMiddleware:
    """
    Middleware de autenticación para WebSocket - VERSIÓN CORREGIDA
    """
    
    @staticmethod
    async def get_current_user_websocket(websocket: WebSocket) -> Optional[Dict[str, Any]]:
        """
        Obtiene el usuario actual desde WebSocket - VERSIÓN CORREGIDA
        """
        try:
            token = None
            
            # Método 1: Token en query parameters (CORREGIDO)
            query_params = dict(websocket.query_params)
            token = query_params.get("token")
            
            # Método 2: Cookie access_token (MEJORADO - extraer de cookies raw)
            if not token:
                cookies_str = websocket.headers.get("cookie", "")
                if cookies_str:
                    cookies = {}
                    for cookie in cookies_str.split(';'):
                        if '=' in cookie:
                            key, value = cookie.strip().split('=', 1)
                            cookies[key] = value
                    token = cookies.get("access_token")
                    
            # Método 3: Headers Authorization  
            if not token:
                auth_header = websocket.headers.get("authorization")
                if auth_header and auth_header.startswith("Bearer "):
                    token = auth_header.split(" ")[1]
            
            if not token:
                logger.warning("🔐 No se encontró token en WebSocket")
                return None
            
            logger.debug(f"🔑 Token encontrado: {token[:20]}...")
            
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
            # Usar el servicio de autenticación existente
            from app.services.auth.auth_service import AuthService
            from app.database import get_db
            from app.repositories.users.user_repository import UserRepository
            
            # Verificar token
            token_data = AuthService.verify_token(token)
            logger.debug(f"🔐 Token verificado para user_id: {token_data.sub}")
            
            # Obtener usuario con roles
            db = next(get_db())
            try:
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
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"💥 Error validando token WebSocket: {e}")
            return None

# Función de ayuda para verificar autenticación WebSocket
async def authenticate_websocket(websocket: WebSocket) -> Optional[Dict[str, Any]]:
    """
    Función helper para autenticar WebSocket connections
    """
    user = await WebSocketAuthMiddleware.get_current_user_websocket(websocket)
    
    if not user:
        logger.warning("🚨 WebSocket: Autenticación fallida")
        await websocket.close(code=4001, reason="Authentication required")
        return None
    
    logger.info(f"✅ WebSocket autenticado: {user['email']}")
    return user