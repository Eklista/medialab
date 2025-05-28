# backend/app/schemas/auth/permissions.py
from typing import Optional, List
from pydantic import BaseModel, Field

class PermissionBase(BaseModel):
    name: str = Field(..., description="Nombre único del permiso", example="user_view")
    description: Optional[str] = Field(None, description="Descripción del permiso", example="Ver usuarios")

class PermissionCreate(PermissionBase):
    """Schema para crear un nuevo permiso"""
    pass

class PermissionUpdate(BaseModel):
    """Schema para actualizar un permiso existente"""
    name: Optional[str] = Field(None, description="Nuevo nombre del permiso")
    description: Optional[str] = Field(None, description="Nueva descripción del permiso")

class PermissionResponse(PermissionBase):
    """Schema para respuesta de permiso"""
    id: int = Field(..., description="ID único del permiso")
    
    class Config:
        from_attributes = True

class PermissionCategory(BaseModel):
    """Schema para categoría de permisos"""
    name: str = Field(..., description="Nombre de la categoría", example="user")
    display_name: str = Field(..., description="Nombre amigable de la categoría", example="Usuarios")
    permissions: List[PermissionResponse] = Field(..., description="Lista de permisos en esta categoría")

class PermissionCheck(BaseModel):
    """Schema para verificación de permisos"""
    permission: str = Field(..., description="Nombre del permiso a verificar")
    has_permission: bool = Field(..., description="Si el usuario tiene el permiso")

class PermissionStats(BaseModel):
    """Schema para estadísticas de permisos"""
    total_permissions: int = Field(..., description="Total de permisos en el sistema")
    categories_count: int = Field(..., description="Número de categorías")
    permissions_by_category: dict = Field(..., description="Permisos agrupados por categoría")
    most_common_category: Optional[str] = Field(None, description="Categoría con más permisos")