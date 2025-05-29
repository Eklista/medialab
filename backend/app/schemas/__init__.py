# ============================================================================
# backend/app/schemas/__init__.py
# ============================================================================
"""
Schemas principales de la aplicación
Exporta todos los schemas organizados por módulos
"""

# Schemas de autenticación y seguridad
from .auth import *

# Schemas de usuarios
from .users import *

# Schemas de organización
from .organization import *

# Schemas de comunicación
from .communication import *

# Schemas de plantillas
from .templates import *

# Schemas de requests/solicitudes
from .requests import *

# Schemas multimedia
from .multimedia import *

# Schemas de seguridad
from .security import *

# Schemas comunes
from .common import *