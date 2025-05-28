# ===== communication/__init__.py =====
from fastapi import APIRouter
from app.api.v1.communication import smtp_config

communication_router = APIRouter()
communication_router.include_router(smtp_config.router, prefix="/smtp-config", tags=["smtp-config"])