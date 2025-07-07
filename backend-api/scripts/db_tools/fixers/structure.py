"""
Corrector automático de estructura de modelos
"""

import time
from typing import List

from ..reporters.results import BaseFixer, ValidationResult, ValidationIssue, ValidationLevel


class StructureFixer(BaseFixer):
    """Corrector automático de estructura y organización"""
    
    def fix(self, dry_run: bool = True) -> ValidationResult:
        """Aplica correcciones de estructura"""
        start_time = time.time()
        issues = []
        stats = {
            'files_created': 0,
            'files_removed': 0,
            'directories_created': 0
        }
        
        # 1. Crear directorios faltantes
        missing_dirs = self._create_missing_directories(dry_run)
        stats['directories_created'] = len(missing_dirs)
        if missing_dirs:
            issues.append(ValidationIssue(
                level=ValidationLevel.INFO,
                file_path="estructura",
                message=f"Creados {len(missing_dirs)} directorios de módulos"
            ))
        
        # 2. Remover archivos obsoletos
        removed_files = self._remove_obsolete_files(dry_run)
        stats['files_removed'] = len(removed_files)
        if removed_files:
            issues.append(ValidationIssue(
                level=ValidationLevel.INFO,
                file_path="limpieza",
                message=f"Removidos {len(removed_files)} archivos obsoletos"
            ))
        
        # 3. Crear __init__.py si falta
        init_created = self._create_init_files(dry_run)
        stats['files_created'] = len(init_created)
        if init_created:
            issues.append(ValidationIssue(
                level=ValidationLevel.INFO,
                file_path="__init__.py",
                message=f"Creados {len(init_created)} archivos __init__.py"
            ))
        
        execution_time = time.time() - start_time
        success = True  # Las correcciones de estructura generalmente no fallan
        
        return ValidationResult(
            validator_name=self.name,
            success=success,
            issues=issues,
            stats=stats,
            execution_time=execution_time
        )
    
    def _create_missing_directories(self, dry_run: bool) -> List[str]:
        """Crea directorios de módulos faltantes"""
        expected_modules = [
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
        
        created = []
        for module in expected_modules:
            module_path = self.models_path / module
            if not module_path.exists():
                if not dry_run:
                    module_path.mkdir(parents=True, exist_ok=True)
                created.append(module)
                print(f"{'[DRY RUN] ' if dry_run else ''}Creado directorio: {module}/")
        
        return created
    
    def _remove_obsolete_files(self, dry_run: bool) -> List[str]:
        """Remueve archivos obsoletos"""
        obsolete_files = [
            "core.py",
            "models.py", 
            "all_models.py"
        ]
        
        removed = []
        for obsolete_file in obsolete_files:
            file_path = self.models_path / obsolete_file
            if file_path.exists():
                if not dry_run:
                    file_path.unlink()
                removed.append(obsolete_file)
                print(f"{'[DRY RUN] ' if dry_run else ''}Removido archivo obsoleto: {obsolete_file}")
        
        return removed
    
    def _create_init_files(self, dry_run: bool) -> List[str]:
        """Crea archivos __init__.py faltantes"""
        created = []
        
        # __init__.py principal
        main_init = self.models_path / "__init__.py"
        if not main_init.exists():
            init_content = '''"""
Modelos de base de datos para Medialab Backend
Estructura modular organizada por funcionalidad
"""

# Imports principales se pueden agregar aquí
# from .user_management import User, UserType
# from .projects import Project, Course
# etc.
'''
            if not dry_run:
                with open(main_init, 'w', encoding='utf-8') as f:
                    f.write(init_content)
            created.append("__init__.py")
            print(f"{'[DRY RUN] ' if dry_run else ''}Creado __init__.py principal")
        
        # __init__.py en subdirectorios
        expected_modules = [
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
        
        for module in expected_modules:
            module_path = self.models_path / module
            if module_path.exists():
                module_init = module_path / "__init__.py"
                if not module_init.exists():
                    init_content = f'"""\nModelos del módulo {module}\n"""\n'
                    if not dry_run:
                        with open(module_init, 'w', encoding='utf-8') as f:
                            f.write(init_content)
                    created.append(f"{module}/__init__.py")
                    print(f"{'[DRY RUN] ' if dry_run else ''}Creado {module}/__init__.py")
        
        return created
