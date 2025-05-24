# backend/app/tasks/redis_cleanup_tasks.py
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any

from app.config.redis_config import redis_manager
from app.utils.redis_token_blacklist import redis_token_blacklist
from app.utils.redis_rate_limiter import redis_rate_limiter
from app.services.redis_cache_service import redis_cache
from app.services.redis_session_service import redis_sessions
from app.models.security.token_blacklist import TokenBlacklist
from app.database import SessionLocal

logger = logging.getLogger(__name__)

class RedisCleanupTasks:
    """
    Tareas programadas para limpieza y mantenimiento de Redis
    """
    
    def __init__(self):
        self.cleanup_interval = 3600  # 1 hora
        self.deep_cleanup_interval = 86400  # 24 horas
        self.last_cleanup = None
        self.last_deep_cleanup = None
        
        logger.info("🧹 Redis Cleanup Tasks inicializadas")
    
    async def run_periodic_cleanup(self):
        """
        Ejecuta limpieza periódica de Redis
        """
        while True:
            try:
                await self.perform_cleanup()
                await asyncio.sleep(self.cleanup_interval)
            except Exception as e:
                logger.error(f"Error en limpieza periódica: {e}")
                await asyncio.sleep(60)  # Esperar 1 minuto antes de reintentar
    
    async def perform_cleanup(self) -> Dict[str, Any]:
        """
        Realiza limpieza completa del sistema Redis
        """
        if not redis_manager.is_available():
            logger.warning("Redis no disponible para limpieza")
            return {"status": "skipped", "reason": "Redis no disponible"}
        
        cleanup_start = datetime.utcnow()
        
        cleanup_results = {
            "timestamp": cleanup_start.isoformat(),
            "operations": {},
            "total_cleaned": 0,
            "duration_seconds": 0,
            "errors": []
        }
        
        try:
            # 1. Limpieza de sesiones expiradas
            try:
                sessions_cleaned = redis_sessions.cleanup_expired_sessions()
                cleanup_results["operations"]["sessions"] = {
                    "cleaned": sessions_cleaned,
                    "status": "success"
                }
                cleanup_results["total_cleaned"] += sessions_cleaned
            except Exception as e:
                cleanup_results["errors"].append(f"Sesiones: {e}")
                cleanup_results["operations"]["sessions"] = {"status": "error", "error": str(e)}
            
            # 2. Limpieza de cache en memoria del rate limiter
            try:
                rate_limit_cleaned = redis_rate_limiter.cleanup_memory_cache()
                cleanup_results["operations"]["rate_limiter"] = {
                    "cleaned": rate_limit_cleaned,
                    "status": "success"
                }
                cleanup_results["total_cleaned"] += rate_limit_cleaned
            except Exception as e:
                cleanup_results["errors"].append(f"Rate limiter: {e}")
                cleanup_results["operations"]["rate_limiter"] = {"status": "error", "error": str(e)}
            
            # 3. Limpieza de tokens expirados en MySQL (fallback)
            try:
                mysql_cleaned = await self._cleanup_mysql_tokens()
                cleanup_results["operations"]["mysql_tokens"] = {
                    "cleaned": mysql_cleaned,
                    "status": "success"
                }
                cleanup_results["total_cleaned"] += mysql_cleaned
            except Exception as e:
                cleanup_results["errors"].append(f"MySQL tokens: {e}")
                cleanup_results["operations"]["mysql_tokens"] = {"status": "error", "error": str(e)}
            
            # 4. Limpieza profunda (solo cada 24 horas)
            if self._should_run_deep_cleanup():
                try:
                    deep_cleanup_results = await self._perform_deep_cleanup()
                    cleanup_results["operations"]["deep_cleanup"] = deep_cleanup_results
                    cleanup_results["total_cleaned"] += deep_cleanup_results.get("total_cleaned", 0)
                    self.last_deep_cleanup = cleanup_start
                except Exception as e:
                    cleanup_results["errors"].append(f"Deep cleanup: {e}")
                    cleanup_results["operations"]["deep_cleanup"] = {"status": "error", "error": str(e)}
            
            # 5. Verificar integridad de datos
            try:
                integrity_results = await self._verify_data_integrity()
                cleanup_results["operations"]["integrity_check"] = integrity_results
            except Exception as e:
                cleanup_results["errors"].append(f"Integrity check: {e}")
                cleanup_results["operations"]["integrity_check"] = {"status": "error", "error": str(e)}
            
            # Calcular duración
            cleanup_end = datetime.utcnow()
            cleanup_results["duration_seconds"] = (cleanup_end - cleanup_start).total_seconds()
            
            # Actualizar último cleanup
            self.last_cleanup = cleanup_start
            
            # Log de resultados
            if cleanup_results["errors"]:
                logger.warning(
                    f"🧹 Limpieza completada con errores: {cleanup_results['total_cleaned']} entradas, "
                    f"{len(cleanup_results['errors'])} errores en {cleanup_results['duration_seconds']:.2f}s"
                )
            else:
                logger.info(
                    f"🧹 Limpieza exitosa: {cleanup_results['total_cleaned']} entradas "
                    f"en {cleanup_results['duration_seconds']:.2f}s"
                )
            
            return cleanup_results
            
        except Exception as e:
            cleanup_results["errors"].append(f"Error general: {e}")
            logger.error(f"Error en limpieza de Redis: {e}")
            return cleanup_results
    
    async def _cleanup_mysql_tokens(self) -> int:
        """
        Limpia tokens expirados de MySQL
        """
        try:
            db = SessionLocal()
            deleted_count = TokenBlacklist.cleanup_expired_tokens(db)
            db.close()
            
            if deleted_count > 0:
                logger.info(f"🗑️ Tokens MySQL limpiados: {deleted_count}")
            
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error limpiando tokens MySQL: {e}")
            return 0
    
    def _should_run_deep_cleanup(self) -> bool:
        """
        Determina si debe ejecutarse la limpieza profunda
        """
        if self.last_deep_cleanup is None:
            return True
        
        time_since_last = datetime.utcnow() - self.last_deep_cleanup
        return time_since_last.total_seconds() >= self.deep_cleanup_interval
    
    async def _perform_deep_cleanup(self) -> Dict[str, Any]:
        """
        Realiza limpieza profunda del sistema
        """
        deep_results = {
            "status": "success",
            "operations": {},
            "total_cleaned": 0,
            "warnings": []
        }
        
        try:
            # 1. Analizar y limpiar claves huérfanas
            orphaned_cleaned = await self._cleanup_orphaned_keys()
            deep_results["operations"]["orphaned_keys"] = {
                "cleaned": orphaned_cleaned,
                "status": "success"
            }
            deep_results["total_cleaned"] += orphaned_cleaned
            
            # 2. Optimizar memoria Redis
            memory_optimized = await self._optimize_redis_memory()
            deep_results["operations"]["memory_optimization"] = memory_optimized
            
            # 3. Verificar y corregir inconsistencias
            inconsistencies_fixed = await self._fix_data_inconsistencies()
            deep_results["operations"]["inconsistencies"] = {
                "fixed": inconsistencies_fixed,
                "status": "success"
            }
            deep_results["total_cleaned"] += inconsistencies_fixed
            
            # 4. Generar reporte de salud
            health_report = await self._generate_health_report()
            deep_results["operations"]["health_report"] = health_report
            
            logger.info(f"🔍 Limpieza profunda completada: {deep_results['total_cleaned']} optimizaciones")
            
        except Exception as e:
            deep_results["status"] = "error"
            deep_results["error"] = str(e)
            logger.error(f"Error en limpieza profunda: {e}")
        
        return deep_results
    
    async def _cleanup_orphaned_keys(self) -> int:
        """
        Limpia claves huérfanas o inconsistentes
        """
        try:
            cleaned_count = 0
            
            # 1. Limpiar listas de sesiones de usuarios sin sesiones activas
            user_session_keys = redis_manager.keys(f"{redis_sessions.USER_SESSIONS_PREFIX}*")
            
            for user_sessions_key in user_session_keys:
                try:
                    user_id = user_sessions_key.split(":")[-1]
                    session_ids = redis_manager.client.smembers(user_sessions_key)
                    
                    # Verificar cuántas sesiones realmente existen
                    valid_sessions = []
                    for session_id in session_ids:
                        session_key = f"{redis_sessions.SESSION_PREFIX}{session_id}"
                        if redis_manager.exists(session_key):
                            valid_sessions.append(session_id)
                    
                    # Si no hay sesiones válidas, eliminar lista
                    if not valid_sessions and session_ids:
                        redis_manager.delete(user_sessions_key)
                        cleaned_count += 1
                        logger.debug(f"Lista de sesiones huérfana eliminada para usuario {user_id}")
                    
                    # Si hay diferencia, actualizar lista
                    elif len(valid_sessions) != len(session_ids):
                        redis_manager.delete(user_sessions_key)
                        for session_id in valid_sessions:
                            redis_manager.sadd(user_sessions_key, session_id)
                        cleaned_count += 1
                        
                except Exception as session_error:
                    logger.warning(f"Error procesando sesiones de usuario: {session_error}")
            
            # 2. Limpiar entradas de usuarios activos sin sesiones
            active_users_key = f"{redis_sessions.ACTIVE_USERS_PREFIX}current"
            if redis_manager.exists(active_users_key):
                try:
                    # Obtener todos los usuarios activos
                    user_scores = redis_manager.client.zrange(active_users_key, 0, -1, withscores=True)
                    
                    for user_id, score in user_scores:
                        user_sessions_key = f"{redis_sessions.USER_SESSIONS_PREFIX}{user_id}"
                        
                        # Si el usuario no tiene sesiones activas, removerlo
                        if not redis_manager.exists(user_sessions_key):
                            redis_manager.client.zrem(active_users_key, user_id)
                            cleaned_count += 1
                            logger.debug(f"Usuario {user_id} removido de activos (sin sesiones)")
                            
                except Exception as active_error:
                    logger.warning(f"Error limpiando usuarios activos: {active_error}")
            
            return cleaned_count
            
        except Exception as e:
            logger.error(f"Error limpiando claves huérfanas: {e}")
            return 0
    
    async def _optimize_redis_memory(self) -> Dict[str, Any]:
        """
        Optimiza el uso de memoria de Redis
        """
        try:
            # Obtener info antes de optimización
            redis_info_before = redis_manager.info()
            memory_before = redis_info_before.get("used_memory", 0)
            
            optimization_results = {
                "memory_before": redis_info_before.get("used_memory_human", "N/A"),
                "operations": []
            }
            
            # 1. Ejecutar BGREWRITEAOF si está habilitado
            try:
                redis_manager.client.bgrewriteaof()
                optimization_results["operations"].append("AOF rewrite initiated")
            except Exception as aof_error:
                optimization_results["operations"].append(f"AOF rewrite failed: {aof_error}")
            
            # 2. Analizar fragmentación de memoria
            try:
                mem_fragmentation_ratio = redis_info_before.get("mem_fragmentation_ratio", 1.0)
                if mem_fragmentation_ratio > 1.5:
                    optimization_results["operations"].append(f"High fragmentation detected: {mem_fragmentation_ratio}")
                    
                    # En producción, se podría considerar MEMORY PURGE (Redis 4.0+)
                    # redis_manager.client.execute_command("MEMORY", "PURGE")
                    
            except Exception as frag_error:
                optimization_results["operations"].append(f"Fragmentation analysis failed: {frag_error}")
            
            # Obtener info después
            redis_info_after = redis_manager.info()
            memory_after = redis_info_after.get("used_memory", 0)
            
            optimization_results["memory_after"] = redis_info_after.get("used_memory_human", "N/A")
            optimization_results["memory_saved"] = max(0, memory_before - memory_after)
            optimization_results["status"] = "completed"
            
            return optimization_results
            
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    async def _fix_data_inconsistencies(self) -> int:
        """
        Corrige inconsistencias en los datos
        """
        try:
            fixed_count = 0
            
            # 1. Verificar TTLs faltantes en claves críticas
            critical_patterns = [
                f"{redis_token_blacklist.TOKEN_PREFIX}*",
                f"{redis_token_blacklist.FAILED_ATTEMPTS_PREFIX}*",
                f"{redis_rate_limiter.RATE_LIMIT_PREFIX}*"
            ]
            
            for pattern in critical_patterns:
                keys = redis_manager.keys(pattern)
                for key in keys:
                    ttl = redis_manager.ttl(key)
                    
                    # Si no tiene TTL (-1) o está a punto de expirar sin sentido
                    if ttl == -1:
                        # Establecer TTL por defecto según el tipo
                        if "token:" in key:
                            redis_manager.expire(key, 24 * 60 * 60)  # 24 horas
                        elif "failed_attempts:" in key:
                            redis_manager.expire(key, 15 * 60)  # 15 minutos
                        elif "rate_limit:" in key:
                            redis_manager.expire(key, 60 * 60)  # 1 hora
                        
                        fixed_count += 1
                        logger.debug(f"TTL corregido para clave: {key}")
            
            # 2. Sincronizar datos entre Redis y MySQL si es necesario
            try:
                from app.utils.token_blacklist import token_blacklist
                
                if hasattr(token_blacklist, 'sync_mysql_to_redis'):
                    sync_results = token_blacklist.sync_mysql_to_redis(hours_back=1)
                    synced_count = sync_results.get("synced_to_redis", 0)
                    if synced_count > 0:
                        fixed_count += synced_count
                        logger.info(f"🔄 Sincronizados {synced_count} tokens de MySQL a Redis")
                        
            except Exception as sync_error:
                logger.warning(f"Error en sincronización MySQL-Redis: {sync_error}")
            
            return fixed_count
            
        except Exception as e:
            logger.error(f"Error corrigiendo inconsistencias: {e}")
            return 0
    
    async def _verify_data_integrity(self) -> Dict[str, Any]:
        """
        Verifica la integridad de los datos en Redis
        """
        try:
            integrity_results = {
                "status": "passed",
                "checks": {},
                "warnings": [],
                "errors": []
            }
            
            # 1. Verificar estructura de sesiones
            session_keys = redis_manager.keys(f"{redis_sessions.SESSION_PREFIX}*")
            valid_sessions = 0
            invalid_sessions = 0
            
            for session_key in session_keys[:100]:  # Muestra de 100
                try:
                    session_data = redis_manager.get(session_key, as_json=True)
                    if session_data and "user_id" in session_data and "created_at" in session_data:
                        valid_sessions += 1
                    else:
                        invalid_sessions += 1
                        
                except Exception:
                    invalid_sessions += 1
            
            integrity_results["checks"]["sessions"] = {
                "total_checked": len(session_keys[:100]),
                "valid": valid_sessions,
                "invalid": invalid_sessions,
                "status": "passed" if invalid_sessions == 0 else "warning"
            }
            
            if invalid_sessions > 0:
                integrity_results["warnings"].append(f"{invalid_sessions} sesiones con formato inválido")
            
            # 2. Verificar rate limiting keys
            rate_limit_keys = redis_manager.keys(f"{redis_rate_limiter.RATE_LIMIT_PREFIX}*")
            rate_limit_issues = 0
            
            for rl_key in rate_limit_keys[:50]:  # Muestra de 50
                try:
                    ttl = redis_manager.ttl(rl_key)
                    if ttl == -1:  # Sin TTL
                        rate_limit_issues += 1
                        
                except Exception:
                    rate_limit_issues += 1
            
            integrity_results["checks"]["rate_limiting"] = {
                "total_checked": len(rate_limit_keys[:50]),
                "issues": rate_limit_issues,
                "status": "passed" if rate_limit_issues == 0 else "warning"
            }
            
            if rate_limit_issues > 0:
                integrity_results["warnings"].append(f"{rate_limit_issues} claves de rate limiting sin TTL")
            
            # 3. Verificar estado general de Redis
            redis_info = redis_manager.info()
            
            # Verificar memoria
            memory_usage = redis_info.get("used_memory", 0)
            max_memory = redis_info.get("maxmemory", 0)
            
            if max_memory > 0:
                memory_percentage = (memory_usage / max_memory) * 100
                if memory_percentage > 90:
                    integrity_results["errors"].append(f"Uso de memoria crítico: {memory_percentage:.1f}%")
                    integrity_results["status"] = "critical"
                elif memory_percentage > 75:
                    integrity_results["warnings"].append(f"Uso de memoria alto: {memory_percentage:.1f}%")
            
            # Verificar clientes conectados
            connected_clients = redis_info.get("connected_clients", 0)
            if connected_clients > 1000:
                integrity_results["warnings"].append(f"Muchos clientes conectados: {connected_clients}")
            
            integrity_results["checks"]["redis_health"] = {
                "memory_used": redis_info.get("used_memory_human"),
                "connected_clients": connected_clients,
                "uptime_seconds": redis_info.get("uptime_in_seconds"),
                "status": "passed"
            }
            
            # Determinar status final
            if integrity_results["errors"]:
                integrity_results["status"] = "failed"
            elif integrity_results["warnings"]:
                integrity_results["status"] = "warning"
            
            return integrity_results
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "checks": {}
            }
    
    async def _generate_health_report(self) -> Dict[str, Any]:
        """
        Genera un reporte de salud del sistema Redis
        """
        try:
            # Obtener estadísticas de todos los componentes
            from app.services.redis_init_service import redis_init
            
            system_status = redis_init.get_system_status()
            
            # Calcular métricas adicionales
            redis_info = redis_manager.info()
            
            health_report = {
                "timestamp": datetime.utcnow().isoformat(),
                "overall_health": "healthy",
                "redis_metrics": {
                    "version": redis_info.get("redis_version"),
                    "uptime_days": redis_info.get("uptime_in_days"),
                    "memory_usage": redis_info.get("used_memory_human"),
                    "peak_memory": redis_info.get("used_memory_peak_human"),
                    "total_commands": redis_info.get("total_commands_processed"),
                    "ops_per_sec": redis_info.get("instantaneous_ops_per_sec"),
                    "keyspace_hits": redis_info.get("keyspace_hits"),
                    "keyspace_misses": redis_info.get("keyspace_misses")
                },
                "component_health": system_status.get("components", {}),
                "recommendations": []
            }
            
            # Agregar recomendaciones basadas en métricas
            hit_ratio = 0
            hits = redis_info.get("keyspace_hits", 0)
            misses = redis_info.get("keyspace_misses", 0)
            
            if hits + misses > 0:
                hit_ratio = hits / (hits + misses) * 100
                
            if hit_ratio < 80:
                health_report["recommendations"].append(
                    f"Hit ratio bajo ({hit_ratio:.1f}%) - considerar optimizar patrones de cache"
                )
                health_report["overall_health"] = "warning"
            
            # Verificar fragmentación de memoria
            fragmentation = redis_info.get("mem_fragmentation_ratio", 1.0)
            if fragmentation > 1.5:
                health_report["recommendations"].append(
                    f"Fragmentación de memoria alta ({fragmentation:.2f}) - considerar restart o MEMORY PURGE"
                )
                health_report["overall_health"] = "warning"
            
            # Verificar número de bases de datos
            total_keys = redis_manager.dbsize()
            if total_keys > 100000:
                health_report["recommendations"].append(
                    f"Muchas claves ({total_keys}) - considerar particionamiento o limpieza"
                )
            
            return health_report
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def get_cleanup_status(self) -> Dict[str, Any]:
        """
        Obtiene el estado de las tareas de limpieza
        """
        now = datetime.utcnow()
        
        return {
            "last_cleanup": self.last_cleanup.isoformat() if self.last_cleanup else None,
            "last_deep_cleanup": self.last_deep_cleanup.isoformat() if self.last_deep_cleanup else None,
            "next_cleanup": (now + timedelta(seconds=self.cleanup_interval)).isoformat(),
            "next_deep_cleanup": (
                (self.last_deep_cleanup + timedelta(seconds=self.deep_cleanup_interval)).isoformat()
                if self.last_deep_cleanup 
                else now.isoformat()
            ),
            "cleanup_interval_hours": self.cleanup_interval / 3600,
            "deep_cleanup_interval_hours": self.deep_cleanup_interval / 3600,
            "redis_available": redis_manager.is_available()
        }


# Instancia global de las tareas de limpieza
redis_cleanup_tasks = RedisCleanupTasks()