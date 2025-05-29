# backend/app/api/v1/admin/redis.py
from typing import List, Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body, Path
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models.auth.users import User
from app.api.deps import (
    admin_required, 
    redis_required,
    get_security_stats,
    redis_health_check
)
from app.utils.redis_rate_limiter import redis_rate_limiter
from app.utils.redis_token_blacklist import redis_token_blacklist
from app.config.redis_config import redis_manager

router = APIRouter()

@router.get("/health", response_model=Dict[str, Any])
def get_redis_health(
    current_user: User = Depends(admin_required)
) -> Any:
    """
    Obtiene el estado de salud de Redis
    """
    return redis_health_check()

@router.get("/stats", response_model=Dict[str, Any])
def get_redis_stats(
    current_user: User = Depends(admin_required)
) -> Any:
    """
    Obtiene estadísticas completas de Redis y sistemas de seguridad
    """
    return get_security_stats()

@router.get("/info", response_model=Dict[str, Any])
def get_redis_info(
    current_user: User = Depends(admin_required),
    redis_available: bool = Depends(redis_required)
) -> Any:
    """
    Obtiene información detallada del servidor Redis
    """
    try:
        redis_info = redis_manager.info()
        
        # Procesar información relevante
        processed_info = {
            "server": {
                "redis_version": redis_info.get("redis_version"),
                "redis_mode": redis_info.get("redis_mode"),
                "os": redis_info.get("os"),
                "arch_bits": redis_info.get("arch_bits"),
                "uptime_in_seconds": redis_info.get("uptime_in_seconds"),
                "uptime_in_days": redis_info.get("uptime_in_days")
            },
            "memory": {
                "used_memory": redis_info.get("used_memory"),
                "used_memory_human": redis_info.get("used_memory_human"),
                "used_memory_peak": redis_info.get("used_memory_peak"),
                "used_memory_peak_human": redis_info.get("used_memory_peak_human"),
                "maxmemory": redis_info.get("maxmemory"),
                "maxmemory_human": redis_info.get("maxmemory_human"),
                "maxmemory_policy": redis_info.get("maxmemory_policy")
            },
            "clients": {
                "connected_clients": redis_info.get("connected_clients"),
                "blocked_clients": redis_info.get("blocked_clients"),
                "max_clients": redis_info.get("maxclients")
            },
            "keyspace": {
                "total_keys": redis_manager.dbsize(),
                "expires": redis_info.get("expires", 0),
                "avg_ttl": redis_info.get("avg_ttl", 0)
            },
            "performance": {
                "instantaneous_ops_per_sec": redis_info.get("instantaneous_ops_per_sec"),
                "total_commands_processed": redis_info.get("total_commands_processed"),
                "keyspace_hits": redis_info.get("keyspace_hits"),
                "keyspace_misses": redis_info.get("keyspace_misses")
            }
        }
        
        return processed_info
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo información de Redis: {str(e)}"
        )

@router.get("/keys", response_model=Dict[str, Any])
def get_redis_keys(
    pattern: str = Query("*", description="Patrón para filtrar claves"),
    limit: int = Query(100, description="Límite de claves a retornar"),
    current_user: User = Depends(admin_required),
    redis_available: bool = Depends(redis_required)
) -> Any:
    """
    Obtiene claves de Redis con información detallada
    """
    try:
        # Obtener claves que coincidan con el patrón
        all_keys = redis_manager.keys(pattern)
        
        # Limitar número de claves
        keys = all_keys[:limit] if len(all_keys) > limit else all_keys
        
        # Obtener información detallada de cada clave
        detailed_keys = []
        for key in keys:
            try:
                ttl = redis_manager.ttl(key)
                key_type = redis_manager.client.type(key) if redis_manager.client else "unknown"
                
                key_info = {
                    "key": key,
                    "type": key_type,
                    "ttl": ttl,
                    "expires": "never" if ttl == -1 else f"{ttl}s"
                }
                
                # Obtener tamaño según el tipo
                if key_type == "string":
                    value = redis_manager.get(key)
                    key_info["size"] = len(str(value)) if value else 0
                elif key_type == "list":
                    key_info["length"] = redis_manager.llen(key)
                elif key_type == "set":
                    key_info["cardinality"] = redis_manager.client.scard(key)
                elif key_type == "hash":
                    key_info["fields"] = len(redis_manager.hgetall(key))
                
                detailed_keys.append(key_info)
                
            except Exception as key_error:
                detailed_keys.append({
                    "key": key,
                    "error": str(key_error)
                })
        
        return {
            "total_matching": len(all_keys),
            "returned": len(detailed_keys),
            "truncated": len(all_keys) > limit,
            "keys": detailed_keys
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo claves de Redis: {str(e)}"
        )

@router.get("/key/{key_name}", response_model=Dict[str, Any])
def get_redis_key_value(
    key_name: str,
    current_user: User = Depends(admin_required),
    redis_available: bool = Depends(redis_required)
) -> Any:
    """
    Obtiene el valor de una clave específica de Redis
    """
    try:
        if not redis_manager.exists(key_name):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Clave '{key_name}' no encontrada"
            )
        
        key_type = redis_manager.client.type(key_name)
        ttl = redis_manager.ttl(key_name)
        
        result = {
            "key": key_name,
            "type": key_type,
            "ttl": ttl,
            "expires": "never" if ttl == -1 else f"{ttl}s"
        }
        
        # Obtener valor según el tipo
        if key_type == "string":
            value = redis_manager.get(key_name)
            try:
                # Intentar parsear como JSON
                import json
                result["value"] = json.loads(value)
                result["is_json"] = True
            except:
                result["value"] = value
                result["is_json"] = False
                
        elif key_type == "list":
            result["value"] = redis_manager.lrange(key_name, 0, -1)
            result["length"] = redis_manager.llen(key_name)
            
        elif key_type == "set":
            result["value"] = list(redis_manager.client.smembers(key_name))
            result["cardinality"] = redis_manager.client.scard(key_name)
            
        elif key_type == "hash":
            result["value"] = redis_manager.hgetall(key_name)
            result["fields"] = len(result["value"])
            
        elif key_type == "zset":
            # Sorted set
            result["value"] = redis_manager.client.zrange(key_name, 0, -1, withscores=True)
            result["cardinality"] = redis_manager.client.zcard(key_name)
            
        else:
            result["value"] = f"Tipo no soportado: {key_type}"
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo valor de clave: {str(e)}"
        )

@router.delete("/key/{key_name}")
def delete_redis_key(
    key_name: str,
    current_user: User = Depends(admin_required),
    redis_available: bool = Depends(redis_required)
) -> Any:
    """
    Elimina una clave específica de Redis
    """
    try:
        if not redis_manager.exists(key_name):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Clave '{key_name}' no encontrada"
            )
        
        success = redis_manager.delete(key_name)
        
        if success:
            return {"message": f"Clave '{key_name}' eliminada exitosamente"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al eliminar la clave"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error eliminando clave: {str(e)}"
        )

@router.post("/blacklist/clear")
def clear_token_blacklist(
    confirm: bool = Body(..., description="Confirmación para limpiar blacklist"),
    current_user: User = Depends(admin_required),
    redis_available: bool = Depends(redis_required)
) -> Any:
    """
    Limpia toda la blacklist de tokens (USAR CON CUIDADO)
    """
    if not confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requiere confirmación para esta operación"
        )
    
    try:
        success = redis_token_blacklist.flush_all_blacklist_data()
        
        if success:
            return {"message": "Blacklist de tokens limpiada exitosamente"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al limpiar blacklist"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error limpiando blacklist: {str(e)}"
        )

@router.post("/rate-limit/reset")
def reset_rate_limits(
    identifier: Optional[str] = Body(None, description="Identificador específico (IP o usuario)"),
    endpoint: str = Body("*", description="Endpoint específico o * para todos"),
    current_user: User = Depends(admin_required),
    redis_available: bool = Depends(redis_required)
) -> Any:
    """
    Resetea rate limits para un identificador específico o todos
    """
    try:
        if identifier:
            # Resetear para identificador específico
            success = redis_rate_limiter.reset_identifier_limits(identifier, endpoint)
            message = f"Rate limits reseteados para {identifier}"
        else:
            # Resetear todos (solo en desarrollo)
            from app.config.settings import ENVIRONMENT
            if ENVIRONMENT == "production":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No se permite resetear todos los rate limits en producción"
                )
            
            # Eliminar todas las claves de rate limiting
            pattern = f"{redis_rate_limiter.RATE_LIMIT_PREFIX}*"
            keys = redis_manager.keys(pattern)
            deleted_count = 0
            
            for key in keys:
                if redis_manager.delete(key):
                    deleted_count += 1
            
            success = deleted_count > 0
            message = f"Rate limits reseteados: {deleted_count} entradas eliminadas"
        
        if success:
            return {"message": message}
        else:
            return {"message": "No se encontraron rate limits para resetear"}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reseteando rate limits: {str(e)}"
        )

@router.get("/monitoring", response_model=Dict[str, Any])
def get_redis_monitoring_data(
    current_user: User = Depends(admin_required)
) -> Any:
    """
    Obtiene datos de monitoreo en tiempo real de Redis
    """
    try:
        # Estadísticas de blacklist
        blacklist_stats = redis_token_blacklist.get_stats()
        
        # Estadísticas de rate limiting
        rate_limit_stats = redis_rate_limiter.get_stats()
        
        # Información general de Redis
        redis_health = redis_health_check()
        
        # Estadísticas de cache
        from app.services.redis_cache_service import redis_cache
        cache_stats = redis_cache.get_cache_stats()
        
        # Estadísticas de sesiones
        from app.services.redis_session_service import redis_sessions
        session_stats = redis_sessions.get_session_stats()
        
        # Claves por categoría
        categories = {
            "blacklist_tokens": len(redis_manager.keys("blacklist:token:*")),
            "blacklist_users": len(redis_manager.keys("blacklist:user:*")),
            "rate_limits": len(redis_manager.keys("rate_limit:*")),
            "failed_attempts": len(redis_manager.keys("failed_attempts:*")),
            "cache_entries": len(redis_manager.keys("cache:*")),
            "sessions": len(redis_manager.keys("session:*")),
            "user_sessions": len(redis_manager.keys("user_sessions:*"))
        }
        
        # Estado del sistema de limpieza
        from app.tasks.redis_cleanup_tasks import redis_cleanup_tasks
        cleanup_status = redis_cleanup_tasks.get_cleanup_status()
        
        return {
            "redis_health": redis_health,
            "blacklist": blacklist_stats,
            "rate_limiting": rate_limit_stats,
            "cache": cache_stats,
            "sessions": session_stats,
            "key_categories": categories,
            "total_keys": sum(categories.values()),
            "cleanup_tasks": cleanup_status,
            "monitoring_timestamp": redis_manager.client.time()[0] if redis_manager.is_available() else None
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo datos de monitoreo: {str(e)}"
        )

@router.get("/cache/stats", response_model=Dict[str, Any])
def get_cache_stats(
    current_user: User = Depends(admin_required)
) -> Any:
    """
    Obtiene estadísticas detalladas del sistema de cache
    """
    try:
        from app.services.redis_cache_service import redis_cache
        return redis_cache.get_cache_stats()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo estadísticas de cache: {str(e)}"
        )

@router.post("/cache/invalidate")
def invalidate_cache_pattern(
    pattern: str = Body(..., description="Patrón de claves a invalidar"),
    current_user: User = Depends(admin_required)
) -> Any:
    """
    Invalida cache según un patrón
    """
    try:
        from app.services.redis_cache_service import redis_cache
        deleted_count = redis_cache.invalidate_pattern(pattern)
        return {
            "pattern": pattern,
            "deleted_count": deleted_count,
            "message": f"Cache invalidado: {deleted_count} entradas eliminadas"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error invalidando cache: {str(e)}"
        )

@router.post("/cache/flush")
def flush_all_cache(
    confirm: bool = Body(..., description="Confirmación para limpiar todo el cache"),
    current_user: User = Depends(admin_required)
) -> Any:
    """
    Limpia todo el cache (USAR CON CUIDADO)
    """
    if not confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requiere confirmación para esta operación"
        )
    
    try:
        from app.services.redis_cache_service import redis_cache
        success = redis_cache.flush_all_cache()
        
        if success:
            return {"message": "Cache completamente limpiado"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al limpiar cache o no disponible en producción"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error limpiando cache: {str(e)}"
        )

@router.get("/sessions/stats", response_model=Dict[str, Any])
def get_session_stats(
    current_user: User = Depends(admin_required)
) -> Any:
    """
    Obtiene estadísticas del sistema de sesiones
    """
    try:
        from app.services.redis_session_service import redis_sessions
        return redis_sessions.get_session_stats()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo estadísticas de sesiones: {str(e)}"
        )

@router.get("/sessions/active-users", response_model=Dict[str, Any])
def get_active_users(
    limit: int = Query(50, description="Límite de usuarios a retornar"),
    current_user: User = Depends(admin_required)
) -> Any:
    """
    Obtiene lista de usuarios activos
    """
    try:
        from app.services.redis_session_service import redis_sessions
        active_users = redis_sessions.get_active_users(limit)
        
        return {
            "active_users": active_users,
            "total_returned": len(active_users),
            "limit": limit,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo usuarios activos: {str(e)}"
        )

@router.post("/sessions/force-logout/{user_id}")
def force_logout_user(
    user_id: int = Path(..., description="ID del usuario"),
    reason: str = Body("admin_action", description="Razón del logout forzado"),
    current_user: User = Depends(admin_required)
) -> Any:
    """
    Fuerza el logout de un usuario específico
    """
    try:
        from app.services.redis_session_service import redis_sessions
        result = redis_sessions.force_logout_user(user_id, reason)
        
        return {
            "success": True,
            "result": result,
            "admin_user": current_user.email
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error forzando logout: {str(e)}"
        )

@router.post("/sessions/cleanup")
def cleanup_expired_sessions(
    current_user: User = Depends(admin_required)
) -> Any:
    """
    Limpia sesiones expiradas manualmente
    """
    try:
        from app.services.redis_session_service import redis_sessions
        cleaned_count = redis_sessions.cleanup_expired_sessions()
        
        return {
            "message": f"Limpieza completada: {cleaned_count} entradas eliminadas",
            "cleaned_count": cleaned_count
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error limpiando sesiones: {str(e)}"
        )

@router.get("/cleanup/status", response_model=Dict[str, Any])
def get_cleanup_task_status(
    current_user: User = Depends(admin_required)
) -> Any:
    """
    Obtiene el estado de las tareas de limpieza automática
    """
    try:
        from app.tasks.redis_cleanup_tasks import redis_cleanup_tasks
        return redis_cleanup_tasks.get_cleanup_status()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo estado de limpieza: {str(e)}"
        )

@router.post("/cleanup/manual")
def manual_cleanup(
    current_user: User = Depends(admin_required)
) -> Any:
    """
    Ejecuta limpieza manual del sistema Redis
    """
    try:
        from app.tasks.redis_cleanup_tasks import redis_cleanup_tasks
        import asyncio
        
        # Ejecutar limpieza de forma síncrona
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            cleanup_results = loop.run_until_complete(redis_cleanup_tasks.perform_cleanup())
        finally:
            loop.close()
        
        return cleanup_results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error ejecutando limpieza manual: {str(e)}"
        )

@router.get("/system/status", response_model=Dict[str, Any])
def get_system_status(
    current_user: User = Depends(admin_required)
) -> Any:
    """
    Obtiene estado completo del sistema Redis
    """
    try:
        from app.services.system.redis_init_service import redis_init
        return redis_init.get_system_status()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo estado del sistema: {str(e)}"
        )

@router.post("/security/reset-user/{user_id}")
def emergency_reset_user_security(
    user_id: int = Path(..., description="ID del usuario"),
    current_user: User = Depends(admin_required)
) -> Any:
    """
    Reset de emergencia de seguridad para un usuario
    """
    try:
        from app.services.auth_service import AuthService
        success = AuthService.emergency_reset_user_security(user_id)
        
        return {
            "success": success,
            "user_id": user_id,
            "admin_user": current_user.email,
            "message": "Reset de seguridad ejecutado" if success else "Error en reset de seguridad"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en reset de seguridad: {str(e)}"
        )

@router.post("/blacklist/sync-mysql-redis")
def sync_mysql_to_redis(
    hours_back: int = Body(24, description="Horas hacia atrás para sincronizar"),
    current_user: User = Depends(admin_required)
) -> Any:
    """
    Sincroniza tokens activos de MySQL a Redis
    """
    try:
        from app.utils.token_blacklist import token_blacklist
        
        if hasattr(token_blacklist, 'sync_mysql_to_redis'):
            sync_results = token_blacklist.sync_mysql_to_redis(hours_back)
            return sync_results
        else:
            return {
                "message": "Sincronización no disponible",
                "reason": "Sistema híbrido no habilitado"
            }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sincronizando MySQL a Redis: {str(e)}"
        )