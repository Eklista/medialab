from fastapi import APIRouter

from app.api.v1 import users, roles, areas
from app.api.v1.auth import auth_router

api_router = APIRouter()

# Incluir enrutadores por dominio
api_router.include_router(auth_router, prefix="/auth")
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(areas.router, prefix="/areas", tags=["areas"])