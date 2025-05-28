# ===== security/__init__.py =====
from fastapi import APIRouter
from app.api.v1.security import roles, permissions

security_router = APIRouter()
security_router.include_router(roles.router, prefix="/roles", tags=["roles"])
security_router.include_router(permissions.router, prefix="/permissions", tags=["permissions"])
