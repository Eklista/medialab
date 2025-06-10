# app/core/exceptions.py

class BaseCustomException(Exception):
    """Excepción base personalizada"""
    def __init__(self, message: str = "Error en la aplicación"):
        self.message = message
        super().__init__(self.message)

class ValidationError(BaseCustomException):
    """Error de validación de datos"""
    def __init__(self, message: str = "Error de validación"):
        super().__init__(message)

class NotFoundError(BaseCustomException):
    """Error cuando no se encuentra un recurso"""
    def __init__(self, message: str = "Recurso no encontrado"):
        super().__init__(message)

class ConflictError(BaseCustomException):
    """Error de conflicto (datos duplicados, etc.)"""
    def __init__(self, message: str = "Conflicto en los datos"):
        super().__init__(message)

class AuthenticationError(BaseCustomException):
    """Error de autenticación"""
    def __init__(self, message: str = "Error de autenticación"):
        super().__init__(message)

class AuthorizationError(BaseCustomException):
    """Error de autorización"""
    def __init__(self, message: str = "No autorizado"):
        super().__init__(message)

class DatabaseError(BaseCustomException):
    """Error de base de datos"""
    def __init__(self, message: str = "Error de base de datos"):
        super().__init__(message)

class ExternalServiceError(BaseCustomException):
    """Error en servicio externo"""
    def __init__(self, message: str = "Error en servicio externo"):
        super().__init__(message)