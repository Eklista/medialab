# backend/app/services/redis_init_service.py
import asyncio
import logging
from typing import Dict, Any
from datetime import datetime

from app.config.redis_config import redis_manager
from app.utils.redis_token_blacklist import redis_token_blacklist
from app.utils.redis_rate_limiter import redis_rate_limiter
from app.services.redis_cache_service import redis_cache
from app.services.redis_session_service import redis_sessions
from app.config.settings import ENVIRONMENT, REDIS_ENABLED

logger = logging.getLogger(__name__)

class RedisInitService:
    """
    Servicio para inicializar y verificar todos los componentes Redis del sistema
    """
    
    def __init__(self):
        self.components = {
            "redis_manager": redis_manager,
            "token_blacklist": redis_token_blacklist,
            "rate_limiter": redis_rate_limiter,
            "cache_service": redis_cache,
            "session_service": redis_sessions
        }
    
    async def initialize_redis_system(self) -> Dict[str, Any]:
        """
        Inicializa todo el sistema Redis y verifica componentes
        """
        if not REDIS_ENABLED:
            logger.warning("⚠️ Redis está deshabilitado en la configuración")
            return {
                "status": "disabled",
                "message": "Redis está deshabilitado en la configuración"
            }
        
        logger.info("🚀 Inicializando sistema Redis...")
        
        initialization_results = {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "environment": ENVIRONMENT,
            "components": {},
            "tests": {},
            "warnings": [],
            "errors": []
        }
        
        # 1. Verificar conexión base de Redis
        try:
            redis_health = self._check_redis_health()
            initialization_results["redis_health"] = redis_health
            
            if not redis_health["available"]:
                initialization_results["status"] = "failed"
                initialization_results["errors"].append("Redis no disponible")
                return initialization_results
                
        except Exception as e:
            initialization_results["status"] = "failed"
            initialization_results["errors"].append(f"Error verificando Redis: {e}")
            return initialization_results
        
        # 2. Verificar cada componente
        for component_name, component in self.components.items():
            try:
                component_status = self._check_component(component_name, component)
                initialization_results["components"][component_name] = component_status
                
                if not component_status["status"] == "ok":
                    initialization_results["warnings"].append(
                        f"Componente {component_name}: {component_status.get('message', 'Error desconocido')}"
                    )
                    
            except Exception as e:
                initialization_results["components"][component_name] = {
                    "status": "error",
                    "message": str(e)
                }
                initialization_results["errors"].append(f"Error en {component_name}: {e}")
        
        # 3. Ejecutar tests de funcionalidad
        try:
            test_results = await self._run_functionality_tests()
            initialization_results["tests"] = test_results
            
            # Verificar si algún test falló
            failed_tests = [name for name, result in test_results.items() if not result.get("passed", False)]
            if failed_tests:
                initialization_results["warnings"].extend([f"Test fallido: {test}" for test in failed_tests])
                
        except Exception as e:
            initialization_results["errors"].append(f"Error ejecutando tests: {e}")
        
        # 4. Limpieza inicial si es necesario
        try:
            if ENVIRONMENT == "development":
                cleanup_results = self._perform_startup_cleanup()
                initialization_results["cleanup"] = cleanup_results
        except Exception as e:
            initialization_results["warnings"].append(f"Error en limpieza inicial: {e}")
        
        # 5. Determinar status final
        if initialization_results["errors"]:
            initialization_results["status"] = "partial" if initialization_results["components"] else "failed"
        elif initialization_results["warnings"]:
            initialization_results["status"] = "warning"
        else:
            initialization_results["status"] = "success"
        
        # Log del resultado
        if initialization_results["status"] == "success":
            logger.info("✅ Sistema Redis inicializado exitosamente")
        elif initialization_results["status"] == "warning":
            logger.warning(f"⚠️ Sistema Redis inicializado con advertencias: {len(initialization_results['warnings'])}")
        else:
            logger.error(f"❌ Error inicializando sistema Redis: {len(initialization_results['errors'])} errores")
        
        return initialization_results
    
    def _check_redis_health(self) -> Dict[str, Any]:
        """
        Verifica la salud básica de Redis
        """
        try:
            if not redis_manager.is_available():
                return {"available": False, "error": "Redis no disponible"}
            
            # Test de ping
            redis_manager.client.ping()
            
            # Información básica
            redis_info = redis_manager.info()
            
            return {
                "available": True,
                "version": redis_info.get("redis_version"),
                "mode": redis_info.get("redis_mode"),
                "memory_used": redis_info.get("used_memory_human"),
                "uptime_seconds": redis_info.get("uptime_in_seconds"),
                "connected_clients": redis_info.get("connected_clients"),
                "total_keys": redis_manager.dbsize()
            }
            
        except Exception as e:
            return {"available": False, "error": str(e)}
    
    def _check_component(self, name: str, component) -> Dict[str, Any]:
        """
        Verifica el estado de un componente específico
        """
        try:
            if name == "redis_manager":
                return {
                    "status": "ok" if component.is_available() else "error",
                    "enabled": component.enabled,
                    "message": "Manager principal funcionando" if component.is_available() else "Manager no disponible"
                }
            
            elif name == "token_blacklist":
                return {
                    "status": "ok" if component.enabled else "disabled",
                    "enabled": component.enabled,
                    "redis_available": component.redis.is_available(),
                    "message": "Blacklist funcionando" if component.enabled else "Blacklist deshabilitado"
                }
            
            elif name == "rate_limiter":
                return {
                    "status": "ok" if component.enabled else "disabled",
                    "enabled": component.enabled,
                    "storage": "redis" if component.use_redis else "memory",
                    "redis_available": component.redis.is_available(),
                    "message": "Rate limiter funcionando" if component.enabled else "Rate limiter deshabilitado"
                }
            
            elif name == "cache_service":
                return {
                    "status": "ok" if component.enabled else "disabled",
                    "enabled": component.enabled,
                    "redis_available": component.redis.is_available(),
                    "default_ttl": component.default_ttl,
                    "message": "Cache funcionando" if component.enabled else "Cache deshabilitado"
                }
            
            elif name == "session_service":
                return {
                    "status": "ok" if component.redis.is_available() else "error",
                    "redis_available": component.redis.is_available(),
                    "default_ttl": component.DEFAULT_SESSION_TTL,
                    "extended_ttl": component.EXTENDED_SESSION_TTL,
                    "message": "Sesiones funcionando" if component.redis.is_available() else "Sesiones no disponibles"
                }
            
            else:
                return {"status": "unknown", "message": "Componente no reconocido"}
                
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def _run_functionality_tests(self) -> Dict[str, Any]:
        """
        Ejecuta tests de funcionalidad para cada componente
        """
        tests = {}
        
        # Test básico de Redis
        tests["redis_basic"] = self._test_redis_basic_operations()
        
        # Test de blacklist
        tests["blacklist"] = self._test_blacklist_functionality()
        
        # Test de rate limiting
        tests["rate_limiting"] = self._test_rate_limiting()
        
        # Test de cache
        tests["cache"] = self._test_cache_functionality()
        
        # Test de sesiones
        tests["sessions"] = self._test_session_functionality()
        
        return tests
    
    def _test_redis_basic_operations(self) -> Dict[str, Any]:
        """
        Test de operaciones básicas de Redis
        """
        try:
            test_key = "test:init:basic"
            test_value = {"test": True, "timestamp": datetime.utcnow().isoformat()}
            
            # Test SET
            set_success = redis_manager.set(test_key, test_value, expire=60)
            if not set_success:
                return {"passed": False, "error": "SET falló"}
            
            # Test GET
            retrieved_value = redis_manager.get(test_key, as_json=True)
            if not retrieved_value or retrieved_value.get("test") != True:
                return {"passed": False, "error": "GET falló"}
            
            # Test DELETE
            delete_success = redis_manager.delete(test_key)
            if not delete_success:
                return {"passed": False, "error": "DELETE falló"}
            
            return {"passed": True, "message": "Operaciones básicas OK"}
            
        except Exception as e:
            return {"passed": False, "error": str(e)}
    
    def _test_blacklist_functionality(self) -> Dict[str, Any]:
        """
        Test de funcionalidad de blacklist
        """
        try:
            if not redis_token_blacklist.enabled:
                return {"passed": True, "message": "Blacklist deshabilitado (OK)"}
            
            # Test de registro de intento fallido
            test_identifier = "test_user_init"
            attempts = redis_token_blacklist.record_failed_attempt(test_identifier, "test")
            
            if attempts < 1:
                return {"passed": False, "error": "Registro de intentos fallidos falló"}
            
            # Test de verificación
            recorded_attempts = redis_token_blacklist.get_failed_attempts(test_identifier, "test")
            if recorded_attempts != attempts:
                return {"passed": False, "error": "Verificación de intentos falló"}
            
            # Limpiar
            redis_token_blacklist.clear_failed_attempts(test_identifier, "test")
            
            return {"passed": True, "message": "Blacklist funcionando"}
            
        except Exception as e:
            return {"passed": False, "error": str(e)}
    
    def _test_rate_limiting(self) -> Dict[str, Any]:
        """
        Test de funcionalidad de rate limiting
        """
        try:
            if not redis_rate_limiter.enabled:
                return {"passed": True, "message": "Rate limiting deshabilitado (OK)"}
            
            test_identifier = "test_ip:127.0.0.1"
            test_endpoint = "test_endpoint"
            
            # Test de verificación de límite
            limit_info = redis_rate_limiter.check_rate_limit(
                identifier=test_identifier,
                max_requests=5,
                window_seconds=60,
                endpoint=test_endpoint
            )
            
            if not isinstance(limit_info, dict) or "allowed" not in limit_info:
                return {"passed": False, "error": "Estructura de respuesta inválida"}
            
            if not limit_info["allowed"]:
                return {"passed": False, "error": "Rate limit debería permitir primera request"}
            
            return {"passed": True, "message": "Rate limiting funcionando"}
            
        except Exception as e:
            return {"passed": False, "error": str(e)}
    
    def _test_cache_functionality(self) -> Dict[str, Any]:
        """
        Test de funcionalidad de cache
        """
        try:
            if not redis_cache.enabled:
                return {"passed": True, "message": "Cache deshabilitado (OK)"}
            
            test_key = "test_cache_init"
            test_value = {"cached": True, "timestamp": datetime.utcnow().isoformat()}
            
            # Test SET
            set_success = redis_cache.set(test_key, test_value, ttl=60)
            if not set_success:
                return {"passed": False, "error": "Cache SET falló"}
            
            # Test GET
            cached_value = redis_cache.get(test_key)
            if not cached_value or cached_value.get("cached") != True:
                return {"passed": False, "error": "Cache GET falló"}
            
            # Test DELETE
            delete_success = redis_cache.delete(test_key)
            if not delete_success:
                return {"passed": False, "error": "Cache DELETE falló"}
            
            return {"passed": True, "message": "Cache funcionando"}
            
        except Exception as e:
            return {"passed": False, "error": str(e)}
    
    def _test_session_functionality(self) -> Dict[str, Any]:
        """
        Test de funcionalidad de sesiones
        """
        try:
            if not redis_sessions.redis.is_available():
                return {"passed": False, "error": "Redis no disponible para sesiones"}
            
            test_user_id = 99999  # Usuario de test
            
            # Test creación de sesión
            session_id = redis_sessions.create_session(
                user_id=test_user_id,
                device_info={"test": True},
                session_data={"test_session": True}
            )
            
            if not session_id:
                return {"passed": False, "error": "Creación de sesión falló"}
            
            # Test obtención de sesión
            session_data = redis_sessions.get_session(session_id)
            if not session_data or session_data.get("user_id") != test_user_id:
                return {"passed": False, "error": "Obtención de sesión falló"}
            
            # Test destrucción de sesión
            destroy_success = redis_sessions.destroy_session(session_id)
            if not destroy_success:
                return {"passed": False, "error": "Destrucción de sesión falló"}
            
            return {"passed": True, "message": "Sesiones funcionando"}
            
        except Exception as e:
            return {"passed": False, "error": str(e)}
    
    def _perform_startup_cleanup(self) -> Dict[str, Any]:
        """
        Realiza limpieza inicial en desarrollo
        """
        if ENVIRONMENT != "development":
            return {"performed": False, "reason": "Solo en desarrollo"}
        
        cleanup_results = {
            "performed": True,
            "operations": {}
        }
        
        try:
            # Limpiar datos de test antiguos
            test_patterns = ["test:*", "*test*", "init:*"]
            total_cleaned = 0
            
            for pattern in test_patterns:
                keys = redis_manager.keys(pattern)
                for key in keys:
                    if redis_manager.delete(key):
                        total_cleaned += 1
            
            cleanup_results["operations"]["test_data_cleanup"] = {
                "cleaned_keys": total_cleaned
            }
            
            # Limpiar sesiones expiradas
            sessions_cleaned = redis_sessions.cleanup_expired_sessions()
            cleanup_results["operations"]["sessions_cleanup"] = {
                "cleaned_sessions": sessions_cleaned
            }
            
        except Exception as e:
            cleanup_results["error"] = str(e)
        
        return cleanup_results
    
    def get_system_status(self) -> Dict[str, Any]:
        """
        Obtiene el estado actual del sistema Redis
        """
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "redis_health": self._check_redis_health(),
            "components": {
                name: self._check_component(name, component)
                for name, component in self.components.items()
            },
            "statistics": {
                "blacklist": redis_token_blacklist.get_stats(),
                "rate_limiting": redis_rate_limiter.get_stats(),
                "cache": redis_cache.get_cache_stats(),
                "sessions": redis_sessions.get_session_stats()
            }
        }


# Instancia global del servicio de inicialización
redis_init = RedisInitService()