"""
Clases base y tipos comunes para el sistema de validación
"""

from dataclasses import dataclass
from typing import Dict, List, Optional
from pathlib import Path
import re


@dataclass
class ValidationResult:
    """Resultado de una validación específica"""
    success: bool
    issues: List[str]
    warnings: List[str]
    stats: Dict
    details: Optional[Dict] = None


class BaseValidator:
    """Validador base con funcionalidades comunes"""
    
    def __init__(self, models_path: str, verbose: bool = False):
        self.models_path = Path(models_path)
        self.verbose = verbose
        self.issues = []
        self.warnings = []
        self.stats = {}
    
    def log_verbose(self, message: str):
        """Log en modo verbose"""
        if self.verbose:
            print(f"   🔍 {message}")
    
    def log_info(self, message: str):
        """Log de información"""
        print(f"   ℹ️  {message}")
    
    def log_warning(self, message: str):
        """Log de advertencia"""
        print(f"   ⚠️  {message}")
        self.warnings.append(message)
    
    def log_error(self, message: str):
        """Log de error"""
        print(f"   ❌ {message}")
        self.issues.append(message)
    
    def get_model_files(self) -> List[Path]:
        """Obtiene lista de archivos de modelos"""
        model_files = []
        for py_file in self.models_path.rglob("*.py"):
            if py_file.name not in ["__init__.py", "base.py"] and not py_file.name.startswith("test_"):
                model_files.append(py_file)
        return model_files
    
    def read_file_content(self, file_path: Path) -> str:
        """Lee contenido de un archivo de forma segura"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            self.log_error(f"Error leyendo {file_path.name}: {e}")
            return ""
    
    def find_pattern_matches(self, content: str, pattern: str, flags: int = 0) -> List[str]:
        """Busca coincidencias de patrón en contenido"""
        try:
            return re.findall(pattern, content, flags)
        except re.error as e:
            self.log_error(f"Error en patrón regex '{pattern}': {e}")
            return []
    
    def validate(self) -> ValidationResult:
        """Método principal de validación - debe ser implementado por subclases"""
        raise NotImplementedError("Subclases deben implementar el método validate()")


class BaseFixer:
    """Corrector base con funcionalidades comunes"""
    
    def __init__(self, models_path: str, verbose: bool = False):
        self.models_path = Path(models_path)
        self.verbose = verbose
        self.fixed_files = []
        self.errors = []
    
    def log_verbose(self, message: str):
        """Log en modo verbose"""
        if self.verbose:
            print(f"   🔧 {message}")
    
    def log_info(self, message: str):
        """Log de información"""
        print(f"   ℹ️  {message}")
    
    def log_success(self, message: str):
        """Log de éxito"""
        print(f"   ✅ {message}")
    
    def log_error(self, message: str):
        """Log de error"""
        print(f"   ❌ {message}")
        self.errors.append(message)
    
    def backup_file(self, file_path: Path) -> bool:
        """Crea backup de un archivo antes de modificarlo"""
        try:
            backup_path = file_path.with_suffix(f"{file_path.suffix}.backup")
            backup_path.write_text(file_path.read_text(encoding='utf-8'), encoding='utf-8')
            self.log_verbose(f"Backup creado: {backup_path}")
            return True
        except Exception as e:
            self.log_error(f"Error creando backup de {file_path}: {e}")
            return False
    
    def write_file_safely(self, file_path: Path, content: str) -> bool:
        """Escribe archivo de forma segura"""
        try:
            file_path.write_text(content, encoding='utf-8')
            if file_path not in self.fixed_files:
                self.fixed_files.append(file_path)
            return True
        except Exception as e:
            self.log_error(f"Error escribiendo {file_path}: {e}")
            return False
    
    def fix_all(self) -> bool:
        """Método principal de corrección - debe ser implementado por subclases"""
        raise NotImplementedError("Subclases deben implementar el método fix_all()")


class BaseReporter:
    """Generador de reportes base"""
    
    def __init__(self, verbose: bool = False):
        self.verbose = verbose
    
    def log_verbose(self, message: str):
        """Log en modo verbose"""
        if self.verbose:
            print(f"   📋 {message}")
    
    def format_section(self, title: str, level: int = 1) -> str:
        """Formatea una sección del reporte"""
        if level == 1:
            return f"\n{'='*80}\n{title}\n{'='*80}\n"
        elif level == 2:
            return f"\n{'-'*60}\n{title}\n{'-'*60}\n"
        else:
            return f"\n### {title}\n"
    
    def format_list(self, items: List[str], prefix: str = "• ") -> str:
        """Formatea una lista de items"""
        if not items:
            return "   (ninguno)\n"
        return "\n".join(f"   {prefix}{item}" for item in items) + "\n"
    
    def format_stats(self, stats: Dict) -> str:
        """Formatea estadísticas"""
        if not stats:
            return "   (sin estadísticas)\n"
        
        result = ""
        for key, value in stats.items():
            formatted_key = key.replace('_', ' ').title()
            result += f"   • {formatted_key}: {value}\n"
        return result
