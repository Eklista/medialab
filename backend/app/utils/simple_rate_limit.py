# backend/app/utils/simple_rate_limit.py
from fastapi import HTTPException, status, Request
from typing import Optional
import logging

logger = logging.getLogger(__name__)

def check_rate_limit(
    request: Request,
    max_requests: int = 60,
    window_seconds: int = 60,
    endpoint_name: Optional[str] = None
) -> bool:
    """
    Función simple para verificar rate limit sin usar Depends
    """
    try:
        from app.utils.redis_rate_limiter import redis_rate_limiter
        
        # Obtener identificador
        identifier = redis_rate_limiter.get_identifier(request, use_user_id=False)
        
        # Determinar nombre del endpoint
        endpoint = endpoint_name or "unknown"
        
        # Verificar rate limit
        limit_info = redis_rate_limiter.check_rate_limit(
            identifier=identifier,
            max_requests=max_requests,
            window_seconds=window_seconds,
            endpoint=endpoint
        )
        
        if not limit_info["allowed"]:
            logger.warning(f"🚦 Rate limit excedido: {identifier} en {endpoint}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Demasiadas solicitudes. Inténtalo más tarde.",
                headers={
                    "Retry-After": str(limit_info["retry_after"]),
                    "X-RateLimit-Limit": str(max_requests),
                    "X-RateLimit-Remaining": str(limit_info["remaining"]),
                    "X-RateLimit-Reset": str(limit_info["reset_time"])
                }
            )
        
        return True
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en rate limiting: {e}")
        # En caso de error, permitir la request
        return True