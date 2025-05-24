# backend/app/main.py (con debug para CORS)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import CORS_ORIGINS, CORS_CREDENTIALS, ENVIRONMENT
from app.api.v1 import api_router
import logging

# Configurar logging para debug
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MediaLab API",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs"
)

# Debug: Log de configuración CORS
logger.info("=== CONFIGURACIÓN CORS EN MAIN.PY ===")
logger.info(f"CORS_ORIGINS: {CORS_ORIGINS}")
logger.info(f"CORS_CREDENTIALS: {CORS_CREDENTIALS}")
logger.info(f"ENVIRONMENT: {ENVIRONMENT}")
logger.info("=====================================")

# CORS corregido para cookies - SIN WILDCARD
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,      # ← Debe ser lista específica, NO "*"
    allow_credentials=True,          # ← Necesario para cookies
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Set-Cookie"]    # ← Importante para cookies
)

# Incluir el router principal con todos los endpoints
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "API funcionando", "status": "ok"}

@app.get("/health") 
def health():
    return {"status": "healthy"}

@app.get("/api/v1/")
def api_root():
    return {"message": "MediaLab API v1", "endpoints": "Disponibles en /api/v1/docs"}