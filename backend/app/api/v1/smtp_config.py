# app/api/v1/smtp_config.py
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status, Path, Body
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.auth.users import User
from app.schemas.common.email_config import (
    SmtpConfigurationCreate, 
    SmtpConfigurationUpdate, 
    SmtpConfigurationInDB,
    SmtpTestRequest
)
from app.services.smtp_service import SmtpService
from app.utils.error_handler import ErrorHandler
from app.api.deps import has_permission

router = APIRouter()

@router.get("/", response_model=List[SmtpConfigurationInDB])
def read_smtp_configs(
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("smtp_config_view"))
) -> Any:
    """
    Obtiene lista de configuraciones SMTP (requiere permiso smtp_config_view)
    """
    try:
        configs = SmtpService.get_smtp_configs(db)
        return configs
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "configuraciones SMTP")

@router.post("/", response_model=SmtpConfigurationInDB)
def create_smtp_config(
    config_in: SmtpConfigurationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("smtp_config_create"))
) -> Any:
    """
    Crea una nueva configuración SMTP (requiere permiso smtp_config_create)
    """
    try:
        config = SmtpService.create_smtp_config(db=db, config_data=config_in.dict())
        return config
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "crear", "configuración SMTP")

@router.get("/{config_id}", response_model=SmtpConfigurationInDB)
def read_smtp_config(
    config_id: int = Path(..., title="ID de la configuración SMTP"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("smtp_config_view"))
) -> Any:
    """
    Obtiene una configuración SMTP específica por ID (requiere permiso smtp_config_view)
    """
    try:
        config = SmtpService.get_smtp_config_by_id(db=db, config_id=config_id)
        return config
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "configuración SMTP")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.patch("/{config_id}", response_model=SmtpConfigurationInDB)
def update_smtp_config(
    config_id: int = Path(..., title="ID de la configuración SMTP"),
    config_in: SmtpConfigurationUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("smtp_config_edit"))
) -> Any:
    """
    Actualiza una configuración SMTP existente (requiere permiso smtp_config_edit)
    """
    try:
        config = SmtpService.update_smtp_config(
            db=db,
            config_id=config_id,
            config_data=config_in.dict(exclude_unset=True)
        )
        return config
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "actualizar", "configuración SMTP")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.delete("/{config_id}", response_model=SmtpConfigurationInDB)
def delete_smtp_config(
    config_id: int = Path(..., title="ID de la configuración SMTP"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("smtp_config_delete"))
) -> Any:
    """
    Elimina una configuración SMTP (requiere permiso smtp_config_delete)
    """
    try:
        config = SmtpService.delete_smtp_config(db=db, config_id=config_id)
        return config
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "eliminar", "configuración SMTP")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{config_id}/activate", response_model=SmtpConfigurationInDB)
def activate_smtp_config(
    config_id: int = Path(..., title="ID de la configuración SMTP"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("smtp_config_edit"))
) -> Any:
    """
    Activa una configuración SMTP (requiere permiso smtp_config_edit)
    """
    try:
        config = SmtpService.set_active_config(db=db, config_id=config_id)
        return config
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "activar", "configuración SMTP")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{config_id}/test", response_model=dict)
def test_smtp_config(
    config_id: int = Path(..., title="ID de la configuración SMTP"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("smtp_config_view"))
) -> Any:
    """
    Prueba una configuración SMTP (requiere permiso smtp_config_view)
    """
    try:
        success = SmtpService.test_smtp_config(db=db, config_id=config_id)
        return {"success": success, "message": "Conexión exitosa" if success else "Error de conexión"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al probar la configuración: {str(e)}"
        )

@router.post("/test-connection", response_model=dict)
def test_smtp_connection(
    config_in: SmtpTestRequest,
    current_user: User = Depends(has_permission("smtp_config_view"))
) -> Any:
    """
    Prueba una conexión SMTP con los datos proporcionados (sin guardar)
    """
    try:
        from app.services.email_service import test_smtp_connection
        
        success = test_smtp_connection(
            host=config_in.host,
            port=config_in.port,
            username=config_in.username,
            password=config_in.password,
            use_tls=config_in.use_tls,
            use_ssl=config_in.use_ssl,
            from_email=config_in.default_from_email
        )
        
        return {"success": success, "message": "Conexión exitosa" if success else "Error de conexión"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al probar la conexión: {str(e)}"
        )

@router.post("/send-test-email", response_model=dict)
def send_test_email(
    email_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("smtp_config_view"))
) -> Any:
    """
    Envía un correo de prueba usando la configuración SMTP activa
    """
    try:
        # Verificar que exista una configuración activa
        active_config = SmtpService.get_active_config(db)
        if not active_config:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No hay configuración SMTP activa"
            )
        
        # Extraer datos del correo
        to_email = email_data.get('to_email')
        subject = email_data.get('subject', 'Correo de prueba')
        message = email_data.get('message', 'Este es un correo de prueba enviado desde MediaLab Sistema.')
        
        if not to_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La dirección de correo destino es obligatoria"
            )
        
        # Intentar enviar el correo
        from app.services.email_service import send_notification_email
        success = send_notification_email(
            email_to=to_email,
            subject=subject,
            message=message
        )
        
        if success:
            return {"success": True, "message": f"Correo de prueba enviado exitosamente a {to_email}"}
        else:
            return {"success": False, "message": "Error al enviar el correo de prueba"}
    except Exception as e:
        logger.error(f"Error al enviar correo de prueba: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al enviar correo de prueba: {str(e)}"
        )