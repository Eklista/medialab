from typing import Optional
from pydantic import BaseModel

# Esquema base para áreas
class AreaBase(BaseModel):
    name: str
    description: Optional[str] = None

# Esquema para crear área
class AreaCreate(AreaBase):
    pass

# Esquema para actualizar área
class AreaUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

# Esquema para respuesta de área
class AreaInDB(AreaBase):
    id: int
    
    class Config:
        from_attributes = True