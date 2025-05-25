#!/usr/bin/env python3
# scripts/init_admin_user.py
"""
Script para crear el usuario administrador base del sistema
Usuario: Pablo Lacán (pablo.lacan@galileo.edu)
"""

import logging
import sys
from datetime import datetime, date
from pathlib import Path

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

# Directorio de datos para marcadores de inicialización
DATA_DIR = Path("/app/data")
DATA_DIR.mkdir(exist_ok=True)
ADMIN_USER_FLAG = DATA_DIR / ".admin_user_initialized"

def init_admin_user() -> None:
    """Inicializa el usuario administrador base del sistema."""
    
    # Verificar si ya se inicializó el usuario admin
    if ADMIN_USER_FLAG.exists():
        logger.info("El usuario administrador ya fue inicializado previamente.")
        return
    
    logger.info("Creando conexión a la base de datos...")
    db = SessionLocal()
    
    try:
        logger.info("Verificando estructuras necesarias...")
        
        # Verificar que existe el rol ADMIN
        admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
        if not admin_role:
            logger.error("❌ No se encontró el rol ADMIN. Ejecuta primero init_base_structure.py")
            return
        
        # Verificar que existe al menos un área
        first_area = db.query(Area).first()
        if not first_area:
            logger.error("❌ No se encontraron áreas. Ejecuta primero init_base_structure.py")
            return
        
        # Datos del usuario administrador
        admin_data = {
            "email": "pablo.lacan@galileo.edu",
            "username": "placan",
            "password": "123",  # Se hasheará automáticamente
            "first_name": "Pablo",
            "last_name": "Lacán"
        }
        
        logger.info(f"Verificando si el usuario {admin_data['email']} ya existe...")
        
        # Verificar si ya existe un usuario con este email o username
        existing_user = db.query(User).filter(
            (User.email == admin_data["email"]) | 
            (User.username == admin_data["username"])
        ).first()
        
        if existing_user:
            logger.warning(f"⚠️ Ya existe un usuario con email '{existing_user.email}' o username '{existing_user.username}'")
            logger.info("Saltando creación del usuario administrador")
            ADMIN_USER_FLAG.touch()  # Marcar como inicializado
            return
        
        logger.info(f"🔨 Creando usuario administrador: {admin_data['email']}")
        
        # Crear usuario administrador
        admin_user = User(
            email=admin_data["email"],
            username=admin_data["username"],
            password_hash=get_password_hash(admin_data["password"]),
            first_name=admin_data["first_name"],
            last_name=admin_data["last_name"],
            join_date=date.today(),
            is_active=True,
            is_online=False
        )
        
        db.add(admin_user)
        db.flush()  # Para obtener el ID
        
        logger.info(f"✅ Usuario creado con ID: {admin_user.id}")
        
        # Asignar rol ADMIN en el área de Dirección (o la primera área disponible)
        direccion_area = db.query(Area).filter(Area.name == "Dirección").first()
        target_area = direccion_area if direccion_area else first_area
        
        logger.info(f"🔐 Asignando rol ADMIN en área: {target_area.name}")
        
        # Insertar en la tabla de asociación user_roles
        db.execute(
            insert(user_roles).values(
                user_id=admin_user.id,
                role_id=admin_role.id,
                area_id=target_area.id,
                assigned_at=datetime.utcnow()
            )
        )
        
        db.commit()
        
        # Crear el archivo de flag para indicar que el admin ya se inicializó
        ADMIN_USER_FLAG.touch()
        
        logger.info("🎉 Usuario administrador creado exitosamente!")
        logger.info("=" * 50)
        logger.info("📋 CREDENCIALES DEL ADMINISTRADOR:")
        logger.info(f"   Email: {admin_data['email']}")
        logger.info(f"   Usuario: {admin_data['username']}")
        logger.info(f"   Contraseña: {admin_data['password']}")
        logger.info(f"   Nombre: {admin_data['first_name']} {admin_data['last_name']}")
        logger.info(f"   Rol: ADMIN")
        logger.info(f"   Área: {target_area.name}")
        logger.info("=" * 50)
        logger.info("✅ Ya puedes iniciar sesión en el sistema con estas credenciales")
        
    except Exception as e:
        logger.error(f"💥 Error al crear usuario administrador: {e}", exc_info=True)
        db.rollback()
        raise
    finally:
        logger.info("Cerrando conexión a la base de datos...")
        db.close()

def reset_admin_user() -> None:
    """Elimina y recrea el usuario administrador (útil para desarrollo)."""
    logger.info("🔄 Reseteando usuario administrador...")
    
    db = SessionLocal()
    
    try:
        # Buscar usuario existente
        existing_user = db.query(User).filter(
            (User.email == "pablo.lacan@galileo.edu") | 
            (User.username == "placan")
        ).first()
        
        if existing_user:
            logger.info(f"🗑️ Eliminando usuario existente: {existing_user.email}")
            db.delete(existing_user)
            db.commit()
        
        # Eliminar flag de inicialización
        if ADMIN_USER_FLAG.exists():
            ADMIN_USER_FLAG.unlink()
            logger.info("🗑️ Flag de inicialización eliminado")
        
        # Crear nuevamente
        init_admin_user()
        
    except Exception as e:
        logger.error(f"💥 Error al resetear usuario administrador: {e}", exc_info=True)
        db.rollback()
        raise
    finally:
        db.close()

def check_admin_user() -> None:
    """Verifica el estado del usuario administrador."""
    logger.info("🔍 Verificando estado del usuario administrador...")
    
    db = SessionLocal()
    
    try:
        user = db.query(User).filter(User.email == "pablo.lacan@galileo.edu").first()
        
        if user:
            logger.info("✅ Usuario administrador encontrado:")
            logger.info(f"   ID: {user.id}")
            logger.info(f"   Email: {user.email}")
            logger.info(f"   Username: {user.username}")
            logger.info(f"   Nombre: {user.first_name} {user.last_name}")
            logger.info(f"   Activo: {'Sí' if user.is_active else 'No'}")
            logger.info(f"   Fecha de registro: {user.join_date}")
            
            # Verificar roles
            roles = [role.name for role in user.roles]
            areas = [area.name for area in user.areas]
            
            logger.info(f"   Roles: {', '.join(roles) if roles else 'Ninguno'}")
            logger.info(f"   Áreas: {', '.join(areas) if areas else 'Ninguna'}")
            
        else:
            logger.warning("⚠️ Usuario administrador no encontrado")
            
    except Exception as e:
        logger.error(f"💥 Error verificando usuario administrador: {e}")
    finally:
        db.close()

def main() -> None:
    """Función principal del script."""
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "reset":
            logger.info("Ejecutando reset del usuario administrador...")
            reset_admin_user()
        elif command == "check":
            check_admin_user()
        elif command == "help":
            print("Uso del script:")
            print("  python init_admin_user.py        - Crear usuario administrador")
            print("  python init_admin_user.py reset  - Resetear usuario administrador")
            print("  python init_admin_user.py check  - Verificar estado del usuario")
            print("  python init_admin_user.py help   - Mostrar esta ayuda")
        else:
            logger.error(f"Comando desconocido: {command}")
            logger.info("Usa 'help' para ver los comandos disponibles")
    else:
        logger.info("Iniciando creación de usuario administrador base...")
        init_admin_user()
        logger.info("Script completado.")

if __name__ == "__main__":
    main()