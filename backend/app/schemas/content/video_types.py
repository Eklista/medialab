# app/schemas/content/video_types.py
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime

class VideoTypeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50, description="Nombre interno (youtube, vimeo, aws_s3)")
    display_name: str = Field(..., min_length=1, max_length=100, description="Nombre para mostrar")
    description: Optional[str] = Field(None, description="Descripción del tipo de video")
    icon: Optional[str] = Field(None, max_length=50, description="CSS icon class")
    is_active: bool = Field(True, description="Si el tipo está activo")

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Name debe contener solo letras, números, guiones y guiones bajos')
        return v.lower()

class VideoTypeCreate(VideoTypeBase):
    pass

class VideoTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    display_name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if v and not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Name debe contener solo letras, números, guiones y guiones bajos')
        return v.lower() if v else v

class VideoTypeInDB(VideoTypeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class VideoTypePublic(BaseModel):
    """Schema público para tipos de video"""
    id: int
    name: str
    display_name: str
    description: Optional[str]
    icon: Optional[str]

    class Config:
        from_attributes = True

class StorageProviderBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50, description="Nombre del proveedor")
    display_name: str = Field(..., min_length=1, max_length=100, description="Nombre para mostrar")
    video_type_id: int = Field(..., description="ID del tipo de video asociado")
    is_active: bool = Field(True, description="Si el proveedor está activo")
    config: Optional[dict] = Field(None, description="Configuraciones específicas (JSON)")
    max_file_size: Optional[int] = Field(None, description="Tamaño máximo de archivo en bytes")
    supported_formats: Optional[List[str]] = Field(None, description="Formatos soportados")
    api_endpoint: Optional[str] = Field(None, max_length=255, description="Endpoint de API")

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Name debe contener solo letras, números, guiones y guiones bajos')
        return v.lower()

class StorageProviderCreate(StorageProviderBase):
    pass

class StorageProviderUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    display_name: Optional[str] = Field(None, min_length=1, max_length=100)
    video_type_id: Optional[int] = None
    is_active: Optional[bool] = None
    config: Optional[dict] = None
    max_file_size: Optional[int] = None
    supported_formats: Optional[List[str]] = None
    api_endpoint: Optional[str] = Field(None, max_length=255)

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if v and not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Name debe contener solo letras, números, guiones y guiones bajos')
        return v.lower() if v else v

class StorageProviderInDB(StorageProviderBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    # Relaciones
    video_type: Optional[VideoTypeInDB] = None

    class Config:
        from_attributes = True

class StorageProviderPublic(BaseModel):
    """Schema público para proveedores"""
    id: int
    name: str
    display_name: str
    video_type_id: int
    max_file_size: Optional[int]
    supported_formats: Optional[List[str]]

    class Config:
        from_attributes = True