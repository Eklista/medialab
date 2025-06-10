# backend/app/api/v1/communication/smtp_config.py
from app.controllers.communication.smtp_controller import SmtpController
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status, Path, Body
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.auth.users import User
from app.schemas.communication.email_config import (
    SmtpConfigurationCreate, 
    SmtpConfigurationUpdate, 
    SmtpConfigurationInDB,
    SmtpTestRequest
)
from app.services.communication.smtp_service import SmtpService
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
    ✅ REFACTORIZADO: Usa SmtpController
    """
    return SmtpController.get_smtp_configs_list(db, current_user)

@router.post("/", response_model=SmtpConfigurationInDB)
def create_smtp_config(
    config_in: SmtpConfigurationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("smtp_config_create"))
) -> Any:
    """
    Crea una nueva configuración SMTP (requiere permiso smtp_config_create)
    ✅ REFACTORIZADO: Usa SmtpController
    """
    return SmtpController.create_smtp_config(db, config_in, current_user)

@router.get("/{config_id}", response_model=SmtpConfigurationInDB)
def read_smtp_config(
    config_id: int = Path(..., title="ID de la configuración SMTP"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("smtp_config_view"))
) -> Any:
    """
    Obtiene una configuración SMTP específica por ID (requiere permiso smtp_config_view)
    ✅ REFACTORIZADO: Usa SmtpController
    """
    return SmtpController.get_smtp_config_by_id(db, config_id, current_user)

@router.patch("/{config_id}", response_model=SmtpConfigurationInDB)
def update_smtp_config(
    config_id: int = Path(..., title="ID de la configuración SMTP"),
    config_in: SmtpConfigurationUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("smtp_config_edit"))
) -> Any:
    """
    Actualiza una configuración SMTP existente (requiere permiso smtp_config_edit)
    ✅ REFACTORIZADO: Usa SmtpController
    """
    return SmtpController.update_smtp_config(db, config_id, config_in, current_user)

@router.delete("/{config_id}", response_model=SmtpConfigurationInDB)
def delete_smtp_config(
    config_id: int = Path(..., title="ID de la configuración SMTP"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("smtp_config_delete"))
) -> Any:
    """
    Elimina una configuración SMTP (requiere permiso smtp_config_delete)
    ✅ REFACTORIZADO: Usa SmtpController
    """
    return SmtpController.delete_smtp_config(db, config_id, current_user)

@router.post("/{config_id}/activate", response_model=SmtpConfigurationInDB)
def activate_smtp_config(
    config_id: int = Path(..., title="ID de la configuración SMTP"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("smtp_config_edit"))
) -> Any:
    """
    Activa una configuración SMTP (requiere permiso smtp_config_edit)
    ✅ REFACTORIZADO: Usa SmtpController
    """
    return SmtpController.activate_smtp_config(db, config_id, current_user)

@router.post("/{config_id}/test", response_model=dict)
def test_smtp_config(
    config_id: int = Path(..., title="ID de la configuración SMTP"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("smtp_config_view"))
) -> Any:
    """
    Prueba una configuración SMTP (requiere permiso smtp_config_view)
    ✅ REFACTORIZADO: Usa SmtpController
    """
    return SmtpController.test_smtp_config(db, config_id, current_user)

@router.post("/test-connection", response_model=dict)
def test_smtp_connection(
    config_in: SmtpTestRequest,
    current_user: User = Depends(has_permission("smtp_config_view"))
) -> Any:
    """
    Prueba una conexión SMTP con los datos proporcionados (sin guardar)
    ✅ REFACTORIZADO: Usa SmtpController
    """
    return SmtpController.test_smtp_connection(config_in, current_user)

@router.post("/send-test-email", response_model=dict)
def send_test_email(
    email_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("smtp_config_view"))
) -> Any:
    """
    Envía un correo de prueba usando la configuración SMTP activa.
    ✅ REFACTORIZADO: Usa SmtpController (toda la lógica compleja movida)
    """
    return SmtpController.send_test_email(db, email_data, current_user)