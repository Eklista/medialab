#!/usr/bin/env python3
# scripts/add_permissions.py
"""
Script para añadir permisos adicionales al sistema
"""

import logging
import sys
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import SessionLocal
from app.models.auth.permissions import Permission
from app.models.auth.roles import Role

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

def add_permissions() -> None:
    """Añade permisos adicionales al sistema y actualiza roles existentes."""
    logger.info("Creando conexión a la base de datos...")
    db = SessionLocal()
    
    try:
        # Nuevos permisos a agregar
        new_permissions = [
            # Permisos para usuarios
            {"name": "user_view", "description": "Ver usuarios"},
            {"name": "user_create", "description": "Crear usuarios"},
            {"name": "user_edit", "description": "Editar usuarios"},
            {"name": "user_delete", "description": "Eliminar usuarios"},
            {"name": "profile_edit", "description": "Editar perfil propio"},
            
            # Permisos para áreas
            {"name": "area_view", "description": "Ver áreas"},
            {"name": "area_create", "description": "Crear áreas"},
            {"name": "area_edit", "description": "Editar áreas"},
            {"name": "area_delete", "description": "Eliminar áreas"},
            
            # Permisos para departamentos
            {"name": "department_view", "description": "Ver departamentos"},
            {"name": "department_create", "description": "Crear departamentos"},
            {"name": "department_edit", "description": "Editar departamentos"},
            {"name": "department_delete", "description": "Eliminar departamentos"},
            
            # Permisos para tipos de departamentos
            {"name": "department_type_view", "description": "Ver tipos de departamentos"},
            {"name": "department_type_create", "description": "Crear tipos de departamentos"},
            {"name": "department_type_edit", "description": "Editar tipos de departamentos"},
            {"name": "department_type_delete", "description": "Eliminar tipos de departamentos"},
            
            # Permisos para plantillas de servicios
            {"name": "template_view", "description": "Ver plantillas de servicios"},
            {"name": "template_create", "description": "Crear plantillas de servicios"},
            {"name": "template_edit", "description": "Editar plantillas de servicios"},
            {"name": "template_delete", "description": "Eliminar plantillas de servicios"},
            
            # Permisos para solicitudes de servicios
            {"name": "request_view", "description": "Ver solicitudes"},
            {"name": "request_create", "description": "Crear solicitudes"},
            {"name": "request_edit", "description": "Editar solicitudes"},
            {"name": "request_cancel", "description": "Cancelar solicitudes"},
            {"name": "request_approve", "description": "Aprobar solicitudes"},
            {"name": "request_reject", "description": "Rechazar solicitudes"},
            
            # Permisos para roles
            {"name": "role_view", "description": "Ver roles"},
            {"name": "role_create", "description": "Crear roles"},
            {"name": "role_edit", "description": "Editar roles"},
            {"name": "role_delete", "description": "Eliminar roles"},
            
            # Permisos para servicios
            {"name": "service_view", "description": "Ver servicios"},
            {"name": "service_create", "description": "Crear servicios"},
            {"name": "service_edit", "description": "Editar servicios"},
            {"name": "service_delete", "description": "Eliminar servicios"},
        ]
        
        # Verificar permisos existentes
        existing_permissions = {}
        for perm in db.query(Permission).all():
            existing_permissions[perm.name] = perm
        
        # Añadir solo los permisos que no existen
        created_permissions = []
        for perm_data in new_permissions:
            if perm_data["name"] not in existing_permissions:
                permission = Permission(
                    name=perm_data["name"],
                    description=perm_data["description"]
                )
                db.add(permission)
                created_permissions.append(perm_data["name"])
                logger.info(f"Creando permiso: {perm_data['name']}")
            else:
                logger.info(f"Permiso ya existe: {perm_data['name']}")
        
        if created_permissions:
            db.commit()
            logger.info(f"Permisos creados: {len(created_permissions)}")
        else:
            logger.info("No se crearon nuevos permisos, todos ya existen")
        
        # Actualizar roles existentes para asignar permisos adecuados
        # 1. ADMIN - recibe todos los permisos
        admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
        if admin_role:
            logger.info("Actualizando permisos del rol ADMIN...")
            all_permissions = db.query(Permission).all()
            admin_role.permissions = all_permissions
            db.commit()
            logger.info(f"Se asignaron {len(all_permissions)} permisos al rol ADMIN")
        
        # 2. USER - solo recibe el permiso de editar su propio perfil
        user_role = db.query(Role).filter(Role.name == "USER").first()
        if user_role:
            logger.info("Actualizando permisos del rol USER...")
            
            # Por ahora, solo asignar el permiso de editar su propio perfil
            basic_permissions = db.query(Permission).filter(
                Permission.name.in_([
                    'profile_edit',         
                ])
            ).all()
            
            user_role.permissions = basic_permissions
            db.commit()
            logger.info(f"Se asignaron {len(basic_permissions)} permisos al rol USER")
        
        logger.info("Actualización de permisos completada con éxito")
        
    except Exception as e:
        logger.error(f"Error al crear permisos: {e}", exc_info=True)
        db.rollback()
        raise
    finally:
        logger.info("Cerrando conexión a la base de datos...")
        db.close()

def main() -> None:
    logger.info("Iniciando adición de permisos...")
    add_permissions()
    logger.info("Script completado.")

if __name__ == "__main__":
    main()