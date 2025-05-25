# En backend/app/utils/user_transforms.py

from typing import Dict, Any
from app.models.auth.users import User
from sqlalchemy import text
from app.database import SessionLocal

def transform_user_with_roles(user: User) -> Dict[str, Any]:
    """
    Transforma un objeto usuario de SQLAlchemy en un diccionario
    con los roles convertidos a strings y las áreas asociadas
    
    ACTUALIZADO: Incluye TODOS los campos del usuario para evitar
    inconsistencias entre endpoints
    """
    # Obtener información de las áreas asociadas a este usuario
    db = SessionLocal()
    try:
        # Obtener las áreas asociadas a los roles del usuario
        query = text("""
            SELECT a.id, a.name 
            FROM areas a 
            JOIN user_roles ur ON a.id = ur.area_id 
            WHERE ur.user_id = :user_id
        """)
        result = db.execute(query, {"user_id": user.id}).fetchall()
        
        # Crear diccionario de áreas por su ID
        areas = []
        if result:
            areas = [{"id": row[0], "name": row[1]} for row in result]
    finally:
        db.close()
    
    # ACTUALIZADO: Incluir TODOS los campos del usuario
    user_dict = {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        
        # 🆕 CAMPOS QUE ESTABAN FALTANDO:
        "profile_image": user.profile_image,
        "banner_image": user.banner_image,
        "phone": user.phone,
        "birth_date": user.birth_date,
        
        # Campos de fechas y estado
        "join_date": user.join_date,
        "last_login": user.last_login,
        "is_active": user.is_active,
        "is_online": user.is_online,
        
        # Campos relacionales
        "roles": [role.name for role in user.roles],
        "areas": areas  # Información de áreas
    }
    return user_dict