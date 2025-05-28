from typing import Optional, List
from pydantic import BaseModel

# Esquema base para roles
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

# Esquema para crear rol
class RoleCreate(RoleBase):
    pass

# Esquema para actualizar rol
class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

# Esquema para respuesta de rol
class RoleInDB(RoleBase):
    id: int
    
    class Config:
        from_attributes = True

# Esquema para rol con permisos
class RoleWithPermissions(RoleInDB):
    permissions: List[str] = []