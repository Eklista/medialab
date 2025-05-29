# app/middleware/security_headers.py
from fastapi import Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
import time
import logging
from typing import Callable
import re

from app.config.settings import ENVIRONMENT, FRONTEND_URL, SECURITY_HEADERS_ENABLED

logger = logging.getLogger(__name__)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware para agregar headers de seguridad y protecciones adicionales
    """
    
    def __init__(self, app, enable_security_headers: bool = True):
        super().__init__(app)
        self.enable_security_headers = enable_security_headers and SECURITY_HEADERS_ENABLED
        
        # Configuración de CSP según el entorno
        self.csp_policy = self._build_csp_policy()
        
        # Patrones de endpoints sensibles
        self.sensitive_endpoints = [
            r'/api/v1/auth/.*',
            r'/api/v1/admin/.*',
            r'/api/v1/users/.*/password',
            r'/api/v1/settings/.*'
        ]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Procesa la request y aplica headers de seguridad a la response
        """
        start_time = time.time()
        
        # Verificaciones de seguridad en la request
        if not self._is_request_safe(request):
            return JSONResponse(
                status_code=400,
                content={"detail": "Request bloqueada por políticas de seguridad"}
            )
        
        # Procesar request
        try:
            response = await call_next(request)
        except Exception as e:
            logger.error(f"Error en middleware de seguridad: {e}")
            return JSONResponse(
                status_code=500,
                content={"detail": "Error interno del servidor"}
            )
        
        # Aplicar headers de seguridad
        if self.enable_security_headers:
            self._add_security_headers(request, response)
        
        # Agregar tiempo de procesamiento para monitoring
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        
        # Log de requests a endpoints sensibles
        if self._is_sensitive_endpoint(request.url.path):
            logger.info(
                f"Acceso a endpoint sensible: {request.method} {request.url.path} "
                f"- IP: {self._get_client_ip(request)} - Tiempo: {process_time:.3f}s"
            )
        
        return response
    
    def _add_security_headers(self, request: Request, response: Response) -> None:
        """
        Agrega headers de seguridad a la response
        """
        # Prevención de clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # Prevención de MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Protección XSS
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Content Security Policy
        response.headers["Content-Security-Policy"] = self.csp_policy
        
        # HTTPS enforcement (solo en producción)
        if ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
        
        # Prevenir caching de datos sensibles
        if self._is_sensitive_endpoint(request.url.path):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        
        # Permissions Policy (Feature Policy)
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=(), "
            "usb=(), magnetometer=(), accelerometer=(), gyroscope=()"
        )
        
        # Remove server information
        response.headers.pop("Server", None)
        
        # Custom security headers
        response.headers["X-API-Version"] = "1.0"
        response.headers["X-Security-Level"] = "high"
    
    def _build_csp_policy(self) -> str:
        """
        Construye la política de Content Security Policy
        """
        if ENVIRONMENT == "production":
            return (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' https://api.medialab.eklista.com; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'"
            )
        else:
            # Política más permisiva para desarrollo
            return (
                "default-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "connect-src 'self' http://localhost:* ws://localhost:*; "
                "frame-ancestors 'none'"
            )
    
    def _is_request_safe(self, request: Request) -> bool:
        """
        Verifica si la request es segura
        """
        # Verificar tamaño de headers
        if self._check_header_size(request):
            return False
        
        # Verificar patrones maliciosos en URL
        if self._check_malicious_patterns(request.url.path):
            return False
        
        # Verificar User-Agent sospechoso
        if self._check_suspicious_user_agent(request.headers.get("user-agent", "")):
            return False
        
        return True
    
    def _check_header_size(self, request: Request) -> bool:
        """
        Verifica que los headers no excedan límites seguros
        """
        total_header_size = sum(
            len(name) + len(value) 
            for name, value in request.headers.items()
        )
        
        # Límite de 8KB para headers
        if total_header_size > 8192:
            logger.warning(f"Headers demasiado grandes: {total_header_size} bytes")
            return True
        
        return False
    
    def _check_malicious_patterns(self, path: str) -> bool:
        """
        Verifica patrones maliciosos en la URL
        """
        malicious_patterns = [
            r'\.\./',  # Path traversal
            r'<script',  # XSS attempts
            r'javascript:',  # JavaScript injection
            r'data:text/html',  # Data URL attacks
            r'vbscript:',  # VBScript injection
            r'\x00',  # Null bytes
        ]
        
        for pattern in malicious_patterns:
            if re.search(pattern, path, re.IGNORECASE):
                logger.warning(f"Patrón malicioso detectado en URL: {path}")
                return True
        
        return False
    
    def _check_suspicious_user_agent(self, user_agent: str) -> bool:
        """
        Verifica User-Agents sospechosos
        """
        suspicious_patterns = [
            r'sqlmap',  # SQL injection tool
            r'nikto',   # Web scanner
            r'nmap',    # Network scanner
            r'masscan', # Port scanner
            r'nessus',  # Vulnerability scanner
            r'burp',    # Security testing tool
            r'zap',     # OWASP ZAP
        ]
        
        for pattern in suspicious_patterns:
            if re.search(pattern, user_agent, re.IGNORECASE):
                logger.warning(f"User-Agent sospechoso: {user_agent}")
                return True
        
        return False
    
    def _is_sensitive_endpoint(self, path: str) -> bool:
        """
        Verifica si el endpoint es sensible
        """
        for pattern in self.sensitive_endpoints:
            if re.match(pattern, path):
                return True
        return False
    
    def _get_client_ip(self, request: Request) -> str:
        """
        Obtiene la IP real del cliente considerando proxies
        """
        # Verificar headers de proxy en orden de prioridad
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Tomar la primera IP (cliente original)
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback a la IP directa
        return request.client.host if request.client else "unknown"

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware para logging detallado de requests (especialmente las sensibles)
    """
    
    def __init__(self, app):
        super().__init__(app)
        self.sensitive_endpoints = [
            r'/api/v1/auth/.*',
            r'/api/v1/admin/.*',
            r'/api/v1/users/.*/password',
        ]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Loggea información detallada de requests sensibles
        """
        start_time = time.time()
        
        # Capturar información de la request
        request_info = {
            "method": request.method,
            "url": str(request.url),
            "client_ip": self._get_client_ip(request),
            "user_agent": request.headers.get("user-agent", ""),
            "timestamp": time.time()
        }
        
        # Procesar request
        response = await call_next(request)
        
        # Calcular tiempo de procesamiento
        process_time = time.time() - start_time
        
        # Log detallado para endpoints sensibles
        if self._is_sensitive_endpoint(request.url.path):
            logger.info(
                f"SENSITIVE_ACCESS: {request_info['method']} {request_info['url']} "
                f"- IP: {request_info['client_ip']} "
                f"- Status: {response.status_code} "
                f"- Time: {process_time:.3f}s "
                f"- UserAgent: {request_info['user_agent'][:100]}"
            )
        
        return response
    
    def _is_sensitive_endpoint(self, path: str) -> bool:
        """
        Verifica si el endpoint es sensible
        """
        for pattern in self.sensitive_endpoints:
            if re.match(pattern, path):
                return True
        return False
    
    def _get_client_ip(self, request: Request) -> str:
        """
        Obtiene la IP del cliente
        """
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"