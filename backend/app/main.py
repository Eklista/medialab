# backend/app/main.py - VERSIÓN COMPLETA CON WEBSOCKET INTEGRADO
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
import logging
import os
from pathlib import Path
from datetime import datetime

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Importaciones de configuración
from app.config.settings import CORS_ORIGINS, ENVIRONMENT, REDIS_ENABLED
from app.config.settings import settings

# ===== IMPORTACIONES WEBSOCKET CORREGIDAS =====
try:
    logger.info("🔍 Iniciando importación de módulos WebSocket...")
    
    logger.debug("🔍 Importando websocket_config...")
    from app.config.websocket_config import is_websocket_enabled, get_websocket_config
    logger.debug("✅ websocket_config importado correctamente")
    
    logger.debug("🔍 Importando websocket_routes...")
    from app.routes.websocket_routes import router as websocket_router, admin_router as websocket_admin_router
    logger.debug("✅ websocket_routes importado correctamente")
    
    logger.debug("🔍 Importando websocket_manager...")
    from app.services.websocket.websocket_manager import websocket_manager
    logger.debug("✅ websocket_manager importado correctamente")
    
    logger.debug("🔍 Importando notification_service...")
    from app.services.websocket.notification_service import initialize_websocket_notifications
    logger.debug("✅ notification_service importado correctamente")
    
    WEBSOCKET_AVAILABLE = True
    logger.info("✅ Todos los módulos WebSocket disponibles")
    
except ImportError as e:
    WEBSOCKET_AVAILABLE = False
    logger.error(f"❌ Error importando módulos WebSocket: {e}")
    
    # Logging detallado para debugging
    import traceback
    logger.error(f"Traceback completo del error de importación:")
    logger.error(traceback.format_exc())
    
    # Intentar identificar qué módulo específico está fallando
    try:
        from app.config.websocket_config import is_websocket_enabled
        logger.info("✅ app.config.websocket_config - OK")
    except ImportError as config_error:
        logger.error(f"❌ app.config.websocket_config - FALLO: {config_error}")
    
    try:
        from app.routes.websocket_routes import router
        logger.info("✅ app.routes.websocket_routes - OK")
    except ImportError as routes_error:
        logger.error(f"❌ app.routes.websocket_routes - FALLO: {routes_error}")
    
    try:
        from app.services.websocket.websocket_manager import websocket_manager
        logger.info("✅ app.services.websocket.websocket_manager - OK")
    except ImportError as manager_error:
        logger.error(f"❌ app.services.websocket.websocket_manager - FALLO: {manager_error}")
    
    try:
        from app.services.websocket.notification_service import initialize_websocket_notifications
        logger.info("✅ app.services.websocket.notification_service - OK")
    except ImportError as notification_error:
        logger.error(f"❌ app.services.websocket.notification_service - FALLO: {notification_error}")

except Exception as e:
    WEBSOCKET_AVAILABLE = False
    logger.error(f"❌ Error inesperado cargando módulos WebSocket: {e}")
    import traceback
    logger.error(traceback.format_exc())

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestión del ciclo de vida de la aplicación con WebSocket integrado"""
    # ===== STARTUP =====
    logger.info("🚀 Iniciando MediaLab API...")
    
    # ===== INICIALIZACIÓN REDIS (CÓDIGO ORIGINAL) =====
    if REDIS_ENABLED:
        try:
            logger.info("🔧 Inicializando sistema Redis...")
            from app.services.system.redis_init_service import redis_init
            from app.tasks.redis_cleanup_tasks import redis_cleanup_tasks
            
            redis_init_results = await redis_init.initialize_redis_system()
            
            if redis_init_results["status"] == "success":
                logger.info("✅ Sistema Redis inicializado exitosamente")
                if ENVIRONMENT != "testing":
                    cleanup_task = asyncio.create_task(redis_cleanup_tasks.run_periodic_cleanup())
                    app.state.cleanup_task = cleanup_task
                    logger.info("🧹 Tareas de limpieza Redis iniciadas")
            elif redis_init_results["status"] == "warning":
                logger.warning(f"⚠️ Sistema Redis inicializado con advertencias")
                for warning in redis_init_results.get("warnings", []):
                    logger.warning(f"   - {warning}")
            else:
                logger.error(f"❌ Error inicializando Redis: {redis_init_results.get('errors', [])}")
        except ImportError as e:
            logger.warning(f"⚠️ Servicios Redis no disponibles: {e}")
        except Exception as e:
            logger.error(f"❌ Error crítico en inicialización Redis: {e}")
    else:
        logger.info("⚠️ Redis deshabilitado en configuración")
    
    # ===== NUEVA SECCIÓN: INICIALIZACIÓN WEBSOCKET =====
    if WEBSOCKET_AVAILABLE and is_websocket_enabled():
        try:
            logger.info("🔌 Inicializando servicios WebSocket...")
            
            # Verificar configuración
            ws_config = get_websocket_config()
            
            logger.info(f"🔌 WebSocket configurado:")
            logger.info(f"   - Host: {ws_config.websocket_host}:{ws_config.websocket_port}")
            logger.info(f"   - Max conexiones por usuario: {ws_config.max_connections_per_user}")
            logger.info(f"   - Max conexiones totales: {ws_config.max_total_connections}")
            logger.info(f"   - Autenticación requerida: {ws_config.require_authentication}")
            logger.info(f"   - Orígenes permitidos: {ws_config.allowed_origins}")
            
            # Inicializar sistema de notificaciones
            notifications_initialized = await initialize_websocket_notifications()
            if notifications_initialized:
                logger.info("✅ Sistema de notificaciones WebSocket inicializado")
            else:
                logger.warning("⚠️ Sistema de notificaciones WebSocket no pudo inicializarse")
            
            # Almacenar referencia en app state para limpieza posterior
            app.state.websocket_manager = websocket_manager
            app.state.websocket_enabled = True
            
            logger.info("✅ Servicios WebSocket inicializados")
            
        except Exception as e:
            logger.error(f"❌ Error inicializando WebSocket: {e}")
            logger.warning("⚠️ La aplicación continuará sin WebSocket")
            app.state.websocket_enabled = False
    else:
        app.state.websocket_enabled = False
        if not WEBSOCKET_AVAILABLE:
            logger.info("🔌 WebSocket no disponible (módulos no encontrados)")
        else:
            logger.info("🔌 WebSocket deshabilitado en configuración")
    
    logger.info("✅ MediaLab API iniciada correctamente")
    yield
    
    # ===== SHUTDOWN =====
    logger.info("🛑 Cerrando MediaLab API...")
    
    # ===== CLEANUP REDIS (CÓDIGO ORIGINAL) =====
    if hasattr(app.state, 'cleanup_task'):
        app.state.cleanup_task.cancel()
        try:
            await app.state.cleanup_task
        except asyncio.CancelledError:
            pass
        logger.info("🧹 Tareas de limpieza Redis detenidas")

    # ===== CLEANUP WEBSOCKET CORREGIDO =====
    if hasattr(app.state, 'websocket_manager') and app.state.websocket_enabled and app.state.websocket_manager:
        try:
            logger.info("🔌 Cerrando servicios WebSocket...")
            
            # Usar el método shutdown del manager
            await app.state.websocket_manager.shutdown()
            
            logger.info("✅ Servicios WebSocket cerrados correctamente")
            
        except Exception as e:
            logger.error(f"❌ Error cerrando WebSocket: {e}")
    
    logger.info("👋 MediaLab API cerrada correctamente")

# Crear directorios de uploads al inicio
settings.ensure_upload_dirs()

# Crear aplicación con lifespan
app = FastAPI(
    title="MediaLab API",
    description="API para gestión de MediaLab con sistema de autenticación seguro y WebSocket",
    version="2.0.0",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs",
    lifespan=lifespan
)

# ===== FIX ESPECÍFICO PARA CORS OPTIONS (CÓDIGO ORIGINAL) =====

# 1. Handler manual para OPTIONS requests (antes de CORS middleware)
@app.middleware("http")
async def cors_preflight_handler(request: Request, call_next):
    """
    🔥 FIX: Maneja OPTIONS requests antes que lleguen al CORS middleware
    """
    if request.method == "OPTIONS":
        logger.info(f"🔧 Manejando OPTIONS request para: {request.url.path}")
        
        # Headers CORS permisivos para OPTIONS
        headers = {
            "Access-Control-Allow-Origin": "*",  # Temporal para debug
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "3600"
        }
        
        return Response(status_code=200, headers=headers)
    
    response = await call_next(request)
    return response

@app.middleware("http")
async def websocket_debug_middleware(request: Request, call_next):
    """
    Middleware específico para debugging de WebSocket
    """
    if request.url.path.startswith("/ws"):
        logger.info(f"🔍 WebSocket request: {request.method} {request.url.path}")
        logger.info(f"🔍 Headers: {dict(request.headers)}")
        logger.info(f"🔍 Query params: {dict(request.query_params)}")
        
        # Log de cookies para debugging
        if "cookie" in request.headers:
            cookies = request.headers["cookie"]
            logger.info(f"🍪 Cookies: {cookies[:100]}...")  # Solo primeros 100 chars
    
    response = await call_next(request)
    
    if request.url.path.startswith("/ws"):
        logger.info(f"🔍 WebSocket response: {response.status_code}")
    
    return response
    
# 2. Configuración CORS standard (después del middleware manual)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173", 
        "http://127.0.0.1:3000",
        "https://medialab.eklista.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

logger.info("🌐 CORS configurado con handler manual para OPTIONS")

# ===== MIDDLEWARE DE SEGURIDAD (CÓDIGO ORIGINAL) =====

# Rate Limiting Middleware (solo si Redis está habilitado)
if REDIS_ENABLED:
    try:
        from app.middleware.rate_limit_middleware import RateLimitMiddleware
        
        app.add_middleware(
            RateLimitMiddleware,
            calls_limit=30000,        # 30K requests por usuario en 15 min
            period=900,               # 15 minutos
            prefer_user_based=True,   # Priorizar rate limiting por usuario
            exclude_paths=[
                "/docs", "/redoc", "/openapi.json", 
                "/health", "/favicon.ico",
                "/api/v1/docs", "/api/v1/openapi.json",
                "/ws", "/ws/", "/ws/secure", "/ws/test",
                "/ws/status", "/ws/health", "/ws/debug/info",
                "/ws/admin", "/ws/admin/", "/ws/admin/stats"
            ]
        )
        logger.info("✅ Rate limiting middleware cargado con exclusiones WebSocket")
        
    except ImportError as e:
        logger.warning(f"⚠️ Rate limiting middleware no disponible: {e}")
    except Exception as e:
        logger.error(f"❌ Error cargando rate limiting middleware: {e}")


# Security Headers Middleware (opcional)
try:
    from app.middleware.security_headers import SecurityHeadersMiddleware
    app.add_middleware(SecurityHeadersMiddleware, enable_security_headers=True)
    logger.info("✅ Security headers middleware cargado")
except ImportError:
    logger.info("⚠️ Security headers middleware no disponible")
except Exception as e:
    logger.warning(f"⚠️ Error cargando security headers middleware: {e}")

# ===== CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS (CÓDIGO ORIGINAL) =====

# Crear directorio de uploads si no existe
static_dir = Path("static")
uploads_dir = static_dir / "uploads" / "users"
uploads_dir.mkdir(parents=True, exist_ok=True)

# Montar directorio estático para servir archivos
app.mount(
    "/static/uploads", 
    StaticFiles(directory=str(settings.upload_base_path)), 
    name="uploads"
)

# Mantener el directorio static interno para otros archivos
static_dir = Path("static")
static_dir.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

logger.info(f"📁 Uploads externos en: {settings.upload_base_path}")
logger.info(f"📁 Static interno en: {static_dir.absolute()}")

# ===== ROUTERS =====

# Incluir el router principal de la API (CÓDIGO ORIGINAL)
try:
    from app.api.v1 import api_router
    app.include_router(api_router, prefix="/api/v1")
    logger.info("✅ API routers cargados")
except ImportError as e:
    logger.error(f"❌ Error cargando API routers: {e}")

# ===== NUEVA SECCIÓN: ROUTERS WEBSOCKET =====
if WEBSOCKET_AVAILABLE and is_websocket_enabled():
    try:
        # Router principal de WebSocket
        app.include_router(websocket_router, prefix="/ws", tags=["websocket"])
        
        # Router administrativo de WebSocket
        app.include_router(websocket_admin_router, prefix="/ws/admin", tags=["websocket-admin"])
        
        logger.info("✅ WebSocket routers cargados correctamente")
        logger.info("   - Endpoint principal: ws://localhost:8000/ws/")
        logger.info("   - Endpoint seguro: ws://localhost:8000/ws/secure")
        logger.info("   - Admin endpoints: /ws/admin/*")
        
    except Exception as e:
        logger.error(f"❌ Error cargando WebSocket routers: {e}")
        logger.error(f"Detalles: {traceback.format_exc()}")
else:
    if not WEBSOCKET_AVAILABLE:
        logger.info("⚠️ WebSocket routers no cargados (módulos no disponibles)")
    else:
        logger.info("⚠️ WebSocket routers no cargados (deshabilitado en configuración)")

# ===== ENDPOINTS DE SISTEMA (CÓDIGO ORIGINAL + WEBSOCKET) =====

@app.get("/")
def root():
    """Endpoint raíz de la API con información de WebSocket"""
    features = {
        "redis_enabled": REDIS_ENABLED,
        "security": "enhanced",
        "authentication": "JWT/JWE with httpOnly cookies"
    }
    
    # Agregar información de WebSocket
    if WEBSOCKET_AVAILABLE:
        features["websocket"] = {
            "available": True,
            "enabled": is_websocket_enabled(),
            "real_time_notifications": True
        }
    else:
        features["websocket"] = {
            "available": False,
            "reason": "modules_not_found"
        }
    
    websocket_info = None
    if WEBSOCKET_AVAILABLE and is_websocket_enabled():
        websocket_info = {
            "main": "ws://localhost:8000/ws/",
            "secure": "ws://localhost:8000/ws/secure",
            "status": "/system/websocket/status",
            "admin": "/ws/admin/stats"
        }
    
    return {
        "message": "MediaLab API está funcionando",
        "version": "2.0.0",
        "environment": ENVIRONMENT,
        "features": features,
        "websocket_endpoints": websocket_info
    }

@app.get("/health")
def health_check():
    """Endpoint de salud básico (ORIGINAL)"""
    return {
        "status": "healthy",
        "environment": ENVIRONMENT,
        "redis_enabled": REDIS_ENABLED,
        "websocket_enabled": WEBSOCKET_AVAILABLE and is_websocket_enabled() if WEBSOCKET_AVAILABLE else False,
        "cors_debug": "OPTIONS handler active"
    }

# ===== NUEVA SECCIÓN: ENDPOINTS WEBSOCKET =====

@app.get("/system/websocket/status")
async def get_websocket_system_status():
    """Estado del sistema WebSocket - VERSIÓN CORREGIDA"""
    if not WEBSOCKET_AVAILABLE:
        return {
            "available": False,
            "enabled": False,
            "reason": "Modules not available",
            "details": "Los módulos WebSocket no pudieron ser importados. Revisa los logs para más detalles."
        }
    
    try:
        websocket_enabled = is_websocket_enabled()
        
        if not websocket_enabled:
            return {
                "available": True,
                "enabled": False,
                "reason": "Disabled in configuration",
                "config_check": "WebSocket está deshabilitado en websocket_config.py"
            }
        
        # Verificar estado del manager
        if not hasattr(app.state, 'websocket_manager') or not app.state.websocket_manager:
            return {
                "available": True,
                "enabled": True,
                "status": "error",
                "reason": "Manager not initialized",
                "details": "El WebSocket Manager no se inicializó correctamente"
            }
        
        # Obtener estadísticas del controller
        try:
            from app.controllers.websocket.websocket_controller import websocket_controller
            stats = websocket_controller.get_connection_stats()
            
            return {
                "available": True,
                "enabled": True,
                "status": "operational",
                "stats": stats,
                "manager_state": {
                    "initialized": True,
                    "active_connections": len(app.state.websocket_manager.active_connections),
                    "active_rooms": len(app.state.websocket_manager.rooms),
                    "background_tasks_running": {
                        "cleanup": app.state.websocket_manager._cleanup_task is not None,
                        "heartbeat": app.state.websocket_manager._heartbeat_task is not None
                    }
                },
                "endpoints": {
                    "websocket": "ws://localhost:8000/ws/",
                    "websocket_secure": "ws://localhost:8000/ws/secure",
                    "admin_status": "/ws/admin/stats",
                    "health": "/ws/health"
                }
            }
            
        except Exception as controller_error:
            logger.error(f"Error obteniendo stats del controller: {controller_error}")
            return {
                "available": True,
                "enabled": True,
                "status": "partial_error",
                "reason": "Controller error",
                "error": str(controller_error),
                "manager_available": app.state.websocket_manager is not None
            }
        
    except Exception as e:
        logger.error(f"Error en websocket status endpoint: {e}")
        return {
            "available": True,
            "enabled": True,
            "status": "error",
            "error": str(e)
        }

@app.get("/system/websocket/config")
async def get_websocket_config_info():
    """Información de configuración WebSocket (no sensible) - VERSIÓN CORREGIDA"""
    if not WEBSOCKET_AVAILABLE:
        return {"error": "WebSocket modules not available"}
    
    try:
        websocket_enabled = is_websocket_enabled()
        
        if not websocket_enabled:
            return {"error": "WebSocket disabled in configuration"}
        
        config = get_websocket_config()
        
        # Solo devolver información no sensible
        return {
            "enabled": config.websocket_enabled,
            "host": config.websocket_host,
            "port": config.websocket_port,
            "max_connections_per_user": config.max_connections_per_user,
            "max_total_connections": config.max_total_connections,
            "heartbeat_interval": config.heartbeat_interval,
            "connection_timeout": config.connection_timeout,
            "max_message_size": config.max_message_size,
            "require_authentication": config.require_authentication,
            "development_mode": config.development_mode,
            "allowed_origins": config.allowed_origins,
            "logging": {
                "log_connections": config.log_connections,
                "log_messages": config.log_messages
            }
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo configuración WebSocket: {e}")
        return {"error": f"Error getting WebSocket config: {str(e)}"}

@app.get("/health/complete")
async def complete_health_check():
    """Health check completo incluyendo WebSocket - VERSIÓN CORREGIDA"""
    health_data = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": ENVIRONMENT,
        "services": {
            "api": "healthy",
            "redis": {
                "enabled": REDIS_ENABLED,
                "status": "unknown"  # Se puede mejorar con verificación real
            },
            "websocket": {
                "available": WEBSOCKET_AVAILABLE,
                "enabled": False,
                "status": "unavailable"
            }
        }
    }
    
    # Verificar WebSocket si está disponible
    if WEBSOCKET_AVAILABLE:
        try:
            websocket_enabled = is_websocket_enabled()
            health_data["services"]["websocket"]["enabled"] = websocket_enabled
            
            if websocket_enabled and hasattr(app.state, 'websocket_manager') and app.state.websocket_manager:
                from app.controllers.websocket.websocket_controller import websocket_controller
                ws_stats = websocket_controller.get_connection_stats()
                
                health_data["services"]["websocket"] = {
                    "available": True,
                    "enabled": True,
                    "status": "healthy",
                    "active_connections": ws_stats["manager_stats"]["active_connections"],
                    "total_connections": ws_stats["manager_stats"]["total_connections"],
                    "uptime_seconds": ws_stats["manager_stats"]["uptime_seconds"],
                    "unique_users": ws_stats["manager_stats"].get("unique_users", 0),
                    "active_rooms": ws_stats["manager_stats"].get("active_rooms", 0)
                }
            elif websocket_enabled:
                health_data["services"]["websocket"] = {
                    "available": True,
                    "enabled": True,
                    "status": "error",
                    "reason": "Manager not initialized"
                }
            else:
                health_data["services"]["websocket"]["status"] = "disabled"
                health_data["services"]["websocket"]["reason"] = "disabled_in_config"
            
        except Exception as e:
            logger.error(f"Error en health check de WebSocket: {e}")
            health_data["services"]["websocket"] = {
                "available": True,
                "enabled": True,
                "status": "error",
                "error": str(e)
            }
    
    return health_data

@app.get("/debug/websocket")
async def debug_websocket_status():
    """Endpoint de debugging para WebSocket - SOLO DESARROLLO"""
    if ENVIRONMENT == "production":
        raise HTTPException(status_code=404, detail="Not found")
    
    debug_info = {
        "websocket_available": WEBSOCKET_AVAILABLE,
        "import_attempts": {},
        "app_state": {},
        "config_check": {}
    }
    
    # Verificar importaciones individuales
    modules_to_check = [
        ("websocket_config", "app.config.websocket_config"),
        ("websocket_routes", "app.routes.websocket_routes"),
        ("websocket_manager", "app.services.websocket.websocket_manager"),
        ("websocket_controller", "app.controllers.websocket.websocket_controller"),
        ("notification_service", "app.services.websocket.notification_service")
    ]
    
    for module_name, module_path in modules_to_check:
        try:
            __import__(module_path)
            debug_info["import_attempts"][module_name] = "SUCCESS"
        except ImportError as e:
            debug_info["import_attempts"][module_name] = f"FAILED: {str(e)}"
        except Exception as e:
            debug_info["import_attempts"][module_name] = f"ERROR: {str(e)}"
    
    # Verificar estado de la app
    debug_info["app_state"] = {
        "websocket_enabled": getattr(app.state, 'websocket_enabled', False),
        "websocket_manager_exists": hasattr(app.state, 'websocket_manager'),
        "websocket_manager_initialized": getattr(app.state, 'websocket_manager', None) is not None
    }
    
    # Verificar configuración si es posible
    if WEBSOCKET_AVAILABLE:
        try:
            config = get_websocket_config()
            debug_info["config_check"] = {
                "config_loaded": True,
                "enabled": config.websocket_enabled,
                "host": config.websocket_host,
                "port": config.websocket_port
            }
        except Exception as e:
            debug_info["config_check"] = {
                "config_loaded": False,
                "error": str(e)
            }
    
    return debug_info

# ===== ENDPOINTS REDIS (CÓDIGO ORIGINAL) =====

if REDIS_ENABLED:
    @app.get("/system/redis/status")
    async def get_redis_system_status():
        try:
            from app.services.system.redis_init_service import redis_init
            return redis_init.get_system_status()
        except ImportError:
            return {"error": "Servicios Redis no disponibles"}
        except Exception as e:
            return {"error": f"Error obteniendo estado de Redis: {str(e)}"}

    @app.get("/system/redis/cleanup/status")
    async def get_cleanup_status():
        try:
            from app.tasks.redis_cleanup_tasks import redis_cleanup_tasks
            return redis_cleanup_tasks.get_cleanup_status()
        except ImportError:
            return {"error": "Servicios de limpieza Redis no disponibles"}
        except Exception as e:
            return {"error": f"Error obteniendo estado de limpieza: {str(e)}"}

    @app.post("/system/redis/cleanup/manual")
    async def manual_cleanup():
        if ENVIRONMENT == "production":
            raise HTTPException(status_code=403, detail="No disponible en producción")
        
        try:
            from app.tasks.redis_cleanup_tasks import redis_cleanup_tasks
            cleanup_results = await redis_cleanup_tasks.perform_cleanup()
            return cleanup_results
        except ImportError:
            return {"error": "Servicios de limpieza Redis no disponibles"}
        except Exception as e:
            return {"error": f"Error en limpieza manual: {str(e)}"}

@app.get("/health/redis")
async def redis_health_check():
    """Endpoint específico de salud para Redis (CÓDIGO ORIGINAL)"""
    if not REDIS_ENABLED:
        return {"redis_enabled": False, "status": "disabled"}
    
    try:
        from app.config.redis_config import redis_manager
        
        redis_status = {
            "redis_enabled": True,
            "redis_available": redis_manager.is_available()
        }
        
        if redis_manager.is_available():
            redis_manager.client.ping()
            redis_status["ping"] = "successful"
            redis_status["status"] = "healthy"
        else:
            redis_status["status"] = "unavailable"
            
        return redis_status
        
    except ImportError:
        return {"redis_enabled": True, "status": "services_not_available"}
    except Exception as e:
        return {
            "redis_enabled": True, 
            "status": "error", 
            "error": str(e)
        }

# ===== CONFIGURACIÓN PARA DESARROLLO (CÓDIGO ORIGINAL) =====

if __name__ == "__main__":
    import uvicorn
    
    # Configuración específica para WebSocket
    uvicorn_config = {
        "host": "0.0.0.0",
        "port": 8000,
        "reload": True if ENVIRONMENT == "development" else False,
        "log_level": "info"
    }
    
    # Si WebSocket está habilitado, asegurar configuración compatible
    if WEBSOCKET_AVAILABLE and is_websocket_enabled():
        logger.info("🔌 Iniciando servidor con soporte WebSocket")
        uvicorn_config["ws"] = "websockets"  # Asegurar soporte WebSocket
    
    uvicorn.run("main:app", **uvicorn_config)