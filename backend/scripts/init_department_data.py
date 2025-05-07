#!/usr/bin/env python3
# scripts/init_department_data.py
"""
Script para inicializar tipos de departamentos y departamentos específicos
"""

import logging
import sys

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.organization.departments import DepartmentType, Department

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

def init_department_data() -> None:
    """Inicializa tipos de departamentos y departamentos específicos."""
    logger.info("Creando conexión a la base de datos...")
    db = SessionLocal()
    
    try:
        logger.info("Verificando si ya existen tipos de departamentos...")
        # Verificar si ya existen datos para evitar duplicación
        existing_type = db.query(DepartmentType).first()
        if existing_type:
            logger.info("Ya existen tipos de departamentos. Saltando creación.")
            return
        
        logger.info("Creando tipos de departamento...")
        # Crear tipos de departamento
        faculty_type = DepartmentType(name="Facultad")
        school_type = DepartmentType(name="Escuela")
        institute_type = DepartmentType(name="Instituto")
        program_type = DepartmentType(name="Programa")
        center_type = DepartmentType(name="Centro")
        lab_type = DepartmentType(name="Laboratorio")
        
        department_types = [
            faculty_type, 
            school_type, 
            institute_type, 
            program_type, 
            center_type, 
            lab_type
        ]
        
        for dept_type in department_types:
            db.add(dept_type)
        
        db.flush()
        logger.info(f"Tipos de departamento creados: {len(department_types)}")
        
        logger.info("Creando departamentos iniciales...")
        # Crear departamentos iniciales
        departments = [
            Department(
                name="Facultad de Ingeniería de Sistemas, Informática y Ciencias de la Computación",
                abbreviation="FISICC",
                description="Facultad encargada de la formación de profesionales en el área de tecnología",
                type_id=faculty_type.id
            ),
            Department(
                name="Escuela Superior de Arte",
                abbreviation="ESA",
                description="Escuela dedicada a la formación artística y creativa",
                type_id=school_type.id
            ),
            Department(
                name="Instituto de Recursos Energéticos",
                abbreviation="IRE",
                description="Instituto enfocado en investigación de recursos energéticos",
                type_id=institute_type.id
            ),
            Department(
                name="Programa de Desarrollo Humano",
                abbreviation="PDH",
                description="Programa para el desarrollo de habilidades humanas",
                type_id=program_type.id
            ),
            Department(
                name="Centro de Estudios Contemporáneos",
                abbreviation="CEC",
                description="Centro especializado en estudios de temas contemporáneos",
                type_id=center_type.id
            ),
            Department(
                name="Laboratorio de Multimedia",
                abbreviation="MEDIALAB",
                description="Laboratorio especializado en desarrollo multimedia y digital",
                type_id=lab_type.id
            )
        ]
        
        for department in departments:
            db.add(department)
        
        db.commit()
        logger.info(f"Departamentos creados: {len(departments)}")
        logger.info("Datos de departamentos creados con éxito")
        
    except Exception as e:
        logger.error(f"Error al crear datos de departamentos: {e}", exc_info=True)
        db.rollback()
        raise
    finally:
        logger.info("Cerrando conexión a la base de datos...")
        db.close()

def main() -> None:
    logger.info("Iniciando creación de datos de departamentos...")
    init_department_data()
    logger.info("Script completado.")

if __name__ == "__main__":
    main()