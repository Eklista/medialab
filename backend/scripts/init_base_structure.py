#!/usr/bin/env python3
# scripts/init_base_structure.py
"""
Script para inicializar la estructura base de la aplicación:
- Roles (ADMIN, USER)
- Permisos
- Áreas (Producción, Transmisión, Camarografía, Dirección)
"""

import logging
import sys
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import insert

from app.database import SessionLocal
from app.models.auth.roles import Role
from app.models.auth.permissions import Permission
from app.models.organization.areas import Area

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

def init_base_structure() -> None:
    """Inicializa roles, permisos y áreas básicas."""
    logger.info("Creando conexión a la base de datos...")
    db = SessionLocal()
    
    try:
        logger.info("Verificando si ya existen datos de estructura base...")
        # Verificar si ya existen datos para evitar duplicación
        admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
        if admin_role:
            logger.info("Ya existe estructura base. Saltando creación.")
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
        areas_data = [
            {
                "name": "Producción",
                "description": "Equipo encargado de la planeación y ejecución de proyectos multimedia"
            },
            {
                "name": "Transmisión",
                "description": "Equipo responsable de la transmisión de eventos en vivo"
            },
            {
                "name": "Camarografía",
                "description": "Equipo especializado en captura de video profesional"
            },
            {
                "name": "Dirección",
                "description": "Equipo encargado de la dirección creativa y administrativa"
            }
        ]
        
        for area_data in areas_data:
            area = Area(**area_data)
            db.add(area)
        
        db.commit()
        logger.info(f"Áreas creadas: {len(areas_data)} áreas")
        logger.info("Estructura base creada con éxito")
        
    except Exception as e:
        logger.error(f"Error al crear estructura base: {e}", exc_info=True)
        db.rollback()
        raise
    finally:
        logger.info("Cerrando conexión a la base de datos...")
        db.close()

def main() -> None:
    logger.info("Iniciando creación de estructura base...")
    init_base_structure()
    logger.info("Script completado.")

if __name__ == "__main__":
    main()