#!/usr/bin/env python3
# app/scripts/initial_services.py

import logging
import sys
from pathlib import Path
import os

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.organization.services import Service, SubService
from app.repositories.organization.service_repository import ServiceRepository

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
SERVICE_DATA_FLAG = DATA_DIR / ".service_data_initialized"

def init_services() -> None:
    """Inicializa los servicios y subservicios del sistema para MediaLab"""
    
    # Verificar si ya se inicializaron los servicios
    if SERVICE_DATA_FLAG.exists() and not os.environ.get("FORCE_INIT_SERVICES") == "true":
        logger.info("Los servicios ya fueron inicializados previamente.")
        return
    
    logger.info("Creando conexión a la base de datos...")
    db = SessionLocal()
    
    try:
        logger.info("Verificando si ya existen servicios...")
        services_count = db.query(Service).count()
        if services_count > 0:
            logger.info(f"Ya existen {services_count} servicios en la base de datos.")
            SERVICE_DATA_FLAG.touch()  # Crear el archivo de flag
            return
        
        logger.info("Creando servicios iniciales...")
        
        # Lista de servicios con sus subservicios usando los iconos disponibles
        services_data = [
            {
                "name": "Transmisión",
                "description": "Servicios de transmisión en vivo y circuito cerrado",
                "icon_name": "desktop-computer",
                "sub_services": [
                    {"name": "Transmisión en Vivo (Público)", "description": "Transmisión del evento a redes sociales de manera pública"},
                    {"name": "Transmisión en Vivo (Privada)", "description": "Transmisión privada del evento a plataformas como Zoom o YouTube"},
                    {"name": "Circuito Cerrado", "description": "Proyección de señal de cámara o computadora dentro del salón del evento"}
                ]
            },
            {
                "name": "Video",
                "description": "Servicios de grabación y producción de video",
                "icon_name": "video-camera",
                "sub_services": [
                    {"name": "Grabación para Archivo", "description": "Grabación de eventos para archivo institucional"},
                    {"name": "Grabación de Clase", "description": "Grabación de clases o sesiones educativas"},
                    {"name": "Grabación en Estudio", "description": "Grabación de contenido en estudio profesional"}
                ]
            },
            {
                "name": "Fotografía",
                "description": "Servicios profesionales de fotografía para eventos",
                "icon_name": "photo",
                "sub_services": [
                    {"name": "Fotografía de Eventos", "description": "Toma de fotografías profesionales durante eventos"},
                    {"name": "Edición de Fotografías", "description": "Postproducción y edición de material fotográfico"}
                ]
            },
            {
                "name": "Edición",
                "description": "Servicios de postproducción y edición de contenido",
                "icon_name": "template",
                "sub_services": [
                    {"name": "Edición de Video", "description": "Postproducción y edición de material audiovisual"},
                    {"name": "Edición de Audio", "description": "Edición y masterización de archivos de audio"}
                ]
            },
            {
                "name": "Uso de Instalaciones",
                "description": "Servicios de uso de espacios y equipamiento",
                "icon_name": "cube",
                "sub_services": [
                    {"name": "Uso de Cabina", "description": "Reserva y uso de cabina de grabación de audio"},
                    {"name": "Uso de Estudio", "description": "Reserva y uso de estudio de grabación con equipamiento"},
                    {"name": "Uso de Laboratorio", "description": "Reserva y uso de laboratorio con equipos de cómputo"}
                ]
            }
        ]
        
        # Crear los servicios y sus subservicios
        for service_data in services_data:
            subservicios = service_data.pop("sub_services")
            
            logger.info(f"Creando servicio: {service_data['name']}")
            service = ServiceRepository.create(db, service_data)
            
            for subservicio_data in subservicios:
                logger.info(f"  - Añadiendo subservicio: {subservicio_data['name']}")
                ServiceRepository.add_sub_service(db, service.id, subservicio_data)
        
        # Crear el archivo de flag para indicar que los servicios ya se inicializaron
        SERVICE_DATA_FLAG.touch()
        logger.info("Servicios y subservicios creados exitosamente")
        
    except Exception as e:
        logger.error(f"Error al crear servicios iniciales: {e}", exc_info=True)
        db.rollback()
        raise
    finally:
        logger.info("Cerrando conexión a la base de datos...")
        db.close()

def main() -> None:
    logger.info("Iniciando creación de servicios iniciales...")
    init_services()
    logger.info("Script completado.")

if __name__ == "__main__":
    main()