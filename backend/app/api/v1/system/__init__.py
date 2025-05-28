# ===== system/__init__.py =====
from fastapi import APIRouter
from app.api.v1.system import health, public

system_router = APIRouter()
system_router.include_router(health.router, prefix="", tags=["health"])  # health sin prefijo adicional
system_router.include_router(public.router, prefix="/public", tags=["public"])
