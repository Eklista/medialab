# app/schemas/content/videos.py
from pydantic import BaseModel, Field, validator, HttpUrl
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class VideoBase(BaseModel):
    content_id: str = Field(..., description="ID del contenido asociado")
    
    # Información del archivo original
    original_filename: Optional[str] = Field(None, max_length=255, description="Nombre del archivo original")
    file_size: Optional[int] = Field(None, ge=0, description="Tamaño del archivo en bytes")
    mime_type: Optional[str] = Field(None, max_length=100, description="Tipo MIME del archivo")
    
    # Proveedor y tipo
    video_type_id: int = Field(..., description="ID del tipo de video")
    storage_provider_id: int = Field(..., description="ID del proveedor de almacenamiento")
    
    # URLs y identificadores
    video_url: str = Field(..., max_length=1000, description="URL del video")
    video_id: Optional[str] = Field(None, max_length=255, description="ID en el proveedor (YouTube ID, S3 key, etc.)")
    thumbnail_url: Optional[str] = Field(None, max_length=1000, description="URL de la miniatura")
    
    # Metadata del video
    duration_seconds: Optional[int] = Field(None, ge=0, description="Duración en segundos")
    duration_formatted: Optional[str] = Field(None, max_length=20, description="Duración formateada (HH:MM:SS)")
    width: Optional[int] = Field(None, ge=0, description="Ancho en píxeles")
    height: Optional[int] = Field(None, ge=0, description="Alto en píxeles")
    fps: Optional[Decimal] = Field(None, ge=0, description="Frames por segundo")
    bitrate: Optional[int] = Field(None, ge=0, description="Bitrate del video")
    
    # Estado y procesamiento
    is_processed: bool = Field(False, description="Si el video está procesado")
    processing_status: str = Field("pending", description="Estado del procesamiento")
    error_message: Optional[str] = Field(None, description="Mensaje de error si lo hay")
    
    # Control
    is_main: bool = Field(False, description="Si es el video principal (para graduaciones)")
    sort_order: int = Field(0, description="Orden de visualización")

    @validator('video_url')
    def validate_video_url(cls, v):
        if not v:
            raise ValueError('URL del video es requerida')
        return v

    @validator('processing_status')
    def validate_processing_status(cls, v):
        allowed_statuses = ['pending', 'processing', 'completed', 'error', 'cancelled']
        if v not in allowed_statuses:
            raise ValueError(f'Estado debe ser uno de: {", ".join(allowed_statuses)}')
        return v

    @validator('duration_formatted')
    def validate_duration_format(cls, v):
        if v and not v.count(':') in [1, 2]:  # MM:SS o HH:MM:SS
            raise ValueError('Formato de duración debe ser MM:SS o HH:MM:SS')
        return v

class VideoCreate(VideoBase):
    pass

class VideoUpdate(BaseModel):
    # Información del archivo
    original_filename: Optional[str] = Field(None, max_length=255)
    file_size: Optional[int] = Field(None, ge=0)
    mime_type: Optional[str] = Field(None, max_length=100)
    
    # Proveedor y tipo
    video_type_id: Optional[int] = None
    storage_provider_id: Optional[int] = None
    
    # URLs
    video_url: Optional[str] = Field(None, max_length=1000)
    video_id: Optional[str] = Field(None, max_length=255)
    thumbnail_url: Optional[str] = Field(None, max_length=1000)
    
    # Metadata
    duration_seconds: Optional[int] = Field(None, ge=0)
    duration_formatted: Optional[str] = Field(None, max_length=20)
    width: Optional[int] = Field(None, ge=0)
    height: Optional[int] = Field(None, ge=0)
    fps: Optional[Decimal] = Field(None, ge=0)
    bitrate: Optional[int] = Field(None, ge=0)
    
    # Estado
    is_processed: Optional[bool] = None
    processing_status: Optional[str] = None
    error_message: Optional[str] = None
    
    # Control
    is_main: Optional[bool] = None
    sort_order: Optional[int] = None

    @validator('processing_status')
    def validate_processing_status(cls, v):
        if v:
            allowed_statuses = ['pending', 'processing', 'completed', 'error', 'cancelled']
            if v not in allowed_statuses:
                raise ValueError(f'Estado debe ser uno de: {", ".join(allowed_statuses)}')
        return v

class VideoInDB(VideoBase):
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
    video_type: Optional[dict] = None
    storage_provider: Optional[dict] = None

    class Config:
        from_attributes = True

class VideoPublic(BaseModel):
    """Schema público para videos (frontend)"""
    id: str
    content_id: str
    video_url: str
    video_id: Optional[str]
    thumbnail_url: Optional[str]
    duration_seconds: Optional[int]
    duration_formatted: Optional[str]
    width: Optional[int]
    height: Optional[int]
    is_main: bool
    sort_order: int
    
    # Info del tipo y proveedor (sin configs sensibles)
    video_type: Optional[dict] = None
    storage_provider: Optional[dict] = None

    class Config:
        from_attributes = True

# Schemas para operaciones específicas
class VideoCreateFromYouTube(BaseModel):
    """Schema para crear video desde YouTube"""
    content_id: str
    youtube_url: str = Field(..., description="URL de YouTube")
    is_main: bool = Field(False)
    sort_order: int = Field(0)

    @validator('youtube_url')
    def validate_youtube_url(cls, v):
        youtube_patterns = [
            r'youtube\.com\/watch\?v=',
            r'youtu\.be\/',
            r'youtube\.com\/embed\/'
        ]
        import re
        if not any(re.search(pattern, v) for pattern in youtube_patterns):
            raise ValueError('Debe ser una URL válida de YouTube')
        return v

class VideoCreateFromVimeo(BaseModel):
    """Schema para crear video desde Vimeo"""
    content_id: str
    vimeo_url: str = Field(..., description="URL de Vimeo")
    is_main: bool = Field(False)
    sort_order: int = Field(0)

    @validator('vimeo_url')
    def validate_vimeo_url(cls, v):
        import re
        if not re.search(r'vimeo\.com\/\d+', v):
            raise ValueError('Debe ser una URL válida de Vimeo')
        return v

class VideoCreateFromUpload(BaseModel):
    """Schema para video subido localmente"""
    content_id: str
    file_path: str = Field(..., description="Ruta del archivo subido")
    original_filename: str = Field(..., description="Nombre original del archivo")
    is_main: bool = Field(False)
    sort_order: int = Field(0)

class VideoBulkCreate(BaseModel):
    """Schema para crear múltiples videos"""
    content_id: str
    videos: List[VideoCreate] = Field(..., description="Lista de videos a crear")

class VideoProcessingUpdate(BaseModel):
    """Schema para actualizar estado de procesamiento"""
    processing_status: str
    error_message: Optional[str] = None
    duration_seconds: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    fps: Optional[Decimal] = None
    bitrate: Optional[int] = None
    thumbnail_url: Optional[str] = None
    is_processed: Optional[bool] = None

# Schemas de respuesta
class VideoListResponse(BaseModel):
    videos: List[VideoInDB]
    total: int
    skip: int
    limit: int
    content_id: Optional[str] = None
    video_type_id: Optional[int] = None
    processing_status: Optional[str] = None

class VideoWithContent(VideoInDB):
    """Video con información del contenido asociado"""
    content: dict

    class Config:
        from_attributes = True