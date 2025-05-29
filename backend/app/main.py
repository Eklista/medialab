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

# ===== IMPORTACIONES WEBSOCKET =====
try:
    from app.config.websocket_config import is_websocket_enabled, get_websocket_config
    from app.routes.websocket_routes import router as websocket_router, admin_router as websocket_admin_router
    from app.services.websocket.websocket_manager import websocket_manager
    from app.services.websocket.notification_service import initialize_websocket_notifications
    WEBSOCKET_AVAILABLE = True
    logger.info("✅ Módulos WebSocket disponibles")
except ImportError as e:
    WEBSOCKET_AVAILABLE = False
    logger.warning(f"⚠️ Módulos WebSocket no disponibles: {e}")

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
    
    # ===== NUEVA SECCIÓN: CLEANUP WEBSOCKET =====
    if hasattr(app.state, 'websocket_manager') and app.state.websocket_enabled:
        try:
            logger.info("🔌 Cerrando conexiones WebSocket...")
            
            # Enviar notificación de cierre del servidor
            try:
                await app.state.websocket_manager.broadcast_to_all({
                    "type": "server_shutdown",
                    "data": {
                        "message": "El servidor se está cerrando",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                })
                # Dar tiempo para que llegue el mensaje
                await asyncio.sleep(1)
            except:
                pass  # Ignorar errores al enviar notificación de cierre
            
            # Desconectar todas las conexiones activas
            active_connections = list(app.state.websocket_manager.active_connections.keys())
            for connection_id in active_connections:
                app.state.websocket_manager.disconnect(connection_id, 1001, "Server shutdown")
            
            logger.info(f"🔌 {len(active_connections)} conexiones WebSocket cerradas")
            
        except Exception as e:
            logger.error(f"❌ Error cerrando WebSocket: {e}")
    
    logger.info("👋 MediaLab API cerrada correctamente")

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
                "/ws", "/ws/", "/ws/secure"  # Excluir endpoints WebSocket
            ]
        )
        logger.info("✅ Rate limiting middleware cargado")
        
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
app.mount("/static", StaticFiles(directory="static"), name="static")

logger.info(f"📁 Archivos estáticos configurados en: {static_dir.absolute()}")
logger.info(f"📁 Directorio de uploads: {uploads_dir.absolute()}")

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
        
        logger.info("✅ WebSocket routers cargados")
        logger.info("   - Endpoint principal: ws://localhost:8000/ws/")
        logger.info("   - Endpoint seguro: ws://localhost:8000/ws/secure")
        logger.info("   - Admin endpoints: /ws/admin/*")
        
    except Exception as e:
        logger.error(f"❌ Error cargando WebSocket routers: {e}")
else:
    logger.info("⚠️ WebSocket routers no cargados (deshabilitado o no disponible)")

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
    """Estado del sistema WebSocket"""
    if not WEBSOCKET_AVAILABLE:
        return {
            "available": False,
            "enabled": False,
            "reason": "Modules not available"
        }
    
    if not is_websocket_enabled():
        return {
            "available": True,
            "enabled": False,
            "reason": "Disabled in configuration"
        }
    
    try:
        from app.controllers.websocket.websocket_controller import websocket_controller
        stats = websocket_controller.get_connection_stats()
        
        return {
            "available": True,
            "enabled": True,
            "status": "operational",
            "stats": stats,
            "endpoints": {
                "websocket": "ws://localhost:8000/ws/",
                "websocket_secure": "ws://localhost:8000/ws/secure",
                "admin_status": "/ws/status",
                "admin_health": "/ws/health"
            }
        }
        
    except Exception as e:
        return {
            "available": True,
            "enabled": True,
            "status": "error",
            "error": str(e)
        }

@app.get("/system/websocket/config")
async def get_websocket_config_info():
    """Información de configuración WebSocket (no sensible)"""
    if not WEBSOCKET_AVAILABLE:
        return {"error": "WebSocket modules not available"}
    
    if not is_websocket_enabled():
        return {"error": "WebSocket disabled"}
    
    try:
        config = get_websocket_config()
        
        # Solo devolver información no sensible
        return {
            "enabled": config.websocket_enabled,
            "host": config.websocket_host,
            "port": config.websocket_port,
            "max_connections_per_user": config.max_connections_per_user,
            "max_total_connections": config.max_total_connections,
            "heartbeat_interval": config.heartbeat_interval,
            "require_authentication": config.require_authentication,
            "development_mode": config.development_mode,
            "allowed_origins": config.allowed_origins
        }
        
    except Exception as e:
        return {"error": f"Error getting WebSocket config: {str(e)}"}

@app.get("/health/complete")
async def complete_health_check():
    """Health check completo incluyendo WebSocket"""
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
                "enabled": is_websocket_enabled() if WEBSOCKET_AVAILABLE else False,
                "status": "unknown"
            }
        }
    }
    
    # Verificar WebSocket si está disponible
    if WEBSOCKET_AVAILABLE and is_websocket_enabled():
        try:
            from app.controllers.websocket.websocket_controller import websocket_controller
            ws_stats = websocket_controller.get_connection_stats()
            
            health_data["services"]["websocket"] = {
                "available": True,
                "enabled": True,
                "status": "healthy",
                "active_connections": ws_stats["manager_stats"]["active_connections"],
                "total_connections": ws_stats["manager_stats"]["total_connections"],
                "uptime_seconds": ws_stats["manager_stats"]["uptime_seconds"]
            }
            
        except Exception as e:
            health_data["services"]["websocket"] = {
                "available": True,
                "enabled": True,
                "status": "error",
                "error": str(e)
            }
    
    return health_data

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