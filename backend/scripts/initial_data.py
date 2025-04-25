#!/usr/bin/env python3
# app/initial_data.py

import logging
import sys
from datetime import datetime, date

from sqlalchemy.orm import Session
from sqlalchemy import insert

from app.database import SessionLocal
from app.models.auth.users import User
from app.models.associations import user_roles
from app.models.auth.roles import Role
from app.models.auth.permissions import Permission
from app.models.organization.areas import Area
from app.config.security import get_password_hash

# Configuración de logging más detallada
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

def init_db() -> None:
    logger.info("Creando conexión a la base de datos...")
    db = SessionLocal()
    
    try:
        logger.info("Verificando si ya existen datos iniciales...")
        # Verificar si ya existen datos para evitar duplicación
        admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
        if admin_role:
            logger.info("Ya existen datos iniciales. Saltando creación.")
            return
        
        logger.info("Creando roles iniciales...")
        # Crear roles iniciales
        admin_role = Role(
            name="ADMIN",
            description="Administrador con acceso completo"
        )
        user_role = Role(
            name="USER",
            description="Usuario estándar"
        )
        
        db.add(admin_role)
        db.add(user_role)
        db.flush()
        logger.info(f"Roles creados: {admin_role.name}, {user_role.name}")
        
        logger.info("Creando permisos iniciales...")
        # Crear permisos iniciales
        admin_view = Permission(name="admin_view", description="Ver administradores")
        admin_create = Permission(name="admin_create", description="Crear administradores")
        admin_edit = Permission(name="admin_edit", description="Editar administradores")
        admin_delete = Permission(name="admin_delete", description="Eliminar administradores")
        
        service_view = Permission(name="service_view", description="Ver servicios")
        service_create = Permission(name="service_create", description="Crear servicios")
        service_edit = Permission(name="service_edit", description="Editar servicios")
        service_delete = Permission(name="service_delete", description="Eliminar servicios")
        
        permissions = [
            admin_view, admin_create, admin_edit, admin_delete,
            service_view, service_create, service_edit, service_delete
        ]
        
        for permission in permissions:
            db.add(permission)
        db.flush()
        logger.info(f"Permisos creados: {len(permissions)} permisos")
        
        logger.info("Asignando permisos a roles...")
        # Asignar permisos a roles
        admin_role.permissions = permissions
        user_role.permissions = [service_view]
        
        logger.info("Creando áreas iniciales...")
        # Crear áreas iniciales
        audiovisual = Area(
            name="Producción Audiovisual",
            description="Equipo encargado de la grabación y edición de contenido audiovisual"
        )
        
        desarrollo = Area(
            name="Desarrollo Web",
            description="Equipo responsable del desarrollo y mantenimiento de sitios web"
        )
        
        areas = [audiovisual, desarrollo]
        for area in areas:
            db.add(area)
        db.flush()
        logger.info(f"Áreas creadas: {audiovisual.name}, {desarrollo.name}")
        
        logger.info("Creando usuarios iniciales...")
        # Crear usuarios iniciales (siguiendo el ejemplo del frontend)
        admin_user = User(
            email="pablo@prueba.com",
            username="placan",
            password_hash=get_password_hash("Admin123"),
            first_name="Pablo",
            last_name="Lacán",
            join_date=date.today(),
            is_active=True
        )
        
        normal_user = User(
            email="kohler@prueba.com",
            username="ckohler",
            password_hash=get_password_hash("User123"),
            first_name="Christian",
            last_name="Kohler",
            join_date=date.today(),
            is_active=True
        )
        
        db.add(admin_user)
        db.add(normal_user)
        db.commit()
        logger.info(f"Usuarios creados: {admin_user.email}, {normal_user.email}")
        
        logger.info("Asignando roles a usuarios...")
        # Agregar usuarios a roles con áreas específicas
        # Asignar roles a usuarios con áreas específicas
        db.execute(
            insert(user_roles).values(
                user_id=admin_user.id, 
                role_id=admin_role.id, 
                area_id=audiovisual.id,
                assigned_at=datetime.utcnow()
            )
        )
        
        db.execute(
            insert(user_roles).values(
                user_id=normal_user.id, 
                role_id=user_role.id, 
                area_id=desarrollo.id,
                assigned_at=datetime.utcnow()
            )
        )
        
        db.commit()
        logger.info("Datos iniciales creados con éxito")
        
    except Exception as e:
        logger.error(f"Error al crear datos iniciales: {e}", exc_info=True)
        db.rollback()
        raise
    finally:
        logger.info("Cerrando conexión a la base de datos...")
        db.close()

def main() -> None:
    logger.info("Iniciando creación de datos iniciales...")
    init_db()
    logger.info("Script completado.")

if __name__ == "__main__":
    main()