# app/api/v1/email_templates.py
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status, Path, Body
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.auth.users import User
from app.schemas.common.email_template import (
    EmailTemplateUpdate, 
    EmailTemplateInDB
)
from app.services.email_template_service import EmailTemplateService
from app.utils.error_handler import ErrorHandler
from app.api.deps import has_permission

router = APIRouter()

@router.get("/", response_model=List[EmailTemplateInDB])
def read_email_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("email_template_view"))
) -> Any:
    """
    Obtiene lista de plantillas de correo (requiere permiso email_template_view)
    """
    try:
        templates = EmailTemplateService.get_email_templates(db)
        return templates
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "plantillas de correo")

@router.get("/{template_id}", response_model=EmailTemplateInDB)
def read_email_template(
    template_id: int = Path(..., title="ID de la plantilla de correo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("email_template_view"))
) -> Any:
    """
    Obtiene una plantilla de correo específica por ID (requiere permiso email_template_view)
    """
    try:
        template = EmailTemplateService.get_template_by_id(db=db, template_id=template_id)
        return template
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "plantilla de correo")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.get("/code/{code}", response_model=EmailTemplateInDB)
def read_email_template_by_code(
    code: str = Path(..., title="Código de la plantilla de correo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("email_template_view"))
) -> Any:
    """
    Obtiene una plantilla de correo por su código (requiere permiso email_template_view)
    """
    try:
        template = EmailTemplateService.get_template_by_code(db=db, code=code)
        return template
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "obtener", "plantilla de correo")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.patch("/{template_id}", response_model=EmailTemplateInDB)
def update_email_template(
    template_id: int = Path(..., title="ID de la plantilla de correo"),
    template_in: EmailTemplateUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("email_template_edit"))
) -> Any:
    """
    Actualiza una plantilla de correo existente (requiere permiso email_template_edit).
    Solo permite modificar el contenido, asunto y descripción, manteniendo el código único.
    """
    try:
        # No permitir cambiar el código de la plantilla
        if hasattr(template_in, "code") and template_in.code is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se permite cambiar el código de la plantilla"
            )
            
        template = EmailTemplateService.update_template(
            db=db,
            template_id=template_id,
            template_data=template_in.dict(exclude_unset=True)
        )
        return template
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_db_error(e, "actualizar", "plantilla de correo")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.post("/{code}/render", response_model=dict)
def render_email_template(
    code: str = Path(..., title="Código de la plantilla"),
    context: dict = Body(..., title="Contexto para renderizar la plantilla"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("email_template_view"))
) -> Any:
    """
    Renderiza una plantilla de correo con el contexto proporcionado (requiere permiso email_template_view)
    """
    try:
        rendered_html = EmailTemplateService.render_template(
            db=db,
            code=code,
            context=context
        )
        return {"html": rendered_html}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/send-test", response_model=dict)
def send_test_email_with_template(
    email_data: dict = Body(..., 
        example={
            "to_email": "destinatario@ejemplo.com",
            "template_code": "welcome_email",
            "context": {"username": "Usuario Test", "email": "correo@ejemplo.com", "recovery_link": "#"},
            "subject_override": None
        }
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("email_template_view"))
) -> Any:
    """
    Envía un correo de prueba utilizando una plantilla (requiere permiso email_template_view)
    """
    from app.services.email_service import send_email_with_template
    
    try:
        # Verificar datos requeridos
        if not email_data.get("to_email") or not email_data.get("template_code"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Se requiere to_email y template_code"
            )
        
        # Intentar enviar el correo
        success = send_email_with_template(
            email_to=email_data["to_email"],
            template_code=email_data["template_code"],
            context=email_data.get("context", {}),
            subject_override=email_data.get("subject_override")
        )
        
        if success:
            return {"success": True, "message": f"Correo enviado exitosamente a {email_data['to_email']}"}
        else:
            return {"success": False, "message": "Error al enviar el correo de prueba"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al enviar correo de prueba: {str(e)}"
        )