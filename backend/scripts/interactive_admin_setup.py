#!/usr/bin/env python3
# scripts/interactive_admin_setup.py
"""
Script para configurar interactivamente un administrador del sistema
"""

import logging
import sys
import getpass
from datetime import datetime, date

from sqlalchemy.orm import Session
from sqlalchemy import insert

from app.database import SessionLocal
from app.models.auth.users import User
from app.models.associations import user_roles
from app.models.auth.roles import Role
from app.models.organization.areas import Area
from app.config.security import get_password_hash

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

def get_admin_role_and_areas(db: Session) -> dict:
    """Obtiene el rol de administrador y todas las áreas disponibles"""
    logger.info("Verificando roles y áreas existentes...")
    
    # Obtener rol de administrador
    admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
    if not admin_role:
        logger.error("No se encontró rol de administrador. Asegúrate de ejecutar init_base_structure.py primero.")
        sys.exit(1)
    
    # Obtener todas las áreas
    areas = db.query(Area).all()
    if not areas:
        logger.error("No se encontraron áreas. Asegúrate de ejecutar init_base_structure.py primero.")
        sys.exit(1)
    
    return {"admin_role": admin_role, "areas": areas}

def prompt_admin_info() -> dict:
    """Solicita interactivamente la información del administrador"""
    print("\n======= CONFIGURACIÓN DE USUARIO ADMINISTRADOR =======")
    print("Por favor, proporciona la información para el usuario administrador:\n")
    
    email = input("Email: ")
    while not email or '@' not in email:
        print("Email inválido. Debe incluir un símbolo @.")
        email = input("Email: ")
    
    username = input("Nombre de usuario: ")
    while not username:
        print("El nombre de usuario no puede estar vacío.")
        username = input("Nombre de usuario: ")
    
    first_name = input("Nombre: ")
    while not first_name:
        print("El nombre no puede estar vacío.")
        first_name = input("Nombre: ")
    
    last_name = input("Apellido: ")
    while not last_name:
        print("El apellido no puede estar vacío.")
        last_name = input("Apellido: ")
    
    password = getpass.getpass("Contraseña: ")
    confirm_password = getpass.getpass("Confirma contraseña: ")
    
    while not password or password != confirm_password:
        print("Las contraseñas no coinciden o están vacías.")
        password = getpass.getpass("Contraseña: ")
        confirm_password = getpass.getpass("Confirma contraseña: ")
    
    return {
        "email": email,
        "username": username,
        "first_name": first_name,
        "last_name": last_name,
        "password": password
    }

def prompt_area_selection(areas: list) -> int:
    """Solicita interactivamente el área del administrador"""
    print("\n======= SELECCIÓN DE ÁREA =======")
    print("Selecciona el área a la que pertenece el administrador:")
    
    for idx, area in enumerate(areas, start=1):
        print(f"{idx}. {area.name}")
    
    selected = 0
    while selected < 1 or selected > len(areas):
        try:
            selected = int(input("\nNúmero de área (1-{}): ".format(len(areas))))
        except ValueError:
            print("Por favor, ingresa un número válido.")
    
    return areas[selected-1].id

def check_if_user_exists(db: Session, email: str, username: str) -> bool:
    """Verifica si ya existe un usuario con el email o username proporcionados"""
    existing_email = db.query(User).filter(User.email == email).first()
    if existing_email:
        print(f"\nYa existe un usuario con el email: {email}")
        return True
    
    existing_username = db.query(User).filter(User.username == username).first()
    if existing_username:
        print(f"\nYa existe un usuario con el nombre de usuario: {username}")
        return True
    
    return False

def create_interactive_admin() -> None:
    """Función principal para configurar interactivamente un administrador"""
    logger.info("Iniciando configuración interactiva de administrador...")
    
    try:
        db = SessionLocal()
        
        # Obtener rol y áreas
        role_areas = get_admin_role_and_areas(db)
        admin_role = role_areas["admin_role"]
        areas = role_areas["areas"]
        
        # Solicitar información del administrador
        admin_info = prompt_admin_info()
        
        # Verificar si ya existe
        if check_if_user_exists(db, admin_info["email"], admin_info["username"]):
            choice = input("¿Deseas intentar con otra información? (s/n): ").lower()
            if choice in ['s', 'si', 'sí', 'y', 'yes']:
                create_interactive_admin()  # Recursión para intentar de nuevo
                return
            else:
                logger.info("Configuración cancelada por el usuario.")
                return
        
        # Solicitar selección de área
        area_id = prompt_area_selection(areas)
        
        # Crear usuario administrador
        admin_user = User(
            email=admin_info["email"],
            username=admin_info["username"],
            password_hash=get_password_hash(admin_info["password"]),
            first_name=admin_info["first_name"],
            last_name=admin_info["last_name"],
            join_date=date.today(),
            is_active=True
        )
        
        db.add(admin_user)
        db.flush()
        
        # Asignar rol y área
        db.execute(
            insert(user_roles).values(
                user_id=admin_user.id,
                role_id=admin_role.id,
                area_id=area_id,
                assigned_at=datetime.utcnow()
            )
        )
        
        db.commit()
        
        logger.info(f"Administrador creado exitosamente: {admin_user.email}")
        print("\n¡Administrador creado exitosamente!")
        print(f"Email: {admin_user.email}")
        print(f"Usuario: {admin_user.username}")
        print("\nYa puedes iniciar sesión en el sistema con estas credenciales.")
        
    except Exception as e:
        logger.error(f"Error durante la configuración interactiva: {e}", exc_info=True)
        if 'db' in locals():
            db.rollback()
        print("\nOcurrió un error durante la configuración. Consulta los logs para más detalles.")
    finally:
        if 'db' in locals():
            db.close()

def main() -> None:
    logger.info("Iniciando script de configuración interactiva de administrador...")
    create_interactive_admin()
    logger.info("Script completado.")

if __name__ == "__main__":
    main()