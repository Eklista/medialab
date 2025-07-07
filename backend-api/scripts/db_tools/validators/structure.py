"""
Validador de estructura modular de modelos
"""

import re
import time
from pathlib import Path
from typing import List

from ..reporters.results import BaseValidator, ValidationResult, ValidationIssue, ValidationLevel


class StructureValidator(BaseValidator):
    """Valida la estructura modular y organización de los modelos"""
    
    def __init__(self, models_path: str):
        super().__init__(models_path)
        self.expected_modules = [
            'user_management',
            'audit', 
            'projects',
            'tasks',
            'inventory',
            'requests',
            'university',
            'reports',
            'calendar',
            'search',
            'communication',
            'app_settings'
        ]
    
    def validate(self) -> ValidationResult:
        """Valida la estructura modular completa"""
        start_time = time.time()
        issues = []
        stats = {}
        
        # 1. Validar estructura de directorios
        directory_issues = self._validate_directory_structure()
        issues.extend(directory_issues)
        
        # 2. Validar ausencia de archivos obsoletos
        obsolete_issues = self._validate_no_obsolete_files()
        issues.extend(obsolete_issues)
        
        # 3. Validar imports centralizados
        import_issues = self._validate_centralized_imports()
        issues.extend(import_issues)
        
        # 4. Contar archivos y generar estadísticas
        stats = self._generate_structure_stats()
        
        execution_time = time.time() - start_time
        success = len([i for i in issues if i.level in [ValidationLevel.CRITICAL, ValidationLevel.ERROR]]) == 0
        
        return ValidationResult(
            validator_name=self.name,
            success=success,
            issues=issues,
            stats=stats,
            execution_time=execution_time
        )
    
    def _validate_directory_structure(self) -> List[ValidationIssue]:
        """Valida que existan todos los módulos esperados"""
        issues = []
        
        for module in self.expected_modules:
            module_path = self.models_path / module
            if not module_path.exists() or not module_path.is_dir():
                issues.append(ValidationIssue(
                    level=ValidationLevel.ERROR,
                    file_path=str(module_path),
                    message=f"Módulo faltante: {module}",
                    suggestion=f"Crear directorio {module}/ con sus modelos correspondientes"
                ))
        
        return issues
    
    def _validate_no_obsolete_files(self) -> List[ValidationIssue]:
        """Valida que no existan archivos obsoletos"""
        issues = []
        
        # Archivos que no deberían existir
        obsolete_files = [
            "core.py",
            "models.py", 
            "all_models.py"
        ]
        
        for obsolete_file in obsolete_files:
            file_path = self.models_path / obsolete_file
            if file_path.exists():
                issues.append(ValidationIssue(
                    level=ValidationLevel.WARNING,
                    file_path=str(file_path),
                    message=f"Archivo obsoleto encontrado: {obsolete_file}",
                    suggestion=f"Eliminar {obsolete_file} ya que se usa estructura modular"
                ))
        
        return issues
    
    def _validate_centralized_imports(self) -> List[ValidationIssue]:
        """Valida que __init__.py tenga imports centralizados"""
        issues = []
        
        init_file = self.models_path / "__init__.py"
        if not init_file.exists():
            issues.append(ValidationIssue(
                level=ValidationLevel.WARNING,
                file_path=str(init_file),
                message="__init__.py faltante en directorio de modelos",
                suggestion="Crear __init__.py con imports centralizados"
            ))
            return issues
        
        content = self._read_file_safe(init_file)
        if content and 'from .' not in content:
            issues.append(ValidationIssue(
                level=ValidationLevel.INFO,
                file_path=str(init_file),
                message="__init__.py sin imports relativos detectados",
                suggestion="Agregar imports centralizados para facilitar importación"
            ))
        
        return issues
    
    def _generate_structure_stats(self) -> dict:
        """Genera estadísticas de la estructura"""
        stats = {
            'total_modules': len(self.expected_modules),
            'modules_found': 0,
            'total_model_files': 0,
            'files_per_module': {}
        }
        
        # Contar módulos existentes
        for module in self.expected_modules:
            module_path = self.models_path / module
            if module_path.exists() and module_path.is_dir():
                stats['modules_found'] += 1
                
                # Contar archivos por módulo
                py_files = list(module_path.glob("*.py"))
                # Excluir __init__.py
                model_files = [f for f in py_files if f.name != "__init__.py"]
                stats['files_per_module'][module] = len(model_files)
                stats['total_model_files'] += len(model_files)
        
        return stats
