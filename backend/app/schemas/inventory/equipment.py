# ============================================================================
# backend/app/schemas/inventory/equipment.py
# ============================================================================

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from .common import CategoryInDB, LocationInDB, EquipmentStateInDB, SupplierInDB

# ===== EQUIPMENT =====
class EquipmentBase(BaseModel):
    codigo_ug: Optional[str] = Field(None, max_length=100)
    numero_serie: Optional[str] = Field(None, max_length=255)
    service_tag: Optional[str] = Field(None, max_length=255)
    marca: Optional[str] = Field(None, max_length=100)
    modelo: Optional[str] = Field(None, max_length=100)
    descripcion: Optional[str] = None
    numero_hoja_envio: Optional[str] = Field(None, max_length=100)
    observaciones: Optional[str] = None

class EquipmentCreate(EquipmentBase):
    category_id: int = Field(..., gt=0)
    state_id: int = Field(..., gt=0)
    location_id: int = Field(..., gt=0)
    assigned_user_id: Optional[int] = Field(None, gt=0)
    supplier_id: Optional[int] = Field(None, gt=0)
    fecha_entrega: Optional[datetime] = None

class EquipmentUpdate(BaseModel):
    codigo_ug: Optional[str] = Field(None, max_length=100)
    numero_serie: Optional[str] = Field(None, max_length=255)
    service_tag: Optional[str] = Field(None, max_length=255)
    marca: Optional[str] = Field(None, max_length=100)
    modelo: Optional[str] = Field(None, max_length=100)
    descripcion: Optional[str] = None
    category_id: Optional[int] = Field(None, gt=0)
    state_id: Optional[int] = Field(None, gt=0)
    location_id: Optional[int] = Field(None, gt=0)
    assigned_user_id: Optional[int] = Field(None, gt=0)
    supplier_id: Optional[int] = Field(None, gt=0)
    fecha_entrega: Optional[datetime] = None
    numero_hoja_envio: Optional[str] = Field(None, max_length=100)
    observaciones: Optional[str] = None

class EquipmentInDB(EquipmentBase):
    id: int
    category_id: int
    state_id: int
    location_id: int
    assigned_user_id: Optional[int] = None
    supplier_id: Optional[int] = None
    fecha_entrega: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class EquipmentWithDetails(EquipmentInDB):
    category: Optional[CategoryInDB] = None
    state: Optional[EquipmentStateInDB] = None
    location: Optional[LocationInDB] = None
    supplier: Optional[SupplierInDB] = None
    assigned_user: Optional[Dict[str, Any]] = None  # Usuario formateado
    lab_details: Optional["EquipmentLabInDB"] = None

# ===== EQUIPMENT LAB =====
class EquipmentLabBase(BaseModel):
    numero_pc: Optional[str] = Field(None, max_length=50)
    procesador: Optional[str] = Field(None, max_length=255)
    memoria_ram: Optional[str] = Field(None, max_length=100)
    capacidad_hdd: Optional[str] = Field(None, max_length=100)
    monitor_serie: Optional[str] = Field(None, max_length=255)
    monitor_codigo_ug: Optional[str] = Field(None, max_length=100)

class EquipmentLabCreate(EquipmentLabBase):
    equipment_id: int = Field(..., gt=0)
    supplier_id: Optional[int] = Field(None, gt=0)
    fecha_recepcion_sega: Optional[datetime] = None
    fecha_entrega_medialab: Optional[datetime] = None

class EquipmentLabUpdate(BaseModel):
    numero_pc: Optional[str] = Field(None, max_length=50)
    procesador: Optional[str] = Field(None, max_length=255)
    memoria_ram: Optional[str] = Field(None, max_length=100)
    capacidad_hdd: Optional[str] = Field(None, max_length=100)
    monitor_serie: Optional[str] = Field(None, max_length=255)
    monitor_codigo_ug: Optional[str] = Field(None, max_length=100)
    supplier_id: Optional[int] = Field(None, gt=0)
    fecha_recepcion_sega: Optional[datetime] = None
    fecha_entrega_medialab: Optional[datetime] = None

class EquipmentLabInDB(EquipmentLabBase):
    id: int
    equipment_id: int
    supplier_id: Optional[int] = None
    fecha_recepcion_sega: Optional[datetime] = None
    fecha_entrega_medialab: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True