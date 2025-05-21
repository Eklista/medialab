# app/services/multimedia/course_service.py
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session, joinedload

from app.models.education.academic import Course, CourseClass
from app.services.common.link_service import LinkService

class CourseService:
    """
    Servicio para gestionar cursos académicos
    """
    
    @staticmethod
    def get_all_courses(db: Session, career_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[Course]:
        """
        Obtiene todos los cursos, opcionalmente filtrados por carrera
        
        Args:
            db: Sesión SQLAlchemy
            career_id: ID de la carrera para filtrar (opcional)
            skip: Registros a saltar (paginación)
            limit: Límite de registros a devolver
            
        Returns:
            List[Course]: Lista de cursos
        """
        query = db.query(Course).filter(Course.deleted_at == None)
        
        if career_id:
            query = query.filter(Course.career_id == career_id)
            
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def get_course_by_id(db: Session, course_id: int, with_classes: bool = False) -> Optional[Course]:
        """
        Obtiene un curso por su ID
        
        Args:
            db: Sesión SQLAlchemy
            course_id: ID del curso
            with_classes: Si se deben cargar las clases relacionadas
            
        Returns:
            Optional[Course]: Curso o None si no se encuentra
        """
        query = db.query(Course).filter(
            Course.id == course_id,
            Course.deleted_at == None
        )
        
        if with_classes:
            query = query.options(joinedload(Course.classes))
            
        return query.first()
    
    @staticmethod
    def get_course_by_code(db: Session, code: str, career_id: int) -> Optional[Course]:
        """
        Obtiene un curso por su código y carrera
        
        Args:
            db: Sesión SQLAlchemy
            code: Código del curso
            career_id: ID de la carrera
            
        Returns:
            Optional[Course]: Curso o None si no se encuentra
        """
        return db.query(Course).filter(
            Course.code == code,
            Course.career_id == career_id,
            Course.deleted_at == None
        ).first()
    
    @staticmethod
    def create_course(db: Session, course_data: Dict[str, Any]) -> Course:
        """
        Crea un nuevo curso
        
        Args:
            db: Sesión SQLAlchemy
            course_data: Datos del curso
            
        Returns:
            Course: Curso creado
        """
        course = Course(**course_data)
        
        db.add(course)
        db.commit()
        db.refresh(course)
        
        return course
    
    @staticmethod
    def update_course(db: Session, course_id: int, course_data: Dict[str, Any]) -> Optional[Course]:
        """
        Actualiza un curso
        
        Args:
            db: Sesión SQLAlchemy
            course_id: ID del curso
            course_data: Datos a actualizar
            
        Returns:
            Optional[Course]: Curso actualizado o None si no se encuentra
        """
        course = CourseService.get_course_by_id(db, course_id)
        if not course:
            return None
            
        for key, value in course_data.items():
            setattr(course, key, value)
            
        db.commit()
        db.refresh(course)
        
        return course
    
    @staticmethod
    def delete_course(db: Session, course_id: int, deleted_by_id: Optional[int] = None) -> bool:
        """
        Marca un curso como eliminado
        
        Args:
            db: Sesión SQLAlchemy
            course_id: ID del curso
            deleted_by_id: ID del usuario que elimina
            
        Returns:
            bool: True si se marcó como eliminado, False si no se encuentra
        """
        course = CourseService.get_course_by_id(db, course_id)
        if not course:
            return False
            
        course.deleted_at = datetime.utcnow()
        course.deleted_by_id = deleted_by_id
        
        db.commit()
        
        return True
    
    @staticmethod
    def get_all_course_links(db: Session, course_id: int) -> List:
        """
        Obtiene todos los enlaces asociados a un curso y sus clases
        
        Args:
            db: Sesión SQLAlchemy
            course_id: ID del curso
            
        Returns:
            List: Lista combinada de enlaces
        """
        course = CourseService.get_course_by_id(db, course_id)
        if not course:
            return []
            
        # Enlaces directos del curso
        course_links = LinkService.get_entity_links(db, course)
        
        # Enlaces de todas las clases
        classes = db.query(CourseClass).filter(
            CourseClass.course_id == course_id,
            CourseClass.deleted_at == None
        ).all()
        
        class_links = []
        for course_class in classes:
            class_links.extend(LinkService.get_entity_links(db, course_class))
            
        return course_links + class_links
    
    @staticmethod
    def get_all_classes(db: Session, course_id: Optional[int] = None) -> List[CourseClass]:
        """
        Obtiene todas las clases, opcionalmente filtradas por curso
        
        Args:
            db: Sesión SQLAlchemy
            course_id: ID del curso para filtrar (opcional)
            
        Returns:
            List[CourseClass]: Lista de clases
        """
        query = db.query(CourseClass).filter(CourseClass.deleted_at == None)
        
        if course_id:
            query = query.filter(CourseClass.course_id == course_id)
            
        return query.all()
    
    @staticmethod
    def get_class_by_id(db: Session, class_id: int) -> Optional[CourseClass]:
        """
        Obtiene una clase por su ID
        
        Args:
            db: Sesión SQLAlchemy
            class_id: ID de la clase
            
        Returns:
            Optional[CourseClass]: Clase o None si no se encuentra
        """
        return db.query(CourseClass).filter(
            CourseClass.id == class_id,
            CourseClass.deleted_at == None
        ).first()
    
    @staticmethod
    def create_class(db: Session, class_data: Dict[str, Any]) -> CourseClass:
        """
        Crea una nueva clase
        
        Args:
            db: Sesión SQLAlchemy
            class_data: Datos de la clase
            
        Returns:
            CourseClass: Clase creada
        """
        course_class = CourseClass(**class_data)
        
        db.add(course_class)
        db.commit()
        db.refresh(course_class)
        
        return course_class
    
    @staticmethod
    def update_class(db: Session, class_id: int, class_data: Dict[str, Any]) -> Optional[CourseClass]:
        """
        Actualiza una clase
        
        Args:
            db: Sesión SQLAlchemy
            class_id: ID de la clase
            class_data: Datos a actualizar
            
        Returns:
            Optional[CourseClass]: Clase actualizada o None si no se encuentra
        """
        course_class = CourseService.get_class_by_id(db, class_id)
        if not course_class:
            return None
            
        for key, value in class_data.items():
            setattr(course_class, key, value)
            
        db.commit()
        db.refresh(course_class)
        
        return course_class
    
    @staticmethod
    def delete_class(db: Session, class_id: int, deleted_by_id: Optional[int] = None) -> bool:
        """
        Marca una clase como eliminada
        
        Args:
            db: Sesión SQLAlchemy
            class_id: ID de la clase
            deleted_by_id: ID del usuario que elimina
            
        Returns:
            bool: True si se marcó como eliminada, False si no se encuentra
        """
        course_class = CourseService.get_class_by_id(db, class_id)
        if not course_class:
            return False
            
        course_class.deleted_at = datetime.utcnow()
        course_class.deleted_by_id = deleted_by_id
        
        db.commit()
        
        return True