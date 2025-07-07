"""
Modelos universitarios
=====================

Modelos relacionados con la estructura universitaria.
"""

# Importamos todos los modelos de sus archivos individuales
from .unit import Unit, UnitType
from .professor import Professor, ProfessorUnit
from .extended import Career, Class


__all__ = [
    "Unit", "UnitType",
    "Professor", "ProfessorUnit",
    "Career", "Class"
]
