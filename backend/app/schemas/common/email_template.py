# app/schemas/common/email_template.py
from typing import Optional
from pydantic import BaseModel, validator
from datetime import datetime

class EmailTemplateBase(BaseModel):
    code: str
    name: str
    subject: str
    body_html: str
    description: Optional[str] = None
    available_variables: Optional[str] = None
    category: str = "general"
    is_active: bool = True

class EmailTemplateCreate(EmailTemplateBase):
    pass

class EmailTemplateUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    body_html: Optional[str] = None
    description: Optional[str] = None
    available_variables: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None

class EmailTemplateInDB(EmailTemplateBase):
    id: int
    
    class Config:
        from_attributes = True