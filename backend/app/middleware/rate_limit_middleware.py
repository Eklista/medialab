# backend/app/middleware/rate_limit_middleware.py
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
import time
import logging
from typing import Callable, List
from jose import jwt, JWTError

logger = logging.getLogger(__name__)

class RateLimitMiddleware:
    """
    Middleware global de rate limiting para FastAPI
    🆕 MEJORADO: Rate limiting por usuario autenticado, fallback a IP
    """
    
    def __init__(
        self,
        app,
        calls_limit: int = 30000,
        period: int = 900,
        exclude_paths: List[str] = None,
        prefer_user_based: bool = True
    ):
        self.app = app
        self.calls_limit = calls_limit
        self.period = period
        self.prefer_user_based = prefer_user_based
        self.exclude_paths = exclude_paths or [
            "/docs", "/redoc", "/openapi.json", "/health", "/favicon.ico",
            "/api/v1/docs", "/api/v1/openapi.json",
            "/ws", "/ws/", "/ws/secure", "/ws/test",
            "/ws/status", "/ws/health", "/ws/debug/info",
            "/ws/admin", "/ws/admin/", "/ws/admin/stats",
            "/api/v1/users/online",
            "/api/v1/public"
        ]
        
        rate_type = "usuario (fallback IP)" if prefer_user_based else "IP"
        logger.info(f"🚦 Rate limiting configurado: {calls_limit} requests per {period}s por {rate_type}")
    
    async def __call__(self, scope, receive, send):
        """
        Método requerido para middleware ASGI
        """
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        # Crear request object
        request = Request(scope, receive)
        
        # Verificar si la ruta está excluida
        path = request.url.path
        if any(path.startswith(excluded_path) for excluded_path in self.exclude_paths):
            await self.app(scope, receive, send)
            return
        
        # Aplicar rate limiting
        try:
            # 🆕 NUEVO: Obtener identificador inteligente (usuario o IP)
            identifier = await self._get_smart_identifier(request)
            endpoint = f"global:{request.method}:{path.split('/')[1] if len(path.split('/')) > 1 else 'root'}"
            
            # Verificar rate limit usando Redis si está disponible
            is_allowed = await self._check_rate_limit(identifier, endpoint)
            
            if not is_allowed:
                # Log del rate limit excedido
                logger.warning(f"🚦 Rate limit excedido para {identifier} en {endpoint}")
                
                # Crear respuesta de rate limit excedido
                response = JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": "Límite de solicitudes excedido. Inténtalo más tarde.",
                        "retry_after": 60,
                        "rate_limit_type": "per_user" if identifier.startswith("user:") else "per_ip"
                    },
                    headers={
                        "Retry-After": "60",
                        "X-RateLimit-Limit": str(self.calls_limit),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Type": "user" if identifier.startswith("user:") else "ip"
                    }
                )
                await response(scope, receive, send)
                return
            
        except Exception as e:
            logger.error(f"Error en rate limiting: {e}")
            # En caso de error, permitir la request
            pass
        
        # Continuar con la aplicación
        await self.app(scope, receive, send)
    
    async def _get_smart_identifier(self, request: Request) -> str:
        """
        🆕 NUEVO: Obtiene identificador inteligente (usuario autenticado o IP)
        """
        if not self.prefer_user_based:
            # Usar solo IP si no se prefiere por usuario
            return f"ip:{self._get_client_ip(request)}"
        
        # Intentar obtener usuario del token
        user_id = await self._extract_user_from_token(request)
        
        if user_id:
            return f"user:{user_id}"
        else:
            # Fallback a IP si no hay usuario autenticado
            return f"ip:{self._get_client_ip(request)}"
    
    async def _extract_user_from_token(self, request: Request) -> str:
        """
        🆕 NUEVO: Extrae user_id del token JWT (cookie o header)
        """
        try:
            # 1. Prioridad: cookie httpOnly
            token = request.cookies.get("access_token")
            
            # 2. Fallback: header Authorization
            if not token:
                authorization = request.headers.get("Authorization")
                if authorization and authorization.startswith("Bearer "):
                    token = authorization.split(" ")[1]
            
            if not token:
                return None
            
            # 3. Decodificar token sin verificar (solo para rate limiting)
            # No necesitamos verificar completamente, solo extraer user_id
            
            # Manejar tokens JWE (encriptados)
            jwt_token = token
            if self._is_encrypted_token(token):
                try:
                    # Intentar desencriptar JWE
                    from jose import jwe
                    import hashlib
                    from app.config.settings import SECRET_KEY
                    
                    encryption_key = hashlib.sha256(SECRET_KEY.encode()).digest()
                    decrypted_bytes = jwe.decrypt(token.encode(), encryption_key)
                    jwt_token = decrypted_bytes.decode()
                except Exception:
                    # Si falla desencriptación, usar hash del token como identificador
                    import hashlib
                    token_hash = hashlib.sha256(token.encode()).hexdigest()[:16]
                    return f"encrypted_token_{token_hash}"
            
            # Decodificar JWT sin verificación (más rápido para rate limiting)
            payload = jwt.get_unverified_claims(jwt_token)
            user_id = payload.get("sub")
            
            if user_id:
                logger.debug(f"🔍 Usuario extraído del token: {user_id}")
                return str(user_id)
            
            return None
            
        except Exception as e:
            logger.debug(f"No se pudo extraer usuario del token: {e}")
            return None
    
    def _is_encrypted_token(self, token: str) -> bool:
        """
        🆕 NUEVO: Detecta si un token es JWE encriptado
        """
        try:
            parts = token.split('.')
            # JWE tiene 5 partes vs JWT que tiene 3
            return len(parts) == 5
        except:
            return False
    
    def _get_client_ip(self, request: Request) -> str:
        """
        Obtiene la IP real del cliente considerando proxies
        """
        # Intentar obtener IP real de headers de proxy
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        
        # Fallback a IP directa
        return getattr(request.client, 'host', 'unknown') if request.client else 'unknown'
    
    async def _check_rate_limit(self, identifier: str, endpoint: str) -> bool:
        """
        Verifica el rate limit usando Redis si está disponible
        """
        try:
            from app.utils.redis_rate_limiter import redis_rate_limiter
            
            # Verificar rate limit
            limit_info = redis_rate_limiter.check_rate_limit(
                identifier=identifier,
                max_requests=self.calls_limit,
                window_seconds=self.period,
                endpoint=endpoint
            )
            
            return limit_info["allowed"]
            
        except ImportError:
            logger.warning("Redis rate limiter no disponible, permitiendo request")
            return True
        except Exception as e:
            logger.error(f"Error verificando rate limit: {e}")
            return True  # En caso de error, permitir la request