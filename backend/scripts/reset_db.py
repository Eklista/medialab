# app/reset_db.py
import logging
from sqlalchemy import text
from app.database import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def reset_db() -> None:
    """Reinicia todas las tablas de la base de datos, eliminando datos existentes"""
    db = SessionLocal()
    try:
        logger.info("Reiniciando la base de datos...")
        
        # Desactivar verificación de clave foránea temporalmente
        db.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
        
        # Truncar todas las tablas (eliminar todos los datos)
        tables = [
            "user_roles",
            "role_permissions",
            "permissions",
            "roles",
            "users",
            "areas"
        ]
        
        for table in tables:
            db.execute(text(f"TRUNCATE TABLE {table}"))
            logger.info(f"Tabla {table} truncada")
        
        # Reactivar verificación de clave foránea
        db.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
        
        db.commit()
        logger.info("Base de datos reiniciada con éxito")
    except Exception as e:
        logger.error(f"Error al reiniciar la base de datos: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_db()