# backend/app/api/v1/users/users.py
"""
# users.py
Módulo de gestión de usuarios
"""

from typing import List, Any, Dict
from fastapi import APIRouter, Depends, status, Body, UploadFile, File, Form, Path, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.auth.users import User
from app.schemas.users.users import UserCreate, UserUpdate, UserInDB, UserWithRoles
from app.controllers.users.user_controller import UserController
from app.utils.error_handler import ErrorHandler
from app.api.deps import (
    get_current_user, 
    get_current_active_user,
    has_permission,
    is_self_or_has_permission
)

router = APIRouter()

# ===== INFORMACIÓN DEL USUARIO ACTUAL =====

@router.get("/me", response_model=UserWithRoles)
def read_current_user(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtiene el usuario actualmente autenticado
    ✅ REFACTORIZADO: Usa UserController
    """
    return UserController.get_current_user_info(current_user)

@router.patch("/me", response_model=UserInDB)
def update_current_user(
    user_data: UserUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("profile_edit"))
) -> Any:
    """
    Actualiza información del usuario actual
    ✅ REFACTORIZADO: Usa UserController
    """
    return UserController.update_user(db, current_user.id, user_data, current_user)

@router.get("/me/permissions", response_model=List[str])
def get_current_user_permissions(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtiene los permisos del usuario actualmente autenticado
    ✅ REFACTORIZADO: Usa UserController
    """
    return UserController.get_user_permissions(current_user)

# ===== GESTIÓN DE USUARIOS =====

@router.get("/", response_model=List[UserWithRoles])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("user_view"))
) -> Any:
    """
    Obtiene lista de usuarios (requiere permiso user_view)
    ✅ REFACTORIZADO: Usa UserController
    """
    return UserController.get_users_list(db, skip, limit)

@router.post("/", response_model=UserInDB, status_code=status.HTTP_201_CREATED)
def create_new_user(
    user_in: UserCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("user_create"))
) -> Any:
    """
    Crea un nuevo usuario (requiere permiso user_create)
    ✅ REFACTORIZADO: Usa UserController
    """
    return UserController.create_new_user(db, user_in, current_user)

@router.get("/{user_id}", response_model=UserWithRoles)
def read_user_by_id(
    user_id: int = Path(..., title="ID del usuario"),
    db: Session = Depends(get_db),
    current_user: User = Depends(is_self_or_has_permission("user_id", "user_view"))
) -> Any:
    """
    Obtiene un usuario por ID (propio usuario o requiere permiso user_view)
    ✅ REFACTORIZADO: Usa UserController
    """
    return UserController.get_user_by_id(db, user_id, current_user)

@router.patch("/{user_id}", response_model=UserInDB)
def update_user(
    user_id: int = Path(..., title="ID del usuario"),
    user_data: UserUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(is_self_or_has_permission("user_id", "user_edit"))
) -> Any:
    """
    Actualiza información de un usuario (propio usuario o requiere permiso user_edit)
    ✅ REFACTORIZADO: Usa UserController
    """
    return UserController.update_user(db, user_id, user_data, current_user)

@router.delete("/{user_id}", response_model=UserInDB)
def delete_user(
    user_id: int = Path(..., title="ID del usuario"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("user_delete"))
) -> Any:
    """
    Elimina un usuario (requiere permiso user_delete)
    ✅ REFACTORIZADO: Usa UserController
    """
    return UserController.delete_user(db, user_id, current_user)

# ===== PERFIL COMPLETO MEJORADO =====

@router.get("/me/enhanced", response_model=Dict[str, Any])
def read_current_user_enhanced(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    🆕 PERFIL COMPLETO MEJORADO PARA FRONTEND
    Incluye todo lo que el frontend necesita
    """
    return UserController.get_current_user_info_enhanced(current_user)

@router.get("/formatted")
def read_users_formatted(
    skip: int = 0,
    limit: int = 100,
    format_type: str = Query("with_roles", description="Tipo de formato: basic, detailed, with_roles, complete"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("user_view"))
) -> Any:
    """
    🆕 LISTA DE USUARIOS CON FORMATO ESPECÍFICO
    Permite elegir el nivel de detalle necesario
    """
    return UserController.get_users_list_formatted(db, skip, limit, format_type)

@router.get("/active-menu")
def get_active_users_menu(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    🆕 USUARIOS ACTIVOS PARA MENÚ/SIDEBAR
    Optimizado para mostrar en interfaces de usuario
    """
    return UserController.get_active_users_for_menu(db, limit)

# ===== GESTIÓN DE ROLES =====

@router.post("/{user_id}/roles", status_code=status.HTTP_200_OK)
def assign_role_to_user(
    user_id: int = Path(..., title="ID del usuario"),
    roleId: str = Body(...),
    areaId: str = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("user_edit"))
) -> Any:
    """
    Asigna un rol a un usuario (requiere permiso user_edit)
    ✅ REFACTORIZADO: Usa UserController
    """
    return UserController.assign_role_to_user(db, user_id, roleId, areaId, current_user)

# ===== GESTIÓN DE IMÁGENES =====

@router.post("/upload-image", status_code=status.HTTP_200_OK)
def upload_user_image(
    file: UploadFile = File(...),
    type: str = Form(..., description="Tipo de imagen: 'profile' o 'banner'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Sube una imagen de perfil o banner para el usuario
    ✅ REFACTORIZADO: Usa UserController con mejor validación
    """
    return UserController.upload_user_image(db, file, type, current_user)

