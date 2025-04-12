from typing import List, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from pydantic import BaseModel

from app.database import get_db
from app.models.auth.users import User
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
        user_data = user_in.dict()
        return create_user(db, user_data)
    except SQLAlchemyError as e:
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