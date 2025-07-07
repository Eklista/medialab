"""
Corrector automático de tipos de campos
"""

import re
import time
from typing import List, Tuple

from ..reporters.results import BaseFixer, ValidationResult, ValidationIssue, ValidationLevel


class TypeFixer(BaseFixer):
    """Corrector automático de tipos de campos PostgreSQL"""
    
    def fix(self, dry_run: bool = True) -> ValidationResult:
        """Aplica correcciones automáticas de tipos"""
        start_time = time.time()
        issues = []
        stats = {
            'files_processed': 0,
            'json_fixes': 0,
            'datetime_fixes': 0,
            'timezone_fixes': 0,
            'import_fixes': 0
        }
        
        model_files = [f for f in self.models_path.rglob("*.py") 
                      if f.name not in ["__init__.py", "base.py"]]
        
        for model_file in model_files:
            original_content = self._read_file_safe(model_file)
            if not original_content:
                continue
            
            relative_path = str(model_file.relative_to(self.models_path))
            modified_content = original_content
            file_changed = False
            
            # Aplicar correcciones
            modified_content, json_fixes = self._fix_json_fields(modified_content)
            if json_fixes > 0:
                file_changed = True
                stats['json_fixes'] += json_fixes
                issues.append(ValidationIssue(
                    level=ValidationLevel.INFO,
                    file_path=relative_path,
                    message=f"Corregidos {json_fixes} campos JSON"
                ))
            
            modified_content, tz_fixes = self._fix_timezone_fields(modified_content)
            if tz_fixes > 0:
                file_changed = True
                stats['timezone_fixes'] += tz_fixes
                issues.append(ValidationIssue(
                    level=ValidationLevel.INFO,
                    file_path=relative_path,
                    message=f"Agregado timezone a {tz_fixes} campos DateTime"
                ))
            
            modified_content, import_fixes = self._fix_missing_imports(modified_content)
            if import_fixes > 0:
                file_changed = True
                stats['import_fixes'] += import_fixes
                issues.append(ValidationIssue(
                    level=ValidationLevel.INFO,
                    file_path=relative_path,
                    message=f"Agregados {import_fixes} imports PostgreSQL"
                ))
            
            # Escribir archivo si hubo cambios
            if file_changed:
                success = self._write_file_safe(model_file, modified_content, dry_run)
                if success:
                    stats['files_processed'] += 1
                else:
                    issues.append(ValidationIssue(
                        level=ValidationLevel.ERROR,
                        file_path=relative_path,
                        message="Error escribiendo archivo corregido"
                    ))
        
        execution_time = time.time() - start_time
        success = len([i for i in issues if i.level == ValidationLevel.ERROR]) == 0
        
        return ValidationResult(
            validator_name=self.name,
            success=success,
            issues=issues,
            stats=stats,
            execution_time=execution_time
        )
    
    def _fix_json_fields(self, content: str) -> Tuple[str, int]:
        """Corrige campos Text/String que deberían ser JSON"""
        fixes = 0
        
        # Buscar Text/String con comentarios JSON
        pattern = r'(\w+\s*=\s*Column\()(Text|String)(\([^)]*\))?([^)]*)\)(.*#.*[Jj][Ss][Oo][Nn].*)'
        
        def replace_with_json(match):
            nonlocal fixes
            prefix = match.group(1)
            old_type = match.group(2)
            params = match.group(4) if match.group(4) else ''
            comment = match.group(5)
            
            # Limpiar parámetros que no aplican a JSON
            params_clean = re.sub(r',?\s*length=\d+', '', params)
            params_clean = re.sub(r'\(\d+\)', '', params_clean)
            
            fixes += 1
            return f'{prefix}JSON{params_clean}){comment}'
        
        new_content = re.sub(pattern, replace_with_json, content, flags=re.IGNORECASE)
        return new_content, fixes
    
    def _fix_timezone_fields(self, content: str) -> Tuple[str, int]:
        """Agrega timezone=True a campos DateTime"""
        fixes = 0
        
        # Buscar DateTime sin timezone=True
        pattern = r'(Column\(DateTime)(\([^)]*\))?(?!\([^)]*timezone=True)'
        
        def add_timezone(match):
            nonlocal fixes
            prefix = match.group(1)
            params = match.group(2) if match.group(2) else None
            
            if params:
                # Tiene parámetros, insertar timezone al inicio
                inner_params = params[1:-1]  # Quitar paréntesis
                if inner_params:
                    new_params = f'(timezone=True, {inner_params})'
                else:
                    new_params = '(timezone=True)'
            else:
                new_params = '(timezone=True)'
            
            fixes += 1
            return f'{prefix}{new_params}'
        
        # También manejar DateTime sin paréntesis
        content = re.sub(r'(Column\(DateTime)(?!\()', r'\1(timezone=True)', content)
        new_content = re.sub(pattern, add_timezone, content)
        
        # Contar cuántos se agregaron
        original_count = len(re.findall(r'DateTime\([^)]*timezone=True', content))
        new_count = len(re.findall(r'DateTime\([^)]*timezone=True', new_content))
        fixes = new_count - original_count
        
        return new_content, fixes
    
    def _fix_missing_imports(self, content: str) -> Tuple[str, int]:
        """Agrega imports faltantes de PostgreSQL"""
        fixes = 0
        needed_imports = []
        
        # Verificar qué imports se necesitan
        if re.search(r'Column\(JSON', content):
            if 'from sqlalchemy.dialects.postgresql import' not in content or \
               ('from sqlalchemy.dialects.postgresql import' in content and 'JSON' not in content):
                needed_imports.append('JSON')
        
        if re.search(r'Column\(UUID', content):
            if 'from sqlalchemy.dialects.postgresql import' not in content or \
               ('from sqlalchemy.dialects.postgresql import' in content and 'UUID' not in content):
                needed_imports.append('UUID')
        
        if not needed_imports:
            return content, 0
        
        # Agregar imports
        if 'from sqlalchemy.dialects.postgresql import' in content:
            # Agregar a import existente
            pattern = r'(from sqlalchemy\.dialects\.postgresql import )([^\\n]+)'
            def add_to_existing(match):
                prefix = match.group(1)
                existing = match.group(2)
                all_imports = set([imp.strip() for imp in existing.split(',')] + needed_imports)
                return f'{prefix}{", ".join(sorted(all_imports))}'
            
            content = re.sub(pattern, add_to_existing, content)
            fixes = len(needed_imports)
        else:
            # Agregar nuevo import
            import_line = f'from sqlalchemy.dialects.postgresql import {", ".join(sorted(needed_imports))}'
            
            # Buscar donde insertar (después de otros imports de sqlalchemy)
            lines = content.split('\\n')
            insert_pos = 0
            
            for i, line in enumerate(lines):
                if line.startswith('from sqlalchemy import'):
                    insert_pos = i + 1
            
            if insert_pos > 0:
                lines.insert(insert_pos, import_line)
                content = '\\n'.join(lines)
                fixes = len(needed_imports)
        
        return content, fixes
    
    def _read_file_safe(self, file_path) -> str:
        """Override para manejar Path objects"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"Error leyendo {file_path}: {e}")
            return ""
