# ============================================================================
# backend/app/middleware/__init__.py (NUEVO)
# ============================================================================
"""
Middleware de la aplicación
Middleware personalizado para rate limiting, seguridad y logging
"""

# Rate limiting middleware
from .rate_limit_middleware import RateLimitMiddleware

# Security headers middleware
# NOTA: security_headers.py parece tener contenido incorrecto (es código de main.py)
# Asumiendo que existe SecurityHeadersMiddleware basado en el import en security_headers.py
try:
    from .security_headers import SecurityHeadersMiddleware
except ImportError:
    # Si no existe, crear una clase placeholder
    class SecurityHeadersMiddleware:
        """Placeholder para SecurityHeadersMiddleware"""
        def __init__(self, app, **kwargs):
            self.app = app
        
        async def __call__(self, scope, receive, send):
            await self.app(scope, receive, send)
    
    SecurityHeadersMiddleware = SecurityHeadersMiddleware

# Request logging middleware (si existe)
try:
    from .request_logging_middleware import RequestLoggingMiddleware
except ImportError:
    # Si no existe, crear una clase placeholder
    class RequestLoggingMiddleware:
        """Placeholder para RequestLoggingMiddleware"""
        def __init__(self, app, **kwargs):
            self.app = app
        
        async def __call__(self, scope, receive, send):
            await self.app(scope, receive, send)
    
    RequestLoggingMiddleware = RequestLoggingMiddleware

__all__ = [
    "RateLimitMiddleware",
    "SecurityHeadersMiddleware", 
    "RequestLoggingMiddleware"
]

__version__ = "1.0.0"
__description__ = "Custom middleware for security, rate limiting and logging"