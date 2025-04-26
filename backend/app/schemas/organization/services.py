from typing import Optional, List
from pydantic import BaseModel

# Esquemas para SubService
class SubServiceBase(BaseModel):
    name: str
    description: Optional[str] = None

class SubServiceCreate(SubServiceBase):
    pass

class SubServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class SubServiceInDB(SubServiceBase):
    id: int
    service_id: int
    
    class Config:
        from_attributes = True

# Esquemas para Service
class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon_name: Optional[str] = None

class ServiceCreate(ServiceBase):
    sub_services: Optional[List[SubServiceCreate]] = []

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon_name: Optional[str] = None

class ServiceInDB(ServiceBase):
    id: int
    
    class Config:
        from_attributes = True

class ServiceWithSubServices(ServiceInDB):
    sub_services: List[SubServiceInDB] = []