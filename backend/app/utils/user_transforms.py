from typing import Dict, Any
from app.models.auth.users import User

def transform_user_with_roles(user: User) -> Dict[str, Any]:
    """
    Transforma un objeto usuario de SQLAlchemy en un diccionario
    con los roles convertidos a strings
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