from typing import Optional
from pydantic import BaseModel, Field
from enum import Enum

class DepartmentType(str, Enum):
    FACULTY = "faculty"
    DEPARTMENT = "department"

# Esquema base para departamentos
class DepartmentBase(BaseModel):
    name: str
    abbreviation: str
    type: DepartmentType = DepartmentType.DEPARTMENT
    description: Optional[str] = None

# Esquema para crear departamento
class DepartmentCreate(DepartmentBase):
    pass

# Esquema para actualizar departamento
class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    abbreviation: Optional[str] = None
    type: Optional[DepartmentType] = None
    description: Optional[str] = None

# Esquema para respuesta de departamento
class DepartmentInDB(DepartmentBase):
    id: int
    
    class Config:
        from_attributes = True
        orm_mode = True