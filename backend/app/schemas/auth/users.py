from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, EmailStr, Field

# Esquemas base
class UserBase(BaseModel):
    email: EmailStr
    username: str
    first_name: str
    last_name: str
    is_active: bool = True

# Esquema para crear usuario
class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    phone: Optional[str] = None
    birth_date: Optional[date] = None
    join_date: date
    roleId: Optional[str] = None 
    areaId: Optional[str] = None
    
# Esquema para actualizar usuario
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[date] = None
    is_active: Optional[bool] = None
    profile_image: Optional[str] = None
    banner_image: Optional[str] = None

# Esquema para cambiar contraseña
class UserPasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

# Esquema para respuesta de usuario
class UserInDB(UserBase):
    id: int
    profile_image: Optional[str] = None
    banner_image: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[date] = None
    join_date: date
    last_login: Optional[datetime] = None
    is_online: bool
    
    class Config:
        from_attributes = True

# Esquema para respuesta de usuario con roles
class UserWithRoles(UserInDB):
    roles: List[str] = []

class PasswordVerify(BaseModel):
    password: str