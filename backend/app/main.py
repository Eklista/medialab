# backend/app/main.py - Versión corregida
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importar el router principal que incluye todos los endpoints
from app.api.v1 import api_router

app = FastAPI(
    title="MediaLab API",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs"
)

# CORS básico
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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