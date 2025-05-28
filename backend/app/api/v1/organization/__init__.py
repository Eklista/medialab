# ===== organization/__init__.py =====
from fastapi import APIRouter
from app.api.v1.organization import areas, departments, department_types, services

organization_router = APIRouter()
organization_router.include_router(areas.router, prefix="/areas", tags=["areas"])
organization_router.include_router(departments.router, prefix="/departments", tags=["departments"])
organization_router.include_router(department_types.router, prefix="/department-types", tags=["department-types"])
organization_router.include_router(services.router, prefix="/services", tags=["services"])