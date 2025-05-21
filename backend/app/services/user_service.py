from dotenv import load_dotenv
import os
from typing import List, Optional, Dict, Any
from datetime import date
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.user_repository import UserRepository
from app.models.auth.users import User
from app.schemas.auth.users import UserCreate, UserUpdate
from app.config.security import get_password_hash, verify_password
from app.services.email_service import send_email


class UserService:
    """
    Servicio para gestionar lógica de negocio relacionada con usuarios
    """
    
    @staticmethod
    def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """
        Obtiene lista de usuarios
        """
        return UserRepository.get_all(db, skip, limit)
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> User:
        """
        Obtiene usuario por ID, lanza excepción si no existe
        """
        user = UserRepository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        return user
    
    @staticmethod
    def get_user_with_roles(db: Session, user_id: int) -> User:
        """
        Obtiene usuario con roles cargados, lanza excepción si no existe
        """
        user = UserRepository.get_with_roles(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        return user
    
    @staticmethod
    def create_user(db: Session, user_data: Dict[str, Any]) -> User:
        """
        Crea un nuevo usuario y envía un correo de bienvenida
        """
        # Verificar si el email ya existe
        if UserRepository.get_by_email(db, user_data["email"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico ya está registrado"
            )
        
        # Verificar si el username ya existe
        if UserRepository.get_by_username(db, user_data["username"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya está registrado"
            )
        
        # Hashear la contraseña
        if "password" in user_data:
            user_data["password_hash"] = get_password_hash(user_data["password"])
            del user_data["password"]
        
        # Si no se especifica fecha de ingreso, usar fecha actual
        if "join_date" not in user_data:
            user_data["join_date"] = date.today()
        
        # Si no se especifica estado activo, establecer como activo
        if "is_active" not in user_data:
            user_data["is_active"] = True

        # Crear el usuario
        new_user = UserRepository.create(db, user_data)

        # Enviar un correo de bienvenida
        try:
            UserService.send_welcome_email(new_user.email, new_user.username)  # Usamos el método estático
        except Exception as e:
            # Si ocurre un error en el envío del correo, loguear pero no fallar la creación del usuario
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error al enviar el correo de bienvenida: {str(e)}")

        return new_user

    @staticmethod
    def send_welcome_email(email: str, username: str) -> None:
        """
        Envía un correo de bienvenida después de crear el usuario
        """
        from app.database import get_db
        from app.services.smtp_service import SmtpService
        
        # URL directa en producción para evitar problemas con variables de entorno
        recovery_link = "https://medialab.eklista.com/password-recovery"
        subject = "Bienvenido a MediaLab Sistema"
        
        html_template = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fb; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h2 style="color: #181c24;">¡Bienvenido a <span style="color: #7758ff;">MediaLab</span>, {username}!</h2>
            
            <div style="background-color: #eff6ff; padding: 16px; border-left: 4px solid #7758ff; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #181c24;">
                    Te informamos que tu cuenta en la plataforma MediaLab ha sido creada exitosamente. Para poder ingresar por primera vez, sigue estos sencillos pasos:
                </p>
                <ol style="margin: 10px 0 0 20px; color: #6b7280;">
                    <li>Haz clic en el botón de abajo para ir a la página de recuperación de contraseña.</li>
                    <li>Ingresa el correo electrónico con el que te registraste ({email}).</li>
                    <li>Sigue las instrucciones para crear tu contraseña.</li>
                    <li>Una vez creada tu contraseña, podrás iniciar sesión en MediaLab.</li>
                </ol>
            </div>
            
            <p style="color: #181c24; margin-bottom: 20px;">
                Una vez que hayas ingresado al sistema, es importante que completes tu perfil de la siguiente manera:
            </p>
            <ol style="margin: 0 0 0 20px; color: #6b7280;">
                <li>Dirígete a la sección <strong>"Mi perfil"</strong> en el menú principal.</li>
                <li>Haz clic en el botón <strong>"Completar perfil"</strong>.</li>
                <li><strong>Es obligatorio</strong> que subas una fotografía tuya como foto de perfil.</li>
                <li>En el banner de perfil, puedes colocar la imagen que desees.</li>
                <li>Tu número de teléfono es opcional.</li>
                <li><strong>Es obligatorio</strong> que ingreses tu fecha de nacimiento.</li>
            </ol>
            
            <div style="text-align: center; margin-top: 30px;">
                <a href="{recovery_link}" style="background-color: #7758ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
                    Crear mi contraseña
                </a>
            </div>
            
            <p style="margin-top: 40px; font-size: 14px; color: #6b7280;">
                Si tienes alguna pregunta o necesitas ayuda en cualquier momento, no dudes en contactar a nuestro equipo de soporte de MediaLab.
            </p>
        </div>
        """
        
        # Versión de texto plano para clientes que no soportan HTML
        text_content = f"""
        ¡Bienvenido a MediaLab, {username}!
        
        Te informamos que tu cuenta en la plataforma MediaLab ha sido creada exitosamente. Para poder ingresar por primera vez, sigue estos sencillos pasos:
        
        1. Visita la página de recuperación de contraseña: {recovery_link}
        2. Ingresa el correo electrónico con el que te registraste ({email}).
        3. Sigue las instrucciones para crear tu contraseña.
        4. Una vez creada tu contraseña, podrás iniciar sesión en MediaLab.
        
        Una vez que hayas ingresado al sistema, es importante que completes tu perfil de la siguiente manera:
        
        1. Dirígete a la sección "Mi perfil" en el menú principal.
        2. Haz clic en el botón "Completar perfil".
        3. Es obligatorio que subas una fotografía tuya como foto de perfil.
        4. En el banner de perfil, puedes colocar la imagen que desees.
        5. Tu número de teléfono es opcional.
        6. Es obligatorio que ingreses tu fecha de nacimiento.
        
        Si tienes alguna pregunta o necesitas ayuda en cualquier momento, no dudes en contactar a nuestro equipo de soporte de MediaLab.
        """
        
        try:
            print(f"Intentando enviar correo de bienvenida a {email}")
            
            # Obtener sesión de base de datos
            db = next(get_db())
            
            try:
                # Verificar si hay una configuración SMTP activa
                active_config = SmtpService.get_active_config(db)
                
                if not active_config:
                    print("No hay configuración SMTP activa. No se puede enviar el correo de bienvenida.")
                    return False
                
                # Enviar correo utilizando el servicio SMTP
                success = send_email(
                    email_to=email,
                    subject=subject,
                    html_template=html_template,
                    environment={"username": username, "email": email, "recovery_link": recovery_link}
                )
                
                if success:
                    print(f"Correo de bienvenida enviado exitosamente a {email}")
                else:
                    print(f"Error al enviar correo de bienvenida a {email} - Falló el envío")
                
                return success
            except Exception as e:
                print(f"Error en la comunicación con el servidor SMTP: {str(e)}")
                raise e
            finally:
                db.close()
        except Exception as e:
            print(f"Error general al enviar correo de bienvenida: {str(e)}")
            return False

    
    @staticmethod
    def update_user(db: Session, user_id: int, user_data: Dict[str, Any]) -> User:
        """
        Actualiza un usuario existente
        """
        user = UserRepository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        # Si se actualiza el email, verificar que no exista
        if "email" in user_data and user_data["email"] != user.email:
            existing_user = UserRepository.get_by_email(db, user_data["email"])
            if existing_user and existing_user.id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El correo electrónico ya está registrado"
                )
        
        # Si se actualiza el username, verificar que no exista
        if "username" in user_data and user_data["username"] != user.username:
            existing_user = UserRepository.get_by_username(db, user_data["username"])
            if existing_user and existing_user.id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El nombre de usuario ya está registrado"
                )
        
        return UserRepository.update(db, user, user_data)
    
    @staticmethod
    def delete_user(db: Session, user_id: int) -> User:
        """
        Elimina un usuario
        """
        user = UserRepository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        return UserRepository.delete(db, user)
    
    @staticmethod
    def assign_role(db: Session, user_id: int, role_id: int, area_id: int) -> bool:
        """
        Asigna un rol a un usuario
        """
        # Verificar que el usuario existe
        user = UserRepository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        return UserRepository.assign_role(db, user_id, role_id, area_id)
    
    @staticmethod
    def verify_password(db: Session, user_id: int, password: str) -> bool:
        """
        Verifica la contraseña de un usuario
        """
        user = UserRepository.get_by_id(db, user_id)
        if not user:
            return False
        
        return verify_password(password, user.password_hash)
    
    @staticmethod
    def change_password(db: Session, user_id: int, current_password: str, new_password: str) -> bool:
        """
        Cambia la contraseña de un usuario, verificando la contraseña actual
        """
        user = UserRepository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        if not verify_password(current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contraseña actual incorrecta"
            )
        
        user.password_hash = get_password_hash(new_password)
        db.commit()
        
        return True

    @staticmethod
    def get_full_name(user: User) -> str:
        """
        Retorna el nombre completo del usuario
        """
        return f"{user.first_name} {user.last_name}"

    @staticmethod
    def set_password(user: User, password: str) -> None:
        """
        Establece el hash de la contraseña de forma segura
        """
        user.password_hash = get_password_hash(password)

    @staticmethod
    def check_password(user: User, password: str) -> bool:
        """
        Verifica si la contraseña es correcta
        """
        return verify_password(password, user.password_hash)

    @staticmethod
    def generate_reset_token(user: User, expires_in: int = 3600) -> str:
        """
        Genera un token de recuperación de contraseña
        """
        import secrets
        from datetime import datetime, timedelta
        
        user.reset_token = secrets.token_urlsafe(32)
        user.reset_token_expires = datetime.utcnow() + timedelta(seconds=expires_in)
        return user.reset_token