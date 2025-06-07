# ============================================================================
# backend/app/schemas/inventory/common.py
# ============================================================================

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

# ===== CATEGORIES =====
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    is_equipment: bool = True
    is_active: bool = True

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_equipment: Optional[bool] = None
    is_active: Optional[bool] = None

class CategoryInDB(CategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ===== LOCATIONS =====
class LocationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    is_external: bool = False
    is_active: bool = True

class LocationCreate(LocationBase):
    pass

class LocationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_external: Optional[bool] = None
    is_active: Optional[bool] = None

class LocationInDB(LocationBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ===== SUPPLIERS =====
class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    is_active: bool = True

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None

class SupplierInDB(SupplierBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ===== EQUIPMENT STATES =====
class EquipmentStateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    color: str = Field(default="#6B7280", max_length=20)
    is_operational: bool = True
    is_active: bool = True

class EquipmentStateCreate(EquipmentStateBase):
    pass

class EquipmentStateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None
    color: Optional[str] = Field(None, max_length=20)
    is_operational: Optional[bool] = None
    is_active: Optional[bool] = None

class EquipmentStateInDB(EquipmentStateBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ===== MOVEMENT TYPES =====
class MovementTypeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    affects_stock: int = Field(default=0, ge=-1, le=1)  # -1, 0, 1
    is_active: bool = True

class MovementTypeCreate(MovementTypeBase):
    pass

class MovementTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None
    affects_stock: Optional[int] = Field(None, ge=-1, le=1)
    is_active: Optional[bool] = None

class MovementTypeInDB(MovementTypeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True