# app/schemas/organization/departments.py
from typing import Optional, List
from pydantic import BaseModel

# Esquemas para tipos de departamentos
class DepartmentTypeBase(BaseModel):
    name: str

class DepartmentTypeCreate(DepartmentTypeBase):
    pass

class DepartmentTypeUpdate(BaseModel):
    name: Optional[str] = None

class DepartmentTypeInDB(DepartmentTypeBase):
    id: int
    
    class Config:
        from_attributes = True

# Esquemas para departamentos
class DepartmentBase(BaseModel):
    name: str
    abbreviation: str
    description: Optional[str] = None
    type_id: int

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    abbreviation: Optional[str] = None
    description: Optional[str] = None
    type_id: Optional[int] = None

# Esquema para respuesta de departamento básico
class DepartmentInDB(DepartmentBase):
    id: int
    
    class Config:
        from_attributes = True

# Esquema para respuesta de departamento con tipo incluido
class DepartmentWithType(DepartmentInDB):
    type: DepartmentTypeInDB
    
    class Config:
        from_attributes = True