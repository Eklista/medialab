# app/schemas/organization/service_templates.py
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

# Esquema para la selección de servicios y subservicios
class ServiceSelection(BaseModel):
    service_id: int
    sub_service_ids: List[int] = []

# Esquema base para plantillas de servicios
class ServiceTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False

class ServiceTemplateCreate(ServiceTemplateBase):
    service_ids: Optional[List[int]] = []  # Para compatibilidad
    service_selections: Optional[List[ServiceSelection]] = []

class ServiceTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    service_ids: Optional[List[int]] = None  # Para compatibilidad
    service_selections: Optional[List[ServiceSelection]] = None

class ServiceTemplateInDB(ServiceTemplateBase):
    id: int
    
    class Config:
        from_attributes = True

class ServiceTemplateWithServices(ServiceTemplateInDB):
    services: List[Dict[str, Any]] = []
    subservices: List[Dict[str, Any]] = []
    service_selections: List[Dict[str, Any]] = []