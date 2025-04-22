#!/usr/bin/env python3
"""
Script para limpiar archivos obsoletos después de la migración a la nueva arquitectura.
Ejecutar con precaución y después de haber probado la nueva estructura.
"""

import os
import shutil
import time
from pathlib import Path
import logging

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("cleanup")

# Ruta base del proyecto
BASE_DIR = Path(__file__).resolve().parent

# Archivos a eliminar (servicios antiguos que han sido reemplazados)
FILES_TO_REMOVE = [
    "app/services/users_service.py",
    "app/services/auth_service.py"
]

# Crear backup
def create_backup():
    """Crea un backup de los archivos antes de eliminarlos"""
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    backup_dir = BASE_DIR / f"backup_{timestamp}"
    
    logger.info(f"Creando directorio de backup: {backup_dir}")
    backup_dir.mkdir(exist_ok=True)
    
    for file_path in FILES_TO_REMOVE:
        full_path = BASE_DIR / file_path
        if full_path.exists():
            # Crear estructura de directorios en el backup
            relative_dir = os.path.dirname(file_path)
            backup_subdir = backup_dir / relative_dir
            backup_subdir.mkdir(parents=True, exist_ok=True)
            
            # Copiar archivo al backup
            backup_file = backup_dir / file_path
            logger.info(f"Respaldando {full_path} a {backup_file}")
            shutil.copy2(full_path, backup_file)
    
    return backup_dir

# Remover archivos
def remove_files():
    """Elimina los archivos obsoletos"""
    removed_count = 0
    
    for file_path in FILES_TO_REMOVE:
        full_path = BASE_DIR / file_path
        if full_path.exists():
            logger.info(f"Eliminando {full_path}")
            full_path.unlink()
            removed_count += 1
        else:
            logger.warning(f"Archivo no encontrado: {full_path}")
    
    return removed_count

# Función principal
def main():
    logger.info("Iniciando limpieza de código obsoleto...")
    
    # Verificar si hay archivos para eliminar
    files_exist = any((BASE_DIR / file_path).exists() for file_path in FILES_TO_REMOVE)
    
    if not files_exist:
        logger.info("No se encontraron archivos obsoletos para eliminar.")
        return
    
    # Crear backup
    backup_dir = create_backup()
    logger.info(f"Backup creado en: {backup_dir}")
    
    # Confirmar eliminación
    confirm = input(f"¿Estás seguro de que deseas eliminar los archivos obsoletos? (s/N): ")
    if confirm.lower() != 's':
        logger.info("Operación cancelada por el usuario.")
        return
    
    # Eliminar archivos
    removed_count = remove_files()
    logger.info(f"Se eliminaron {removed_count} archivos obsoletos.")
    logger.info(f"Los archivos se respaldaron en: {backup_dir}")
    logger.info("Limpieza completada con éxito.")

if __name__ == "__main__":
    main()