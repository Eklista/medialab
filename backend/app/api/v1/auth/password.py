from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.models.auth.users import User
from app.schemas.auth.users import UserPasswordChange
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/forgot-password")
def forgot_password(
    email: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Envía un token de recuperación de contraseña
    """
    result = AuthService.generate_password_reset_token(db, email)
    
    # Siempre responder positivamente para evitar enumeración de usuarios
    # El email solo se enviará si existe el usuario y está activo
    
    # Aquí normalmente enviaríamos un email con el enlace de recuperación
    if result:
        # Simulado por ahora, en un entorno real enviaríamos un email
        # usando un servicio de email
        reset_url = f"/reset-password/{result['reset_token']}"
        print(f"URL de recuperación para {result['email']}: {reset_url}")
    
    return {"message": "Si el correo existe, recibirás instrucciones para restablecer tu contraseña"}

@router.post("/reset-password/{token}")
def reset_password(
    token: str,
    new_password: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Restablece la contraseña mediante token
    """
    result = AuthService.reset_password(db, token, new_password)
    
    if result:
        return {"message": "Contraseña restablecida exitosamente"}
    else:
        # Este caso no debería ocurrir ya que la función reset_password lanza excepciones
        # en caso de error, pero lo incluimos por completitud
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al restablecer la contraseña"
        )

@router.post("/change-password")
def change_password(
    password_data: UserPasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Cambia la contraseña del usuario autenticado
    """
    result = UserService.change_password(
        db=db, 
        user_id=current_user.id,
        current_password=password_data.current_password,
        new_password=password_data.new_password
    )
    
    if result:
        return {"message": "Contraseña actualizada exitosamente"}
    else:
        # Este caso no debería ocurrir ya que la función change_password lanza excepciones
        # en caso de error, pero lo incluimos por completitud
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al cambiar la contraseña"
        )