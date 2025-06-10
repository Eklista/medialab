# app/utils/response_util.py
from typing import Any, Dict, Optional

def create_response(
    success: bool = True,
    message: str = "Operación exitosa",
    data: Any = None,
    status_code: int = 200,
    errors: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Crear respuesta estandarizada para la API
    
    Args:
        success: Si la operación fue exitosa
        message: Mensaje descriptivo
        data: Datos de respuesta
        status_code: Código de estado HTTP
        errors: Errores si los hay
        
    Returns:
        Diccionario con la respuesta estandarizada
    """
    response = {
        "success": success,
        "message": message,
        "status_code": status_code
    }
    
    if data is not None:
        response["data"] = data
    
    if errors:
        response["errors"] = errors
        
    return response

def create_error_response(
    message: str = "Error en la operación",
    status_code: int = 400,
    errors: Optional[Dict[str, Any]] = None,
    data: Any = None
) -> Dict[str, Any]:
    """
    Crear respuesta de error estandarizada
    """
    return create_response(
        success=False,
        message=message,
        data=data,
        status_code=status_code,
        errors=errors
    )

def create_success_response(
    message: str = "Operación exitosa",
    data: Any = None,
    status_code: int = 200
) -> Dict[str, Any]:
    """
    Crear respuesta de éxito estandarizada
    """
    return create_response(
        success=True,
        message=message,
        data=data,
        status_code=status_code
    )