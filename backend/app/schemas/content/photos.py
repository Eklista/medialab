# app/schemas/content/photos.py
from pydantic import BaseModel, Field, field_validator, HttpUrl
from typing import Optional, List, Dict
from datetime import datetime

class PhotoBase(BaseModel):
    content_id: str = Field(..., description="ID del contenido asociado")
    
    # URLs de la imagen
    photo_url: str = Field(..., max_length=1000, description="URL de la foto")
    thumbnail_url: Optional[str] = Field(None, max_length=1000, description="URL de la miniatura")
    medium_url: Optional[str] = Field(None, max_length=1000, description="URL tamaño medio")
    
    # Metadata
    original_filename: Optional[str] = Field(None, max_length=255, description="Nombre del archivo original")
    file_size: Optional[int] = Field(None, ge=0, description="Tamaño del archivo en bytes")
    mime_type: Optional[str] = Field(None, max_length=100, description="Tipo MIME")
    width: Optional[int] = Field(None, ge=0, description="Ancho en píxeles")
    height: Optional[int] = Field(None, ge=0, description="Alto en píxeles")
    
    # Contenido
    caption: Optional[str] = Field(None, description="Descripción de la foto")
    alt_text: Optional[str] = Field(None, max_length=255, description="Texto alternativo para accesibilidad")
    
    # Ordenamiento y control
    sort_order: int = Field(0, description="Orden de visualización")
    is_featured: bool = Field(False, description="Si es foto destacada")
    is_cover: bool = Field(False, description="Si es foto de portada")

    @field_validator('photo_url')
    @classmethod
    def validate_photo_url(cls, v):
        if not v:
            raise ValueError('URL de la foto es requerida')
        return v

    @field_validator('mime_type')
    @classmethod
    def validate_mime_type(cls, v):
        if v and not v.startswith('image/'):
            raise ValueError('Tipo MIME debe ser de imagen')
        return v

class PhotoCreate(PhotoBase):
    pass

class PhotoUpdate(BaseModel):
    # URLs
    photo_url: Optional[str] = Field(None, max_length=1000)
    thumbnail_url: Optional[str] = Field(None, max_length=1000)
    medium_url: Optional[str] = Field(None, max_length=1000)
    
    # Metadata
    original_filename: Optional[str] = Field(None, max_length=255)
    file_size: Optional[int] = Field(None, ge=0)
    mime_type: Optional[str] = Field(None, max_length=100)
    width: Optional[int] = Field(None, ge=0)
    height: Optional[int] = Field(None, ge=0)
    
    # Contenido
    caption: Optional[str] = None
    alt_text: Optional[str] = Field(None, max_length=255)
    
    # Control
    sort_order: Optional[int] = None
    is_featured: Optional[bool] = None
    is_cover: Optional[bool] = None

    @field_validator('mime_type')
    @classmethod
    def validate_mime_type(cls, v):
        if v and not v.startswith('image/'):
            raise ValueError('Tipo MIME debe ser de imagen')
        return v

class PhotoInDB(PhotoBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    # Auditoría
    deleted_at: Optional[datetime] = None
    created_by_id: Optional[int] = None
    updated_by_id: Optional[int] = None
    deleted_by_id: Optional[int] = None
    
    # Relaciones
    content: Optional[dict] = None

    class Config:
        from_attributes = True

class PhotoPublic(BaseModel):
    """Schema público para fotos (frontend)"""
    id: str
    content_id: str
    photo_url: str
    thumbnail_url: Optional[str]
    medium_url: Optional[str]
    width: Optional[int]
    height: Optional[int]
    caption: Optional[str]
    alt_text: Optional[str]
    sort_order: int
    is_featured: bool
    is_cover: bool

    class Config:
        from_attributes = True

# Schemas para operaciones específicas
class PhotoCreateFromUpload(BaseModel):
    """Schema para crear foto desde archivo subido"""
    content_id: str
    file_path: str = Field(..., description="Ruta del archivo subido")
    original_filename: str = Field(..., description="Nombre original del archivo")
    caption: Optional[str] = None
    alt_text: Optional[str] = None
    is_featured: bool = Field(False)
    is_cover: bool = Field(False)
    sort_order: int = Field(0)

class PhotoCreateFromUrl(BaseModel):
    """Schema para crear foto desde URL externa"""
    content_id: str
    photo_url: str = Field(..., description="URL de la imagen")
    caption: Optional[str] = None
    alt_text: Optional[str] = None
    is_featured: bool = Field(False)
    is_cover: bool = Field(False)
    sort_order: int = Field(0)

    @field_validator('photo_url')
    @classmethod
    def validate_photo_url(cls, v):
        # Validar que sea una URL de imagen válida
        if not any(v.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']):
            raise ValueError('URL debe apuntar a un archivo de imagen válido')
        return v

class PhotoBulkCreate(BaseModel):
    """Schema para crear múltiples fotos"""
    content_id: str
    photos: List[PhotoCreate] = Field(..., description="Lista de fotos a crear")

class PhotoBulkUpload(BaseModel):
    """Schema para subida masiva de fotos"""
    content_id: str
    file_paths: List[str] = Field(..., description="Lista de rutas de archivos")
    captions: Optional[List[str]] = Field(None, description="Descripciones opcionales")

# Schemas de respuesta
class PhotoListResponse(BaseModel):
    photos: List[PhotoInDB]
    total: int
    skip: int
    limit: int
    content_id: Optional[str] = None
    is_featured: Optional[bool] = None
    is_cover: Optional[bool] = None

class PhotoWithContent(PhotoInDB):
    """Foto con información del contenido asociado"""
    content: dict

    class Config:
        from_attributes = True

class PhotoGalleryResponse(BaseModel):
    """Respuesta para galería de fotos"""
    content_id: str
    cover_photo: Optional[PhotoPublic] = None
    featured_photos: List[PhotoPublic] = []
    all_photos: List[PhotoPublic] = []
    total_photos: int
    has_cover: bool
    featured_count: int