# ===== users/__init__.py =====
from fastapi import APIRouter
from app.api.v1.users import users

users_router = APIRouter()
users_router.include_router(users.router, prefix="", tags=["users"])