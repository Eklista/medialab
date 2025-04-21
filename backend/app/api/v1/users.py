from typing import List, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy import text, insert

from app.database import get_db
from datetime import datetime
from sqlalchemy import text, insert
from app.models.auth.users import User
from app.models.auth.roles import Role
from app.models.organization.areas import Area
from app.schemas.auth.users import UserCreate, UserUpdate, UserInDB, UserWithRoles
from app.services.auth_service import create_user, get_user_by_id
from app.api.deps import get_current_user, get_current_active_superuser, get_current_active_user

router = APIRouter()

class UserRoleTransformer(BaseModel):
    """Modelo Pydantic para transformar un usuario con sus roles"""
    id: int
    email: str
    username: str
    first_name: str
    last_name: str
    profile_image: str = None
    banner_image: str = None
    phone: str = None
    birth_date: Any = None
    join_date: Any = None
    last_login: Any = None
    is_active: bool = True
    is_online: bool = False
    roles: List[str] = []

    class Config:
        orm_mode = True

def transform_user_with_roles(user: User) -> Dict:
    """
    Transforma un objeto usuario de SQLAlchemy en un diccionario
    con los roles convertidos a strings utilizando Pydantic
    """
    user_dict = {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "profile_image": user.profile_image,
        "banner_image": user.banner_image,
        "phone": user.phone,
        "birth_date": user.birth_date,
        "join_date": user.join_date,
        "last_login": user.last_login,
        "is_active": user.is_active,
        "is_online": user.is_online,
        "roles": [role.name for role in user.roles]
    }
    return user_dict

@router.get("/me", response_model=UserWithRoles)
def read_current_user(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Obtiene el usuario actualmente autenticado
    """
    return transform_user_with_roles(current_user)

@router.patch("/me", response_model=UserInDB)
def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Actualiza información del usuario actual
    """
    try:
        for field, value in user_data.dict(exclude_unset=True).items():
            setattr(current_user, field, value)
       
        db.commit()
        db.refresh(current_user)
       
        return current_user
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar usuario: {str(e)}"
        )

@router.get("/", response_model=List[UserWithRoles])
def read_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db)
) -> Any:
    """
    Obtiene lista de usuarios (solo para superusuarios)
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return [transform_user_with_roles(user) for user in users]

@router.post("/", response_model=UserInDB)
def create_new_user(
    user_in: UserCreate,
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db)
) -> Any:
    """
    Crea un nuevo usuario (solo para superusuarios)
    """
    try:
        # Extraer los datos básicos de usuario
        user_data = user_in.dict(exclude={"roleId", "areaId"})
        
        # Crear el usuario
        new_user = create_user(db, user_data)
        
        # Si se proporcionaron roleId y areaId, asignar el rol
        if hasattr(user_in, "roleId") and hasattr(user_in, "areaId") and user_in.roleId and user_in.areaId:
            try:
                # Añadir entrada en la tabla user_roles
                db.execute(
                    insert(user_roles).values(
                        user_id=new_user.id,
                        role_id=int(user_in.roleId),
                        area_id=int(user_in.areaId),
                        assigned_at=datetime.utcnow()
                    )
                )
                db.commit()
            except Exception as role_error:
                # Logear el error pero continuar
                logger.error(f"Error al asignar rol: {str(role_error)}")
        
        # Refrescar el usuario para incluir el rol asignado
        db.refresh(new_user)
        return new_user
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear usuario: {str(e)}"
        )

@router.get("/{user_id}", response_model=UserWithRoles)
def read_user_by_id(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Obtiene un usuario por ID
    """
    user = get_user_by_id(db, user_id)
   
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
   
    # Solo superusuarios pueden ver otros usuarios
    if user.id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos suficientes"
        )
   
    return transform_user_with_roles(user)

@router.patch("/{user_id}", response_model=UserInDB)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db)
) -> Any:
    """
    Actualiza información de un usuario (solo para superusuarios)
    """
    try:
        user = get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        for field, value in user_data.dict(exclude_unset=True).items():
            setattr(user, field, value)
        
        db.commit()
        db.refresh(user)
        
        return user
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar usuario: {str(e)}"
        )

@router.delete("/{user_id}", response_model=UserInDB)
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db)
) -> Any:
    """
    Elimina un usuario (solo para superusuarios)
    """
    try:
        if user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puedes eliminar tu propio usuario"
            )
            
        user = get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        db.delete(user)
        db.commit()
        
        return user
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar usuario: {str(e)}"
        )

@router.post("/{user_id}/roles", status_code=status.HTTP_200_OK)
def assign_role_to_user(
    user_id: int,
    roleId: str = Body(...),
    areaId: str = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Asigna un rol a un usuario (solo para superusuarios)
    """
    try:
        user = get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        # Verificar que el rol existe
        role = db.query(Role).filter(Role.id == int(roleId)).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Rol no encontrado"
            )
        
        # Verificar que el área existe
        area = db.query(Area).filter(Area.id == int(areaId)).first()
        if not area:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Área no encontrada"
            )
        
        # Eliminar asignaciones de rol actuales si existen
        db.execute(
            text("DELETE FROM user_roles WHERE user_id = :user_id"),
            {"user_id": user.id}
        )
        
        # Insertar nueva asignación de rol
        db.execute(
            insert(user_roles).values(
                user_id=user.id,
                role_id=int(roleId),
                area_id=int(areaId),
                assigned_at=datetime.utcnow()
            )
        )
        
        db.commit()
        
        return {"message": f"Rol asignado exitosamente al usuario {user.full_name}"}
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al asignar rol: {str(e)}"
        )