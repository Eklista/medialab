"""
FastAPI Backend Main Application
Multi-frontend architecture with WordPress headless CMS
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from contextlib import asynccontextmanager

# Import your app modules here when you create them
# from app.api.router import api_router
# from app.database.connection import database
# from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("🚀 Starting FastAPI Backend...")
    # Initialize database connections, background tasks, etc.
    
    yield
    
    # Shutdown
    print("🛑 Shutting down FastAPI Backend...")
    # Clean up resources


# Create FastAPI application
app = FastAPI(
    title="Medialab Backend API",
    description="FastAPI backend for multi-frontend architecture with WordPress headless CMS",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint (required by docker-compose)
@app.get("/health")
async def health_check():
    """Health check endpoint for container orchestration"""
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "service": "fastapi-backend",
            "version": "1.0.0"
        }
    )


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Medialab FastAPI Backend",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


# API versioning
@app.get("/api/v1")
async def api_v1_root():
    """API v1 root endpoint"""
    return {
        "message": "Medialab API v1",
        "endpoints": {
            "users": "/api/v1/users",
            "services": "/api/v1/services",
            "equipment": "/api/v1/equipment",
            "workflows": "/api/v1/workflows"
        }
    }

# Include API routers here when you create them
# app.include_router(api_router, prefix="/api/v1")


if __name__ == "__main__":
    # For development only
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
