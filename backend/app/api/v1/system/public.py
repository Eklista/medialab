# app/api/v1/public.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any
import logging

from app.database import get_db
from app.models.organization.departments import Department
from app.schemas.organization.departments import DepartmentInDB
from app.models.organization.services import Service
from app.schemas.organization.services import ServiceWithSubServices
from app.schemas.templates.service_templates import ServiceTemplateWithServices
from app.services.templates.service_template_service import ServiceTemplateService


logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/departments", response_model=List[DepartmentInDB])
def read_public_departments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> Any:
    """
    Endpoint público para obtener departamentos (no requiere autenticación)
    """
    try:
        departments = db.query(Department).offset(skip).limit(limit).all()
        return departments
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener departamentos: {str(e)}"
        )

@router.get("/services", response_model=List[ServiceWithSubServices])
def read_public_services(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> Any:
    """
    Endpoint público para obtener servicios con sus sub-servicios (no requiere autenticación)
    """
    try:
        from sqlalchemy.orm import joinedload
        services = db.query(Service).options(joinedload(Service.sub_services)).offset(skip).limit(limit).all()
        return services
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener servicios: {str(e)}"
        )

@router.get("/templates", response_model=List[ServiceTemplateWithServices])
def read_public_templates(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> Any:
    """
    Obtiene lista de plantillas de servicios públicas (sin autenticación)
    """
    templates = ServiceTemplateService.get_public_templates(db=db, skip=skip, limit=limit)
    return templates

@router.get("/templates/{template_id}/services")
def get_public_template_services(
    template_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """
    Obtiene los servicios asociados a una plantilla pública (sin autenticación)
    """
    try:
        # Verificar que la plantilla sea pública
        template = db.query(ServiceTemplate).filter(
            ServiceTemplate.id == template_id,
            ServiceTemplate.is_public == True
        ).first()
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plantilla no encontrada o no es pública"
            )
        
        # Usar el mismo servicio de templates pero añadiendo validación de plantilla pública
        return ServiceTemplateService.get_template_service_relations(db=db, template_id=template_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener servicios de plantilla: {str(e)}"
        )

@router.get("/templates/{template_id}/subservices")
def get_public_template_subservices(
    template_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """
    Obtiene los subservicios asociados a una plantilla pública (sin autenticación)
    """
    try:
        # Verificar que la plantilla sea pública
        template = db.query(ServiceTemplate).filter(
            ServiceTemplate.id == template_id,
            ServiceTemplate.is_public == True
        ).first()
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plantilla no encontrada o no es pública"
            )
        
        # Usar el mismo servicio de templates pero añadiendo validación de plantilla pública
        return ServiceTemplateService.get_template_subservice_relations(db=db, template_id=template_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener subservicios de plantilla: {str(e)}"
        )

@router.get("/online-users")
def get_public_online_users(
    db: Session = Depends(get_db)
    # 🔥 SIN ningún dependency de autenticación
) -> dict:
    """
    📊 USUARIOS ONLINE PÚBLICO - SIN AUTENTICACIÓN
    Para uso del frontend sin requerir login
    """
    try:
        from datetime import datetime, timedelta
        from sqlalchemy import and_
        from app.models.auth.users import User
        
        logger.info("📊 [PUBLIC] Obteniendo usuarios online sin autenticación")
        
        # Threshold para usuarios recientes (últimos 15 minutos)
        recent_threshold = datetime.utcnow() - timedelta(minutes=15)
        
        # Query simple: usuarios activos que han hecho login recientemente
        online_users = db.query(User).filter(
            and_(
                User.is_active == True,
                User.last_login.isnot(None),
                User.last_login >= recent_threshold
            )
        ).order_by(User.last_login.desc()).limit(20).all()
        
        # Formatear usuarios
        formatted_users = []
        for user in online_users:
            try:
                # Nombres
                first_name = getattr(user, 'first_name', '') or ''
                last_name = getattr(user, 'last_name', '') or ''
                
                if first_name and last_name:
                    full_name = f"{first_name} {last_name}"
                    initials = f"{first_name[0]}{last_name[0]}".upper()
                elif first_name:
                    full_name = first_name
                    initials = first_name[0].upper()
                else:
                    full_name = user.email.split('@')[0] if user.email else f"Usuario {user.id}"
                    initials = full_name[0].upper() if full_name else "U"
                
                # Estado basado en última actividad
                last_login = getattr(user, 'last_login', None)
                is_online = False
                status = "offline"
                
                if last_login:
                    minutes_ago = (datetime.utcnow() - last_login).total_seconds() / 60
                    if minutes_ago <= 5:
                        status = "online"
                        is_online = True
                    elif minutes_ago <= 15:
                        status = "away"
                        is_online = True
                
                user_data = {
                    "id": user.id,
                    "name": full_name,
                    "fullName": full_name,
                    "initials": initials,
                    "email": user.email or "",
                    "profileImage": getattr(user, 'profile_image', None),
                    "status": status,
                    "isOnline": bool(is_online),
                    "lastSeen": last_login.isoformat() if last_login else None,
                    "lastLogin": last_login.isoformat() if last_login else None
                }
                
                formatted_users.append(user_data)
                
            except Exception as user_error:
                logger.warning(f"⚠️ Error formateando usuario {getattr(user, 'id', '?')}: {user_error}")
                continue
        
        # Respuesta
        response = {
            "users": formatted_users,
            "total": len(formatted_users),
            "totalOnline": len([u for u in formatted_users if u["status"] == "online"]),
            "totalActive": len([u for u in formatted_users if u["isOnline"]]),
            "timestamp": datetime.utcnow().isoformat(),
            "success": True,
            "source": "public_endpoint"
        }
        
        logger.info(f"✅ [PUBLIC] Respuesta exitosa: {len(formatted_users)} usuarios")
        return response
        
    except Exception as e:
        logger.error(f"💥 [PUBLIC] Error obteniendo usuarios online: {e}")
        
        # Respuesta de error
        return {
            "users": [],
            "total": 0,
            "totalOnline": 0,
            "totalActive": 0,
            "timestamp": datetime.utcnow().isoformat(),
            "success": False,
            "error": str(e),
            "source": "public_endpoint"
        }