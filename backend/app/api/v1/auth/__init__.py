from fastapi import APIRouter

from app.api.v1.auth import login, password

auth_router = APIRouter()
auth_router.include_router(login.router, tags=["authentication"])
auth_router.include_router(password.router, tags=["authentication"])