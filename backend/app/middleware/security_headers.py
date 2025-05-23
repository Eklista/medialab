# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Tu configuración existente
from app.config.settings import CORS_ORIGINS, ENVIRONMENT

app = FastAPI(
    title="MediaLab API - Secure Edition",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs"
)

# ===== SEGURIDAD MIDDLEWARE =====
try:
    from app.middleware.security_headers import (
        SecurityHeadersMiddleware, 
        RateLimitMiddleware, 
        RequestLoggingMiddleware
    )
    # Agregar middleware de seguridad
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(SecurityHeadersMiddleware, enable_security_headers=True)
    app.add_middleware(RateLimitMiddleware)
    print("✅ Security middleware loaded")
except ImportError as e:
    print(f"⚠️ Security middleware not available: {e}")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tu router existente
from app.api.v1.auth import auth_router
app.include_router(auth_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "API funcionando con seguridad mejorada 🛡️"}

@app.get("/health")
def health():
    return {"status": "ok", "security": "enabled"}