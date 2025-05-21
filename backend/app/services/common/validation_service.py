# app/services/common/validation_service.py
import re
from typing import Optional, Tuple, Union

class ValidationService:
    """
    Servicio para validar datos comunes
    """
    
    @staticmethod
    def validate_email(email: str) -> Tuple[bool, Optional[str]]:
        """
        Valida un formato de correo electrónico
        
        Args:
            email: Correo electrónico a validar
            
        Returns:
            Tuple[bool, Optional[str]]: (Es válido, Mensaje de error si no es válido)
        """
        if not email:
            return False, "El correo electrónico es obligatorio"
            
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return False, "Formato de email inválido"
            
        return True, None
    
    @staticmethod
    def validate_phone(phone: str) -> Tuple[bool, Optional[str]]:
        """
        Valida un formato de número de teléfono
        
        Args:
            phone: Número de teléfono a validar
            
        Returns:
            Tuple[bool, Optional[str]]: (Es válido, Mensaje de error si no es válido)
        """
        if not phone:
            return True, None  # Si está vacío, es válido (opcional)
            
        if not re.match(r"^\+?[0-9]{8,15}$", phone):
            return False, "Formato de teléfono inválido"
            
        return True, None
    
    @staticmethod
    def validate_color(color: str) -> Tuple[bool, Optional[str]]:
        """
        Valida un código de color hexadecimal
        
        Args:
            color: Código de color a validar
            
        Returns:
            Tuple[bool, Optional[str]]: (Es válido, Mensaje de error si no es válido)
        """
        if not color:
            return False, "El color es obligatorio"
            
        if not re.match(r'^#(?:[0-9a-fA-F]{3}){1,2}$', color):
            return False, "El formato de color debe ser un código hexadecimal válido (#RGB o #RRGGBB)"
            
        return True, None
    
    @staticmethod
    def validate_file_size(size: int, min_size: int = 0, max_size: int = None) -> Tuple[bool, Optional[str]]:
        """
        Valida el tamaño de un archivo
        
        Args:
            size: Tamaño en bytes
            min_size: Tamaño mínimo permitido (por defecto 0)
            max_size: Tamaño máximo permitido (por defecto None = sin límite)
            
        Returns:
            Tuple[bool, Optional[str]]: (Es válido, Mensaje de error si no es válido)
        """
        if size <= min_size:
            return False, f"El tamaño del archivo debe ser mayor que {min_size} bytes"
            
        if max_size and size > max_size:
            return False, f"El tamaño del archivo no debe exceder {max_size} bytes"
            
        return True, None
    
    @staticmethod
    def validate_mime_type(mime: str, allowed_types: list = None) -> Tuple[bool, Optional[str]]:
        """
        Valida un tipo MIME
        
        Args:
            mime: Tipo MIME a validar
            allowed_types: Lista de tipos MIME permitidos
            
        Returns:
            Tuple[bool, Optional[str]]: (Es válido, Mensaje de error si no es válido)
        """
        if not mime:
            return False, "El tipo MIME es obligatorio"
            
        if not re.match(r'^[a-z]+/[a-z0-9\.\-\+]+$', mime):
            return False, "Formato MIME inválido"
            
        if allowed_types and mime not in allowed_types:
            return False, f"Tipo MIME no permitido. Tipos permitidos: {', '.join(allowed_types)}"
            
        return True, None
    
    @staticmethod
    def validate_percentage(value: Union[int, float], min_value: int = 0, max_value: int = 100) -> Tuple[bool, Optional[str]]:
        """
        Valida un valor de porcentaje
        
        Args:
            value: Valor a validar
            min_value: Valor mínimo permitido (por defecto 0)
            max_value: Valor máximo permitido (por defecto 100)
            
        Returns:
            Tuple[bool, Optional[str]]: (Es válido, Mensaje de error si no es válido)
        """
        try:
            num_value = int(value)
            if num_value < min_value or num_value > max_value:
                return False, f"El valor debe estar entre {min_value} y {max_value}"
                
            return True, None
        except (ValueError, TypeError):
            return False, "El valor debe ser un número"
            
    @staticmethod
    def validate_project_code(code: str) -> Tuple[bool, Optional[str]]:
        """
        Valida un código de proyecto
        
        Args:
            code: Código de proyecto a validar
            
        Returns:
            Tuple[bool, Optional[str]]: (Es válido, Mensaje de error si no es válido)
        """
        if not code:
            return True, None  # Código opcional
            
        if not code.strip():
            return False, "El código del proyecto no puede estar vacío o solo espacios"
            
        return True, None
    
    @staticmethod
    def validate_activity_type(activity_type: str) -> Tuple[bool, Optional[str]]:
        """
        Valida un tipo de actividad para solicitudes
        
        Args:
            activity_type: Tipo de actividad ('single', 'recurrent', 'podcast', 'course')
            
        Returns:
            Tuple[bool, Optional[str]]: (Es válido, Mensaje de error si no es válido)
        """
        valid_types = ['single', 'recurrent', 'podcast', 'course']
        
        if not activity_type:
            return False, "El tipo de actividad es obligatorio"
            
        if activity_type not in valid_types:
            return False, f"El tipo de actividad debe ser uno de: {', '.join(valid_types)}"
            
        return True, None
    
    @staticmethod
    def validate_location_type(location_type: str) -> Tuple[bool, Optional[str]]:
        """
        Valida un tipo de ubicación para solicitudes
        
        Args:
            location_type: Tipo de ubicación ('university', 'external', 'virtual')
            
        Returns:
            Tuple[bool, Optional[str]]: (Es válido, Mensaje de error si no es válido)
        """
        # Si es None, es válido (opcional)
        if location_type is None:
            return True, None
            
        valid_types = ['university', 'external', 'virtual']
        
        if location_type not in valid_types:
            return False, f"El tipo de ubicación debe ser uno de: {', '.join(valid_types)}"
            
        return True, None
    
    @staticmethod
    def validate_recurrence_type(recurrence_type: str) -> Tuple[bool, Optional[str]]:
        """
        Valida un tipo de recurrencia para eventos
        
        Args:
            recurrence_type: Tipo de recurrencia ('daily', 'weekly', 'monthly', 'manual')
            
        Returns:
            Tuple[bool, Optional[str]]: (Es válido, Mensaje de error si no es válido)
        """
        valid_types = ['daily', 'weekly', 'monthly', 'manual']
        
        if not recurrence_type:
            return False, "El tipo de recurrencia es obligatorio"
            
        if recurrence_type not in valid_types:
            return False, f"El tipo de recurrencia debe ser uno de: {', '.join(valid_types)}"
            
        return True, None
    
    @staticmethod
    def validate_date_range(start_date, end_date) -> Tuple[bool, Optional[str]]:
        """
        Valida que una fecha de fin sea posterior o igual a una fecha de inicio
        
        Args:
            start_date: Fecha de inicio
            end_date: Fecha de fin
            
        Returns:
            Tuple[bool, Optional[str]]: (Es válido, Mensaje de error si no es válido)
        """
        if not start_date or not end_date:
            return True, None  # Alguna fecha es None, no validamos
            
        if end_date < start_date:
            return False, "La fecha de fin debe ser posterior o igual a la fecha de inicio"
            
        return True, None
    
    @staticmethod
    def validate_time_range(start_time, end_time) -> Tuple[bool, Optional[str]]:
        """
        Valida que una hora de fin sea posterior a una hora de inicio
        
        Args:
            start_time: Hora de inicio
            end_time: Hora de fin
            
        Returns:
            Tuple[bool, Optional[str]]: (Es válido, Mensaje de error si no es válido)
        """
        if not start_time or not end_time:
            return True, None  # Alguna hora es None, no validamos
            
        if end_time <= start_time:
            return False, "La hora de fin debe ser posterior a la hora de inicio"
            
        return True, None