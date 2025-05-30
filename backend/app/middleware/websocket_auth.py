# backend/app/middleware/websocket_auth.py - VERSIÓN CORREGIDA
"""
🔐 MIDDLEWARE DE AUTENTICACIÓN WEBSOCKET - CORREGIDO
"""

from fastapi import WebSocket
from typing import Optional, Dict, Any
import logging
import re

logger = logging.getLogger(__name__)

class WebSocketAuthMiddleware:
    """
    Middleware de autenticación para WebSocket - VERSIÓN FINAL
    """
    
    @staticmethod
    async def get_current_user_websocket(websocket: WebSocket) -> Optional[Dict[str, Any]]:
        """
        Obtiene el usuario actual desde WebSocket leyendo cookies HttpOnly
        """
        try:
            logger.info("🔐 === INICIANDO AUTENTICACIÓN WEBSOCKET ===")
            
            # 1. EXTRAER COOKIES DE LOS HEADERS
            cookies_str = WebSocketAuthMiddleware._extract_cookies_from_headers(websocket)
            
            if not cookies_str:
                logger.warning("❌ No se encontraron cookies en WebSocket")
                return None
            
            # 2. EXTRAER access_token DE LAS COOKIES
            access_token = WebSocketAuthMiddleware._extract_access_token(cookies_str)
            
            if not access_token:
                logger.warning("❌ No se encontró access_token en las cookies")
                return None
            
            # 3. VALIDAR TOKEN
            user_data = await WebSocketAuthMiddleware._validate_token(access_token)
            
            if user_data:
                logger.info(f"✅ Usuario autenticado en WebSocket: {user_data['email']}")
            
            return user_data
            
        except Exception as e:
            logger.error(f"💥 Error en autenticación WebSocket: {e}")
            return None
    
    @staticmethod
    def _extract_cookies_from_headers(websocket: WebSocket) -> Optional[str]:
        """Extrae las cookies de los headers de WebSocket"""
        try:
            # Método 1: Acceso directo
            for header_name, header_value in websocket.headers.items():
                if header_name.lower() == 'cookie':
                    logger.debug(f"🍪 Cookies encontradas: {len(header_value)} caracteres")
                    return header_value
            
            # Método 2: Búsqueda en headers como dict
            headers_dict = dict(websocket.headers)
            cookie_variations = ['cookie', 'cookies', 'Cookie', 'Cookies']
            
            for variation in cookie_variations:
                if variation in headers_dict:
                    return headers_dict[variation]
            
            logger.warning("🚨 No se encontró header de cookies en WebSocket")
            return None
            
        except Exception as e:
            logger.error(f"💥 Error extrayendo cookies: {e}")
            return None
    
    @staticmethod
    def _extract_access_token(cookies_str: str) -> Optional[str]:
        """Extrae access_token de la cadena de cookies"""
        try:
            # Método 1: Split manual
            for cookie in cookies_str.split(';'):
                cookie = cookie.strip()
                if cookie.startswith('access_token='):
                    token = cookie.split('=', 1)[1]
                    logger.debug(f"🔑 access_token encontrado (método 1): {token[:20]}...")
                    return token
            
            # Método 2: Regex
            match = re.search(r'access_token=([^;]+)', cookies_str)
            if match:
                token = match.group(1)
                logger.debug(f"🔑 access_token encontrado (método 2): {token[:20]}...")
                return token
            
            # Método 3: Parsing completo
            cookies_dict = {}
            for cookie in cookies_str.split(';'):
                if '=' in cookie:
                    name, value = cookie.strip().split('=', 1)
                    cookies_dict[name] = value
            
            if 'access_token' in cookies_dict:
                token = cookies_dict['access_token']
                logger.debug(f"🔑 access_token encontrado (método 3): {token[:20]}...")
                return token
            
            logger.warning("❌ access_token no encontrado en cookies")
            logger.debug(f"🍪 Cookies disponibles: {list(cookies_dict.keys()) if 'cookies_dict' in locals() else 'N/A'}")
            return None
            
        except Exception as e:
            logger.error(f"💥 Error extrayendo access_token: {e}")
            return None
    
    @staticmethod
    async def _validate_token(access_token: str) -> Optional[Dict[str, Any]]:
        """Valida el token y obtiene datos del usuario"""
        try:
            from app.services.auth.auth_service import AuthService
            from app.database import get_db
            from app.repositories.users.user_repository import UserRepository
            
            # Verificar token
            token_data = AuthService.verify_token(access_token)
            logger.debug(f"🔐 Token verificado para user_id: {token_data.sub}")
            
            # Obtener usuario
            db = next(get_db())
            try:
                user = UserRepository.get_with_roles(db, int(token_data.sub))
                
                if not user:
                    logger.warning(f"🚨 Usuario no encontrado: {token_data.sub}")
                    return None
                
                if not user.is_active:
                    logger.warning(f"🚨 Usuario inactivo: {user.email}")
                    return None
                
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
            logger.error(f"💥 Error validando token: {e}")
            return None

# Función helper para el endpoint
async def authenticate_websocket(websocket: WebSocket) -> Optional[Dict[str, Any]]:
    """
    Función helper para autenticar WebSocket connections
    """
    return await WebSocketAuthMiddleware.get_current_user_websocket(websocket)