# backend/scripts/init_redis.py
#!/usr/bin/env python3
"""
Script de inicialización y configuración de Redis para MediaLab
"""

import sys
import time
import logging
from pathlib import Path

# Añadir el directorio raíz al path para importar módulos de la app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config.redis_config import redis_manager
from app.utils.redis_token_blacklist import redis_token_blacklist
from app.utils.redis_rate_limiter import redis_rate_limiter
from app.config.settings import ENVIRONMENT

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def wait_for_redis(max_attempts: int = 30, delay: int = 2):
    """
    Espera a que Redis esté disponible
    """
    logger.info("🔄 Esperando conexión con Redis...")
    
    for attempt in range(max_attempts):
        try:
            if redis_manager.is_available():
                logger.info("✅ Redis está disponible")
                return True
            else:
                logger.info(f"⏳ Intento {attempt + 1}/{max_attempts} - Redis no disponible")
                time.sleep(delay)
        except Exception as e:
            logger.warning(f"⚠️ Intento {attempt + 1}/{max_attempts} - Error: {e}")
            time.sleep(delay)
    
    logger.error("❌ No se pudo conectar a Redis después de todos los intentos")
    return False

def setup_redis_configuration():
    """
    Configura Redis con las configuraciones necesarias
    """
    try:
        logger.info("🔧 Configurando Redis...")
        
        # Verificar configuración de memoria
        info = redis_manager.info()
        
        # Configuraciones recomendadas para producción
        config_commands = []
        
        if ENVIRONMENT == "production":
            config_commands = [
                # Configuración de memoria
                ("CONFIG", "SET", "maxmemory-policy", "allkeys-lru"),
                ("CONFIG", "SET", "maxmemory", "256mb"),
                
                # Configuración de persistencia
                ("CONFIG", "SET", "appendonly", "yes"),
                ("CONFIG", "SET", "appendfsync", "everysec"),
                
                # Configuración de timeouts
                ("CONFIG", "SET", "timeout", "300"),
                
                # Configuración de logs
                ("CONFIG", "SET", "loglevel", "notice"),
            ]
        else:
            # Configuración para desarrollo
            config_commands = [
                ("CONFIG", "SET", "maxmemory-policy", "allkeys-lru"),
                ("CONFIG", "SET", "maxmemory", "128mb"),
                ("CONFIG", "SET", "timeout", "0"),  # Sin timeout en desarrollo
                ("CONFIG", "SET", "loglevel", "notice"),
            ]
        
        # Aplicar configuraciones
        for cmd in config_commands:
            try:
                redis_manager.client.execute_command(*cmd)
                logger.info(f"✅ Configurado: {cmd[2]} = {cmd[3]}")
            except Exception as config_error:
                logger.warning(f"⚠️ No se pudo configurar {cmd[2]}: {config_error}")
        
        logger.info("✅ Configuración de Redis completada")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error configurando Redis: {e}")
        return False

def initialize_redis_data():
    """
    Inicializa datos básicos en Redis
    """
    try:
        logger.info("🚀 Inicializando datos en Redis...")
        
        # Limpiar datos existentes si estamos en desarrollo
        if ENVIRONMENT == "development":
            logger.info("🧹 Limpiando datos de desarrollo...")
            
            # Limpiar solo datos de la aplicación, no toda la DB
            patterns = [
                "blacklist:*",
                "rate_limit:*",
                "failed_attempts:*",
                "cache:*",
                "session:*"
            ]
            
            for pattern in patterns:
                keys = redis_manager.keys(pattern)
                for key in keys:
                    redis_manager.delete(key)
                logger.info(f"🗑️ Limpiadas {len(keys)} claves con patrón {pattern}")
        
        # Inicializar contadores y estructuras básicas
        initialization_data = {
            "app:initialized": {
                "timestamp": time.time(),
                "environment": ENVIRONMENT,
                "version": "1.0.0"
            },
            "stats:app_starts": 1,
            "config:rate_limits": {
                "default_requests": 60,
                "default_window": 60,
                "strict_requests": 10,
                "strict_window": 60
            }
        }
        
        for key, value in initialization_data.items():
            if key == "stats:app_starts":
                # Incrementar contador de inicios
                redis_manager.incr(key)
            else:
                redis_manager.set(key, value, expire=86400)  # 24 horas
        
        # Verificar que los sistemas estén funcionando
        logger.info("🔍 Verificando sistemas...")
        
        # Test del sistema de blacklist
        if redis_token_blacklist.enabled:
            stats = redis_token_blacklist.get_stats()
            logger.info(f"✅ Sistema de blacklist: {stats.get('storage', 'unknown')}")
        
        # Test del sistema de rate limiting
        if redis_rate_limiter.enabled:
            stats = redis_rate_limiter.get_stats()
            logger.info(f"✅ Sistema de rate limiting: {stats.get('storage', 'unknown')}")
        
        logger.info("✅ Inicialización de datos completada")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error inicializando datos: {e}")
        return False

def verify_redis_health():
    """
    Verifica que Redis esté funcionando correctamente
    """
    try:
        logger.info("🏥 Verificando salud de Redis...")
        
        # Test básico de conectividad
        redis_manager.client.ping()
        logger.info("✅ Ping exitoso")
        
        # Test de escritura/lectura
        test_key = "health_check_test"
        test_value = {"timestamp": time.time(), "test": True}
        
        redis_manager.set(test_key, test_value, expire=60)
        retrieved_value = redis_manager.get(test_key, as_json=True)
        
        if retrieved_value and retrieved_value.get("test") == True:
            logger.info("✅ Test de escritura/lectura exitoso")
            redis_manager.delete(test_key)
        else:
            logger.error("❌ Test de escritura/lectura falló")
            return False
        
        # Test de TTL
        ttl_test_key = "ttl_test"
        redis_manager.set(ttl_test_key, "test", expire=5)
        ttl = redis_manager.ttl(ttl_test_key)
        
        if 0 < ttl <= 5:
            logger.info("✅ Test de TTL exitoso")
            redis_manager.delete(ttl_test_key)
        else:
            logger.error(f"❌ Test de TTL falló: TTL = {ttl}")
            return False
        
        # Información del servidor
        info = redis_manager.info()
        logger.info(f"📊 Redis {info.get('redis_version')} - Memoria: {info.get('used_memory_human')}")
        logger.info(f"📊 Clientes conectados: {info.get('connected_clients')}")
        logger.info(f"📊 Total de claves: {redis_manager.dbsize()}")
        
        logger.info("✅ Verificación de salud completada")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error en verificación de salud: {e}")
        return False

def create_redis_indexes():
    """
    Crea índices y estructuras optimizadas en Redis si es necesario
    """
    try:
        logger.info("📋 Creando estructuras optimizadas...")
        
        # Para rate limiting, no necesitamos índices especiales
        # Redis maneja automáticamente los sorted sets
        
        # Crear estructura para estadísticas globales
        stats_key = "global_stats"
        if not redis_manager.exists(stats_key):
            global_stats = {
                "total_requests": 0,
                "blocked_requests": 0,
                "blacklisted_tokens": 0,
                "active_users": 0,
                "last_reset": time.time()
            }
            redis_manager.set(stats_key, global_stats)
            logger.info("✅ Estadísticas globales inicializadas")
        
        # Crear estructura para configuraciones dinámicas
        config_key = "dynamic_config"
        if not redis_manager.exists(config_key):
            dynamic_config = {
                "maintenance_mode": False,
                "rate_limit_multiplier": 1.0,
                "security_level": "normal",
                "last_updated": time.time()
            }
            redis_manager.set(config_key, dynamic_config)
            logger.info("✅ Configuración dinámica inicializada")
        
        logger.info("✅ Estructuras optimizadas creadas")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error creando estructuras: {e}")
        return False

def sync_mysql_to_redis():
    """
    Sincroniza datos relevantes de MySQL a Redis al inicio
    """
    try:
        logger.info("🔄 Sincronizando datos de MySQL a Redis...")
        
        # Sincronizar blacklist activa
        from app.utils.token_blacklist import token_blacklist
        
        if hasattr(token_blacklist, 'sync_mysql_to_redis'):
            sync_result = token_blacklist.sync_mysql_to_redis(hours_back=24)
            
            if "error" not in sync_result:
                logger.info(
                    f"✅ Sincronizados {sync_result.get('synced_to_redis', 0)} "
                    f"de {sync_result.get('total_mysql_tokens', 0)} tokens"
                )
            else:
                logger.warning(f"⚠️ Error en sincronización: {sync_result['error']}")
        
        logger.info("✅ Sincronización completada")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error en sincronización: {e}")
        return False

def setup_redis_monitoring():
    """
    Configura monitoreo básico de Redis
    """
    try:
        logger.info("📊 Configurando monitoreo...")
        
        # Crear alertas básicas
        monitoring_config = {
            "memory_threshold": 0.8,  # 80% de memoria
            "connection_threshold": 100,
            "latency_threshold": 10,  # ms
            "last_check": time.time()
        }
        
        redis_manager.set("monitoring:config", monitoring_config, expire=86400)
        
        # Inicializar métricas
        metrics = {
            "startup_time": time.time(),
            "total_operations": 0,
            "errors": 0,
            "last_error": None
        }
        
        redis_manager.set("monitoring:metrics", metrics, expire=86400)
        
        logger.info("✅ Monitoreo configurado")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error configurando monitoreo: {e}")
        return False

def main():
    """
    Función principal de inicialización
    """
    logger.info("🚀 Iniciando configuración de Redis para MediaLab")
    
    # Paso 1: Esperar a que Redis esté disponible
    if not wait_for_redis():
        logger.error("❌ No se pudo conectar a Redis. Abortando inicialización.")
        sys.exit(1)
    
    # Paso 2: Configurar Redis
    if not setup_redis_configuration():
        logger.error("❌ Error en configuración de Redis")
        sys.exit(1)
    
    # Paso 3: Verificar salud
    if not verify_redis_health():
        logger.error("❌ Redis no pasó las verificaciones de salud")
        sys.exit(1)
    
    # Paso 4: Crear estructuras
    if not create_redis_indexes():
        logger.error("❌ Error creando estructuras")
        sys.exit(1)
    
    # Paso 5: Inicializar datos
    if not initialize_redis_data():
        logger.error("❌ Error inicializando datos")
        sys.exit(1)
    
    # Paso 6: Sincronizar desde MySQL
    if not sync_mysql_to_redis():
        logger.warning("⚠️ Problemas en sincronización (continuando)")
    
    # Paso 7: Configurar monitoreo
    if not setup_redis_monitoring():
        logger.warning("⚠️ Problemas configurando monitoreo (continuando)")
    
    # Resumen final
    try:
        info = redis_manager.info()
        total_keys = redis_manager.dbsize()
        
        logger.info("="*50)
        logger.info("🎉 INICIALIZACIÓN DE REDIS COMPLETADA")
        logger.info("="*50)
        logger.info(f"📊 Redis {info.get('redis_version')}")
        logger.info(f"💾 Memoria usada: {info.get('used_memory_human')}")
        logger.info(f"🔑 Total de claves: {total_keys}")
        logger.info(f"🌍 Entorno: {ENVIRONMENT}")
        logger.info(f"⚡ Blacklist: {'✅' if redis_token_blacklist.enabled else '❌'}")
        logger.info(f"🚦 Rate Limiting: {'✅' if redis_rate_limiter.enabled else '❌'}")
        logger.info("="*50)
        
        # Crear marcador de inicialización exitosa
        redis_manager.set(
            "initialization:success", 
            {
                "timestamp": time.time(),
                "environment": ENVIRONMENT,
                "version": "1.0.0",
                "total_keys": total_keys
            },
            expire=86400
        )
        
        logger.info("✅ Redis listo para MediaLab!")
        
    except Exception as e:
        logger.error(f"❌ Error en resumen final: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()