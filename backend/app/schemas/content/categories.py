# app/schemas/content/categories.py
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime

class ContentCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Nombre de la categoría")
    slug: str = Field(..., min_length=1, max_length=100, description="Slug único para URLs")
    description: Optional[str] = Field(None, description="Descripción de la categoría")
    icon: Optional[str] = Field(None, max_length=50, description="CSS icon class")
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$', description="Color hex (#FFFFFF)")
    sort_order: int = Field(0, description="Orden de visualización")
    is_active: bool = Field(True, description="Si la categoría está activa")

    @field_validator('slug')
    @classmethod
    def validate_slug(cls, v):
        if not v.replace('-', '').replace('_', '').isalnum():
            raise ValueError('Slug debe contener solo letras, números, guiones y guiones bajos')
        return v.lower()

class ContentCategoryCreate(ContentCategoryBase):
    pass

class ContentCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    slug: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

    @field_validator('slug')
    @classmethod
    def validate_slug(cls, v):
        if v and not v.replace('-', '').replace('_', '').isalnum():
            raise ValueError('Slug debe contener solo letras, números, guiones y guiones bajos')
        return v.lower() if v else v

class ContentCategoryInDB(ContentCategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ContentCategoryPublic(BaseModel):
    """Schema público para categorías (sin datos internos)"""
    id: int
    name: str
    slug: str
    description: Optional[str]
    icon: Optional[str]
    color: Optional[str]
    sort_order: int

    class Config:
        from_attributes = True

# Schemas para relación departamento-categoría
class DepartmentCategoryBase(BaseModel):
    department_id: int
    category_id: int
    is_active: bool = Field(True, description="Si la relación está activa")

class DepartmentCategoryCreate(DepartmentCategoryBase):
    pass

class DepartmentCategoryUpdate(BaseModel):
    is_active: Optional[bool] = None

class DepartmentCategoryInDB(DepartmentCategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    # Relaciones
    department: Optional[dict] = None
    category: Optional[dict] = None

    class Config:
        from_attributes = True

# Schema combinado para departamentos con sus categorías
class DepartmentWithCategories(BaseModel):
    id: int
    name: str
    abbreviation: str
    categories: List[ContentCategoryPublic] = []

    class Config:
        from_attributes = True