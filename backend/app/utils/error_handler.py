from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
import logging

# Configurar el logger
logger = logging.getLogger(__name__)

class ErrorHandler:
    """Clase de utilidad para manejar errores en la aplicación"""
    
    @staticmethod
    def handle_db_error(error: SQLAlchemyError, operation: str, entity: str) -> HTTPException:
        """
        Maneja errores de base de datos y genera una excepción HTTP adecuada
        
        Args:
            error: La excepción de SQLAlchemy
            operation: La operación que se estaba realizando (crear, actualizar, etc.)
            entity: La entidad sobre la que se operaba (usuario, rol, etc.)
            
        Returns:
            HTTPException: Una excepción HTTP con detalles del error
        """
        # Registrar el error en el log
        logger.error(f"Error de base de datos al {operation} {entity}: {str(error)}")
        
        # Crear mensaje de error para el cliente
        detail = f"Error al {operation} {entity}"
        
        # Determinar el código de estado adecuado según el tipo de error
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        
        # Personalizar el manejo según los tipos de error específicos
        error_str = str(error)
        
        # Manejo de errores de integridad (por ejemplo, clave duplicada)
        if "violates unique constraint" in error_str or "Duplicate entry" in error_str:
            status_code = status.HTTP_409_CONFLICT
            if "email" in error_str or "username" in error_str:
                detail = f"El {entity} ya existe con los datos proporcionados"
            else:
                detail = f"Los datos proporcionados entran en conflicto con un {entity} existente"
        
        # Manejo de errores de clave foránea
        elif "foreign key constraint" in error_str:
            status_code = status.HTTP_400_BAD_REQUEST
            detail = f"Los datos proporcionados hacen referencia a entidades que no existen"
        
        # Incluir detalles adicionales en ambientes de desarrollo (no en producción)
        # Esto podría controlarse con una variable de entorno
        import os
        if os.environ.get("ENVIRONMENT") == "development":
            detail = f"{detail}: {str(error)}"
        
        return HTTPException(status_code=status_code, detail=detail)
    
    @staticmethod
    def handle_authentication_error(error: Optional[Exception] = None) -> HTTPException:
        """Maneja errores de autenticación"""
        if error:
            logger.error(f"Error de autenticación: {str(error)}")
        
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    @staticmethod
    def handle_permission_error(error: Optional[Exception] = None) -> HTTPException:
        """Maneja errores de permisos"""
        if error:
            logger.error(f"Error de permisos: {str(error)}")
        
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos suficientes para realizar esta acción"
        )
    
    @staticmethod
    def handle_not_found_error(entity: str, entity_id: Optional[Any] = None) -> HTTPException:
        """Maneja errores de recursos no encontrados"""
        detail = f"{entity} no encontrado"
        if entity_id is not None:
            detail = f"{entity} con ID {entity_id} no encontrado"
        
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )
    
    @staticmethod
    def handle_validation_error(error_details: Dict[str, Any]) -> HTTPException:
        """Maneja errores de validación"""
        return HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=error_details
        )