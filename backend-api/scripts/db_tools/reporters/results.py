"""
Clases base y resultados para las herramientas de base de datos
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from enum import Enum
from pathlib import Path


class ValidationLevel(Enum):
    """Niveles de severidad de validación"""
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


@dataclass
class ValidationIssue:
    """Representa un problema encontrado durante la validación"""
    level: ValidationLevel
    file_path: str
    message: str
    field_name: Optional[str] = None
    line_number: Optional[int] = None
    suggestion: Optional[str] = None


@dataclass 
class ValidationResult:
    """Resultado de una validación"""
    validator_name: str
    success: bool
    issues: List[ValidationIssue] = field(default_factory=list)
    stats: Dict[str, Any] = field(default_factory=dict)
    execution_time: float = 0.0
    
    @property
    def critical_count(self) -> int:
        return len([i for i in self.issues if i.level == ValidationLevel.CRITICAL])
    
    @property
    def error_count(self) -> int:
        return len([i for i in self.issues if i.level == ValidationLevel.ERROR])
    
    @property
    def warning_count(self) -> int:
        return len([i for i in self.issues if i.level == ValidationLevel.WARNING])
    
    @property
    def info_count(self) -> int:
        return len([i for i in self.issues if i.level == ValidationLevel.INFO])


class BaseValidator:
    """Clase base para todos los validadores"""
    
    def __init__(self, models_path: str):
        self.models_path = Path(models_path)
        self.name = self.__class__.__name__
    
    def validate(self) -> ValidationResult:
        """Método principal de validación - debe ser implementado por subclases"""
        raise NotImplementedError("Subclases deben implementar el método validate")
    
    def _read_file_safe(self, file_path: Path) -> Optional[str]:
        """Lee un archivo de forma segura"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"Error leyendo {file_path}: {e}")
            return None
    
    def _get_model_files(self) -> List[Path]:
        """Obtiene lista de archivos de modelos Python"""
        model_files = []
        for py_file in self.models_path.rglob("*.py"):
            if py_file.name not in ["__init__.py", "base.py"] and not py_file.name.startswith("test_"):
                model_files.append(py_file)
        return model_files


class BaseFixer:
    """Clase base para correctores automáticos"""
    
    def __init__(self, models_path: str):
        self.models_path = Path(models_path)
        self.name = self.__class__.__name__
        self.backup_enabled = True
    
    def fix(self, dry_run: bool = True) -> ValidationResult:
        """Método principal de corrección"""
        raise NotImplementedError("Subclases deben implementar el método fix")
    
    def _write_file_safe(self, file_path: Path, content: str, dry_run: bool = True) -> bool:
        """Escribe un archivo de forma segura"""
        if dry_run:
            print(f"[DRY RUN] Escribiría: {file_path}")
            return True
        
        try:
            # Crear backup si está habilitado
            if self.backup_enabled and file_path.exists():
                backup_path = file_path.with_suffix(f"{file_path.suffix}.backup")
                backup_path.write_text(file_path.read_text())
            
            # Escribir nuevo contenido
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        except Exception as e:
            print(f"Error escribiendo {file_path}: {e}")
            return False
