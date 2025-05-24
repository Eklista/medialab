# backend/app/middleware/rate_limit_middleware.py
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
import time
import logging
from typing import Callable, List

logger = logging.getLogger(__name__)

class RateLimitMiddleware:
    """
    Middleware global de rate limiting para FastAPI
    Corregido para evitar conflictos de argumentos
    """
    
    def __init__(
        self,
        app,  # ← Primer argumento requerido por FastAPI
        calls_limit: int = 1000,
        period: int = 3600,
        exclude_paths: List[str] = None
    ):
        self.app = app
        self.calls_limit = calls_limit
        self.period = period
        self.exclude_paths = exclude_paths or [
            "/docs", "/redoc", "/openapi.json", "/health", "/favicon.ico"
        ]
        
        logger.info(f"🚦 Rate limiting configurado: {calls_limit} requests per {period}s")
    
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
            # Obtener identificador del cliente
            client_ip = self._get_client_ip(request)
            endpoint = f"global:{request.method}:{path.split('/')[1] if len(path.split('/')) > 1 else 'root'}"
            
            # Verificar rate limit usando Redis si está disponible
            is_allowed = await self._check_rate_limit(client_ip, endpoint)
            
            if not is_allowed:
                # Crear respuesta de rate limit excedido
                response = JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": "Límite de solicitudes excedido. Inténtalo más tarde.",
                        "retry_after": 60
                    },
                    headers={
                        "Retry-After": "60",
                        "X-RateLimit-Limit": str(self.calls_limit),
                        "X-RateLimit-Remaining": "0"
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
                identifier=f"ip:{identifier}",
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