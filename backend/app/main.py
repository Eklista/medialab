# backend/app/main.py - Versión simple que funciona
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

# Router existente
from app.api.v1.auth import auth_router
app.include_router(auth_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "API funcionando", "status": "ok"}

@app.get("/health") 
def health():
    return {"status": "healthy"}