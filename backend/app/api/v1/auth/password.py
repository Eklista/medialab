from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.models.auth.users import User
from app.schemas.auth.users import UserPasswordChange, EmailSchema, ResetPasswordSchema
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/forgot-password")
def forgot_password(
    email_data: EmailSchema,
    db: Session = Depends(get_db)
) -> Any:
    """
    Envía un token de recuperación de contraseña
    """
    result = AuthService.generate_password_reset_token(db, email_data.email)
    
    # Si el resultado es exitoso, enviar email con el enlace
    if result:
        from app.services.email_service import send_reset_password_email
        
        # Obtener detalles del usuario para personalizar el email
        user = db.query(User).filter(User.email == email_data.email).first()
        
        if user:
            # Enviar el correo electrónico con el token
            success = send_reset_password_email(
                email_to=email_data.email,
                username=user.username,
                token=result['reset_token']
            )
            
            if success:
                print(f"Email de recuperación enviado a: {email_data.email}")
            else:
                print(f"Error al enviar email de recuperación a: {email_data.email}")
    
    # Siempre responder positivamente para evitar enumeración de usuarios
    return {"message": "Si el correo existe, recibirás instrucciones para restablecer tu contraseña"}

@router.post("/reset-password/{token}")
def reset_password(
    token: str,
    password_data: ResetPasswordSchema,
    db: Session = Depends(get_db)
) -> Any:
    """
    Restablece la contraseña mediante token
    """
    result = AuthService.reset_password(db, token, password_data.new_password)
    
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