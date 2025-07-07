"""
Validadores de modelos de base de datos
"""

# Imports disponibles cuando sea necesario
__all__ = [
    'StructureValidator',
    'TypeValidator',
    'CascadeValidator', 
    'IntegrityValidator'
]

def __getattr__(name):
    if name == 'StructureValidator':
        from .structure import StructureValidator
        return StructureValidator
    elif name == 'TypeValidator':
        from .types import TypeValidator
        return TypeValidator
    elif name == 'CascadeValidator':
        from .cascades import CascadeValidator
        return CascadeValidator
    elif name == 'IntegrityValidator':
        from .integrity import IntegrityValidator
        return IntegrityValidator
    raise AttributeError(f"module {__name__} has no attribute {name}")
