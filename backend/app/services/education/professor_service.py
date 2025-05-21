# app/services/education/professor_service.py
import re
from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.education.professors import Professor

class ProfessorService:
    """
    Servicio para gestionar profesores
    """
    
    @staticmethod
    def validate_email(email: str) -> str:
        """
        Valida el formato de email
        """
        if email and not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            raise ValueError("Formato de email inválido")
        return email
    
    @staticmethod
    def validate_phone(phone: str) -> str:
        """
        Valida el formato de teléfono
        """
        if phone and not re.match(r"^\+?[0-9]{8,15}$", phone):
            raise ValueError("Formato de teléfono inválido")
        return phone