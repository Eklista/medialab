# ============================================================================
# backend/app/schemas/inventory/supplies.py
# ============================================================================

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from .common import CategoryInDB, LocationInDB, MovementTypeInDB

# ===== SUPPLIES =====
class SupplyBase(BaseModel):
    codigo: Optional[str] = Field(None, max_length=100)
    nombre_producto: str = Field(..., min_length=1, max_length=255)
    presentacion: Optional[str] = Field(None, max_length=100)
    descripcion: Optional[str] = None
    stock_minimo: int = Field(default=0, ge=0)
    observaciones: Optional[str] = None

class SupplyCreate(SupplyBase):
    category_id: int = Field(..., gt=0)
    location_id: Optional[int] = Field(None, gt=0)
    stock_actual: int = Field(default=0, ge=0)
    is_active: bool = True

class SupplyUpdate(BaseModel):
    codigo: Optional[str] = Field(None, max_length=100)
    nombre_producto: Optional[str] = Field(None, min_length=1, max_length=255)
    presentacion: Optional[str] = Field(None, max_length=100)
    descripcion: Optional[str] = None
    category_id: Optional[int] = Field(None, gt=0)
    location_id: Optional[int] = Field(None, gt=0)
    stock_actual: Optional[int] = Field(None, ge=0)
    stock_minimo: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    observaciones: Optional[str] = None

class SupplyInDB(SupplyBase):
    id: int
    category_id: int
    location_id: Optional[int] = None
    stock_actual: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class SupplyWithDetails(SupplyInDB):
    category: Optional[CategoryInDB] = None
    location: Optional[LocationInDB] = None

# ===== SUPPLY MOVEMENTS =====
class SupplyMovementBase(BaseModel):
    cantidad: int = Field(..., gt=0)
    numero_envio: Optional[str] = Field(None, max_length=100)
    observaciones: Optional[str] = None

class SupplyMovementCreate(SupplyMovementBase):
    supply_id: int = Field(..., gt=0)
    movement_type_id: int = Field(..., gt=0)
    user_receives_id: Optional[int] = Field(None, gt=0)
    user_delivers_to_id: Optional[int] = Field(None, gt=0)
    fecha_movimiento: Optional[datetime] = None

class SupplyMovementInDB(SupplyMovementBase):
    id: int
    supply_id: int
    movement_type_id: int
    user_receives_id: Optional[int] = None
    user_delivers_to_id: Optional[int] = None
    fecha_movimiento: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

class SupplyMovementWithDetails(SupplyMovementInDB):
    supply: Optional[SupplyInDB] = None
    movement_type: Optional[MovementTypeInDB] = None
    user_receives: Optional[Dict[str, Any]] = None
    user_delivers_to: Optional[Dict[str, Any]] = None
