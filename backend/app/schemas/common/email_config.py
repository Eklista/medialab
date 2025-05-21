# app/schemas/common/email_config.py
from typing import Optional
from pydantic import BaseModel, EmailStr, validator
from datetime import datetime

class SmtpConfigurationBase(BaseModel):
    host: str
    port: int
    username: str
    use_tls: bool = True
    use_ssl: bool = False
    timeout: int = 30
    default_from_name: str
    default_from_email: EmailStr
    
    @validator('port')
    def validate_port(cls, v):
        if v < 1 or v > 65535:
            raise ValueError('El puerto debe estar entre 1 y 65535')
        return v

class SmtpConfigurationCreate(SmtpConfigurationBase):
    password: str
    is_active: bool = False

class SmtpConfigurationUpdate(BaseModel):
    host: Optional[str] = None
    port: Optional[int] = None
    username: Optional[str] = None
    password: Optional[str] = None
    use_tls: Optional[bool] = None
    use_ssl: Optional[bool] = None
    timeout: Optional[int] = None
    default_from_name: Optional[str] = None
    default_from_email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    
    @validator('port')
    def validate_port(cls, v):
        if v is not None and (v < 1 or v > 65535):
            raise ValueError('El puerto debe estar entre 1 y 65535')
        return v

class SmtpConfigurationInDB(SmtpConfigurationBase):
    id: int
    password: str = "●●●●●●●●"
    is_active: bool
    updated_at: datetime
    
    class Config:
        from_attributes = True

class SmtpTestRequest(BaseModel):
    host: str
    port: int
    username: str
    password: str
    use_tls: bool = True
    use_ssl: bool = False
    default_from_email: EmailStr