# Archivo: app/schemas/auth/permissions.py
from typing import Optional
from pydantic import BaseModel

class PermissionBase(BaseModel):
    name: str
    description: Optional[str] = None

class PermissionResponse(PermissionBase):
    id: int
    
    class Config:
        from_attributes = True