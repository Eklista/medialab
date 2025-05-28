# backend/app/api/v1/health.py
from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.config.settings import ENVIRONMENT, VERSION, REDIS_ENABLED
from app.config.redis_config import redis_manager
from app.utils.redis_token_blacklist import redis_token_blacklist
from app.utils.redis_rate_limiter import redis_rate_limiter

router = APIRouter()

@router.get("/health", response_model=Dict[str, Any])
def health_check(db: Session = Depends(get_db)) -> Any:
    """
    Endpoint de salud del sistema completo
    """
    health_data = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": ENVIRONMENT,
        "version": VERSION,
        "services": {}
    }
    
    # Verificar base de datos MySQL
    try:
        db.execute("SELECT 1")
        health_data["services"]["database"] = {
            "status": "healthy",
            "type": "mysql"
        }
    except Exception as e:
        health_data["status"] = "degraded"
        health_data["services"]["database"] = {
            "status": "unhealthy",
            "type": "mysql",
            "error": str(e)
        }
    
    # Verificar Redis
    if REDIS_ENABLED:
        try:
            if redis_manager.is_available():
                redis_info = redis_manager.info()
                health_data["services"]["redis"] = {
                    "status": "healthy",
                    "type": "redis",
                    "version": redis_info.get("redis_version"),
                    "memory_used": redis_info.get("used_memory_human"),
                    "connected_clients": redis_info.get("connected_clients"),
                    "total_keys": redis_manager.dbsize()
                }
            else:
                health_data["status"] = "degraded"
                health_data["services"]["redis"] = {
                    "status": "unhealthy",
                    "type": "redis",
                    "error": "Redis not available"
                }
        except Exception as e:
            health_data["status"] = "degraded"
            health_data["services"]["redis"] = {
                "status": "unhealthy",
                "type": "redis",
                "error": str(e)
            }
    else:
        health_data["services"]["redis"] = {
            "status": "disabled",
            "type": "redis"
        }
    
    # Verificar sistemas de seguridad
    try:
        blacklist_stats = redis_token_blacklist.get_stats()
        rate_limit_stats = redis_rate_limiter.get_stats()
        
        health_data["services"]["security"] = {
            "status": "healthy",
            "blacklist": {
                "enabled": blacklist_stats.get("enabled", False),
                "storage": blacklist_stats.get("storage", "unknown"),
                "redis_available": blacklist_stats.get("redis_available", False)
            },
            "rate_limiting": {
                "enabled": rate_limit_stats.get("enabled", False),
                "storage": rate_limit_stats.get("storage", "unknown"),
                "redis_available": rate_limit_stats.get("redis_available", False)
            }
        }
    except Exception as e:
        health_data["services"]["security"] = {
            "status": "degraded",
            "error": str(e)
        }
    
    return health_data

@router.get("/health/detailed", response_model=Dict[str, Any])
def detailed_health_check(db: Session = Depends(get_db)) -> Any:
    """
    Endpoint de salud detallado del sistema
    """
    health_data = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": ENVIRONMENT,
        "version": VERSION,
        "uptime": "unknown",  # Se podría calcular desde un timestamp de inicio
        "detailed_services": {}
    }
    
    # Verificación detallada de MySQL
    try:
        # Test básico de conexión
        result = db.execute("SELECT 1 as test").fetchone()
        
        # Test de tabla existente
        tables_result = db.execute("SHOW TABLES").fetchall()
        table_count = len(tables_result)
        
        health_data["detailed_services"]["mysql"] = {
            "status": "healthy",
            "connection": "ok",
            "basic_query": "ok" if result and result[0] == 1 else "failed",
            "table_count": table_count,
            "database_name": db.get_bind().url.database
        }
    except Exception as e:
        health_data["status"] = "degraded"
        health_data["detailed_services"]["mysql"] = {
            "status": "unhealthy",
            "error": str(e)
        }
    
    # Verificación detallada de Redis
    if REDIS_ENABLED:
        try:
            if redis_manager.is_available():
                # Test de ping
                redis_manager.client.ping()
                
                # Test de escritura/lectura
                test_key = "health_check_test"
                test_value = {"timestamp": datetime.utcnow().isoformat()}
                redis_manager.set(test_key, test_value, expire=60)
                retrieved = redis_manager.get(test_key, as_json=True)
                
                # Información detallada
                redis_info = redis_manager.info()
                
                health_data["detailed_services"]["redis"] = {
                    "status": "healthy",
                    "ping": "ok",
                    "write_read_test": "ok" if retrieved else "failed",
                    "server_info": {
                        "version": redis_info.get("redis_version"),
                        "mode": redis_info.get("redis_mode"),
                        "uptime_seconds": redis_info.get("uptime_in_seconds"),
                        "memory_used": redis_info.get("used_memory_human"),
                        "memory_peak": redis_info.get("used_memory_peak_human"),
                        "connected_clients": redis_info.get("connected_clients"),
                        "total_commands": redis_info.get("total_commands_processed"),
                        "keyspace_hits": redis_info.get("keyspace_hits"),
                        "keyspace_misses": redis_info.get("keyspace_misses")
                    },
                    "keyspace": {
                        "total_keys": redis_manager.dbsize(),
                        "blacklist_keys": len(redis_manager.keys("blacklist:*")),
                        "rate_limit_keys": len(redis_manager.keys("rate_limit:*")),
                        "cache_keys": len(redis_manager.keys("cache:*"))
                    }
                }
                
                # Limpiar clave de test
                redis_manager.delete(test_key)
                
            else:
                health_data["status"] = "degraded"
                health_data["detailed_services"]["redis"] = {
                    "status": "unhealthy",
                    "error": "Redis connection failed"
                }
        except Exception as e:
            health_data["status"] = "degraded"
            health_data["detailed_services"]["redis"] = {
                "status": "unhealthy",
                "error": str(e)
            }
    else:
        health_data["detailed_services"]["redis"] = {
            "status": "disabled",
            "reason": "Redis is disabled in configuration"
        }
    
    # Verificación detallada de sistemas de seguridad
    try:
        # Estadísticas de blacklist
        blacklist_stats = redis_token_blacklist.get_stats()
        
        # Estadísticas de rate limiting
        rate_limit_stats = redis_rate_limiter.get_stats()
        
        health_data["detailed_services"]["security_systems"] = {
            "status": "healthy",
            "token_blacklist": {
                "enabled": blacklist_stats.get("enabled", False),
                "storage_type": blacklist_stats.get("storage", "unknown"),
                "redis_available": blacklist_stats.get("redis_available", False),
                "stats": blacklist_stats
            },
            "rate_limiting": {
                "enabled": rate_limit_stats.get("enabled", False),
                "storage_type": rate_limit_stats.get("storage", "unknown"),
                "redis_available": rate_limit_stats.get("redis_available", False),
                "stats": rate_limit_stats
            }
        }
    except Exception as e:
        health_data["detailed_services"]["security_systems"] = {
            "status": "degraded",
            "error": str(e)
        }
    
    return health_data

@router.get("/health/redis", response_model=Dict[str, Any])
def redis_specific_health() -> Any:
    """
    Endpoint específico para la salud de Redis
    """
    if not REDIS_ENABLED:
        return {
            "status": "disabled",
            "message": "Redis is disabled in configuration"
        }
    
    try:
        if not redis_manager.is_available():
            return {
                "status": "unhealthy",
                "error": "Redis connection failed"
            }
        
        # Test completo de Redis
        start_time = datetime.utcnow()
        
        # Test de ping
        redis_manager.client.ping()
        
        # Test de operaciones básicas
        test_operations = {
            "string_ops": False,
            "list_ops": False,
            "hash_ops": False,
            "set_ops": False,
            "ttl_ops": False
        }
        
        # Test de string operations
        try:
            redis_manager.set("health:string_test", "test_value", expire=60)
            value = redis_manager.get("health:string_test")
            test_operations["string_ops"] = value == "test_value"
            redis_manager.delete("health:string_test")
        except:
            test_operations["string_ops"] = False
        
        # Test de list operations
        try:
            redis_manager.lpush("health:list_test", "item1", "item2")
            length = redis_manager.llen("health:list_test")
            test_operations["list_ops"] = length == 2
            redis_manager.delete("health:list_test")
        except:
            test_operations["list_ops"] = False
        
        # Test de hash operations
        try:
            redis_manager.hset("health:hash_test", "field1", "value1")
            value = redis_manager.hget("health:hash_test", "field1")
            test_operations["hash_ops"] = value == "value1"
            redis_manager.delete("health:hash_test")
        except:
            test_operations["hash_ops"] = False
        
        # Test de set operations
        try:
            redis_manager.sadd("health:set_test", "member1", "member2")
            is_member = redis_manager.sismember("health:set_test", "member1")
            test_operations["set_ops"] = is_member
            redis_manager.delete("health:set_test")
        except:
            test_operations["set_ops"] = False
        
        # Test de TTL operations
        try:
            redis_manager.set("health:ttl_test", "value", expire=10)
            ttl = redis_manager.ttl("health:ttl_test")
            test_operations["ttl_ops"] = 0 < ttl <= 10
            redis_manager.delete("health:ttl_test")
        except:
            test_operations["ttl_ops"] = False
        
        end_time = datetime.utcnow()
        response_time = (end_time - start_time).total_seconds() * 1000
        
        # Información del servidor
        redis_info = redis_manager.info()
        
        return {
            "status": "healthy",
            "response_time_ms": round(response_time, 2),
            "test_results": test_operations,
            "all_tests_passed": all(test_operations.values()),
            "server_info": {
                "version": redis_info.get("redis_version"),
                "uptime_seconds": redis_info.get("uptime_in_seconds"),
                "memory_used": redis_info.get("used_memory_human"),
                "connected_clients": redis_info.get("connected_clients"),
                "total_keys": redis_manager.dbsize()
            }
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }