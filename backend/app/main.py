# backend/app/main.py
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Importaciones de configuración
from app.config.settings import CORS_ORIGINS, ENVIRONMENT, REDIS_ENABLED

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestión del ciclo de vida de la aplicación
    """
    # ===== STARTUP =====
    logger.info("🚀 Iniciando MediaLab API...")
    
    # Inicializar sistema Redis si está habilitado
    if REDIS_ENABLED:
        try:
            logger.info("🔧 Inicializando sistema Redis...")
            # Importar servicios Redis solo si están habilitados
            from app.services.redis_init_service import redis_init
            from app.tasks.redis_cleanup_tasks import redis_cleanup_tasks
            
            redis_init_results = await redis_init.initialize_redis_system()
            
            if redis_init_results["status"] == "success":
                logger.info("✅ Sistema Redis inicializado exitosamente")
                
                # Iniciar tareas de limpieza en background
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
    
    logger.info("✅ MediaLab API iniciada correctamente")
    
    yield
    
    # ===== SHUTDOWN =====
    logger.info("🛑 Cerrando MediaLab API...")
    
    # Cancelar tareas de limpieza
    if hasattr(app.state, 'cleanup_task'):
        app.state.cleanup_task.cancel()
        try:
            await app.state.cleanup_task
        except asyncio.CancelledError:
            pass
        logger.info("🧹 Tareas de limpieza Redis detenidas")
    
    logger.info("👋 MediaLab API cerrada correctamente")

# Crear aplicación con lifespan
app = FastAPI(
    title="MediaLab API",
    description="API para gestión de MediaLab con sistema de autenticación seguro",
    version="2.0.0",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs",
    lifespan=lifespan
)

# ===== MIDDLEWARE DE SEGURIDAD =====

# Rate Limiting Middleware (solo si Redis está habilitado)
if REDIS_ENABLED:
    try:
        from app.middleware.rate_limit_middleware import RateLimitMiddleware
        
        app.add_middleware(
            RateLimitMiddleware,
            calls_limit=1000,    # 1000 requests por hora
            period=3600,         # 3600 segundos = 1 hora
            exclude_paths=[
                "/docs", "/redoc", "/openapi.json", 
                "/health", "/favicon.ico",
                "/api/v1/docs", "/api/v1/openapi.json"
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

# CORS Middleware (debe ir después de otros middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ===== ROUTERS =====

# Incluir el router principal de la API
try:
    from app.api.v1 import api_router
    app.include_router(api_router, prefix="/api/v1")
    logger.info("✅ API routers cargados")
except ImportError as e:
    logger.error(f"❌ Error cargando API routers: {e}")

# ===== ENDPOINTS DE SISTEMA =====

@app.get("/")
def root():
    """Endpoint raíz de la API"""
    return {
        "message": "MediaLab API está funcionando",
        "version": "2.0.0",
        "environment": ENVIRONMENT,
        "features": {
            "redis_enabled": REDIS_ENABLED,
            "security": "enhanced",
            "authentication": "JWT/JWE with httpOnly cookies"
        }
    }

@app.get("/health")
def health_check():
    """Endpoint de salud básico"""
    return {
        "status": "healthy",
        "environment": ENVIRONMENT,
        "redis_enabled": REDIS_ENABLED
    }

# ===== ENDPOINTS REDIS (solo si está habilitado) =====

if REDIS_ENABLED:
    @app.get("/system/redis/status")
    async def get_redis_system_status():
        """
        Endpoint para verificar el estado del sistema Redis
        """
        try:
            from app.services.redis_init_service import redis_init
            return redis_init.get_system_status()
        except ImportError:
            return {"error": "Servicios Redis no disponibles"}
        except Exception as e:
            return {"error": f"Error obteniendo estado de Redis: {str(e)}"}

    @app.get("/system/redis/cleanup/status")
    async def get_cleanup_status():
        """
        Endpoint para verificar el estado de las tareas de limpieza
        """
        try:
            from app.tasks.redis_cleanup_tasks import redis_cleanup_tasks
            return redis_cleanup_tasks.get_cleanup_status()
        except ImportError:
            return {"error": "Servicios de limpieza Redis no disponibles"}
        except Exception as e:
            return {"error": f"Error obteniendo estado de limpieza: {str(e)}"}

    @app.post("/system/redis/cleanup/manual")
    async def manual_cleanup():
        """
        Endpoint para ejecutar limpieza manual (solo en desarrollo)
        """
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

# ===== ENDPOINT DE SALUD REDIS =====

@app.get("/health/redis")
async def redis_health_check():
    """
    Endpoint específico de salud para Redis
    """
    if not REDIS_ENABLED:
        return {"redis_enabled": False, "status": "disabled"}
    
    try:
        from app.config.redis_config import redis_manager
        
        redis_status = {
            "redis_enabled": True,
            "redis_available": redis_manager.is_available(),
            "connection_info": redis_manager.get_connection_info()
        }
        
        if redis_manager.is_available():
            # Hacer un ping para verificar conectividad
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

# ===== CONFIGURACIÓN PARA DESARROLLO =====

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if ENVIRONMENT == "development" else False,
        log_level="info"
    )