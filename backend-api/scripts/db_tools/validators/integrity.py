"""
Validador de integridad general de modelos
"""

import re
import time
from typing import List

from ..reporters.results import BaseValidator, ValidationResult, ValidationIssue, ValidationLevel


class IntegrityValidator(BaseValidator):
    """Valida integridad general y configuración de modelos"""
    
    def validate(self) -> ValidationResult:
        """Valida integridad completa de los modelos"""
        start_time = time.time()
        issues = []
        stats = {
            'models_found': 0,
            'tables_defined': 0,
            'primary_keys': 0,
            'indexes': 0,
            'unique_constraints': 0,
            'files_analyzed': 0
        }
        
        model_files = self._get_model_files()
        
        for model_file in model_files:
            content = self._read_file_safe(model_file)
            if not content:
                continue
            
            stats['files_analyzed'] += 1
            relative_path = str(model_file.relative_to(self.models_path))
            
            # Validar configuración básica
            issues.extend(self._validate_table_configuration(content, relative_path))
            issues.extend(self._validate_primary_keys(content, relative_path))
            issues.extend(self._validate_indexes(content, relative_path))
            issues.extend(self._validate_table_names(content, relative_path))
            
            # Actualizar estadísticas
            if 'class ' in content and '(Base)' in content:
                stats['models_found'] += 1
            
            stats['tables_defined'] += len(re.findall(r'__tablename__', content))
            stats['primary_keys'] += len(re.findall(r'primary_key=True', content))
            stats['indexes'] += len(re.findall(r'index=True', content))
            stats['unique_constraints'] += len(re.findall(r'unique=True', content))
        
        execution_time = time.time() - start_time
        success = len([i for i in issues if i.level in [ValidationLevel.CRITICAL, ValidationLevel.ERROR]]) == 0
        
        return ValidationResult(
            validator_name=self.name,
            success=success,
            issues=issues,
            stats=stats,
            execution_time=execution_time
        )
    
    def _validate_table_configuration(self, content: str, file_path: str) -> List[ValidationIssue]:
        """Valida configuración básica de tablas"""
        issues = []
        
        # Verificar que las clases modelo tengan __tablename__
        class_pattern = r'class\s+(\w+)\s*\([^)]*Base[^)]*\):'
        class_matches = re.findall(class_pattern, content)
        
        for class_name in class_matches:
            if '__tablename__' not in content:
                issues.append(ValidationIssue(
                    level=ValidationLevel.ERROR,
                    file_path=file_path,
                    message=f"Clase {class_name}: Falta __tablename__",
                    suggestion="Agregar __tablename__ = 'nombre_tabla' en la clase modelo"
                ))
        
        return issues
    
    def _validate_primary_keys(self, content: str, file_path: str) -> List[ValidationIssue]:
        """Valida configuración de claves primarias"""
        issues = []
        
        # Verificar que campos id tengan primary_key=True
        id_pattern = r'(\w*id\w*)\s*=\s*Column\([^)]*\)'
        id_matches = re.findall(id_pattern, content, re.IGNORECASE)
        
        for field_name in id_matches:
            if field_name.lower() == 'id' or field_name.endswith('_id'):
                field_def_pattern = rf'{field_name}\s*=\s*Column\([^)]*\)'
                field_match = re.search(field_def_pattern, content)
                
                if field_match and field_name.lower() == 'id':
                    if 'primary_key=True' not in field_match.group():
                        issues.append(ValidationIssue(
                            level=ValidationLevel.WARNING,
                            file_path=file_path,
                            field_name=field_name,
                            message=f"Campo {field_name}: Probablemente necesita primary_key=True",
                            suggestion="Agregar primary_key=True si es clave primaria"
                        ))
        
        # Contar ForeignKeys sin índice para reporte agrupado
        fk_pattern = r'(\w+)\s*=\s*Column\([^)]*ForeignKey[^)]*\)'
        fk_matches = re.findall(fk_pattern, content)
        fks_without_index = [fk for fk in fk_matches if f'index=True' not in content or f'{fk}' not in content]
        
        # Solo reportar si hay 3 o más FKs sin índice en el mismo archivo
        if len(fks_without_index) >= 3:
            issues.append(ValidationIssue(
                level=ValidationLevel.INFO,
                file_path=file_path,
                message=f"Archivo con {len(fks_without_index)} ForeignKeys sin índice: {', '.join(fks_without_index[:3])}{'...' if len(fks_without_index) > 3 else ''}",
                suggestion="Considerar agregar index=True a ForeignKeys para mejor rendimiento"
            ))
        
        return issues
    
    def _validate_indexes(self, content: str, file_path: str) -> List[ValidationIssue]:
        """Valida configuración de índices"""
        issues = []
        
        # Verificar que ForeignKeys tengan índices
        fk_pattern = r'(\w+)\s*=\s*Column\([^)]*ForeignKey\([^)]+\)[^)]*\)'
        fk_matches = re.findall(fk_pattern, content)
        
        fks_without_index = []
        for field_name in fk_matches:
            field_def_pattern = rf'{field_name}\s*=\s*Column\([^)]*\)'
            field_match = re.search(field_def_pattern, content)
            
            if field_match and 'index=True' not in field_match.group():
                fks_without_index.append(field_name)
        
        # Solo reportar si hay 3 o más FKs sin índice en el mismo archivo
        if len(fks_without_index) >= 3:
            issues.append(ValidationIssue(
                level=ValidationLevel.INFO,
                file_path=file_path,
                message=f"Archivo con {len(fks_without_index)} ForeignKeys sin índice: {', '.join(fks_without_index[:3])}{'...' if len(fks_without_index) > 3 else ''}",
                suggestion="Considerar agregar index=True a ForeignKeys para mejor rendimiento"
            ))
        
        return issues
    
    def _validate_table_names(self, content: str, file_path: str) -> List[ValidationIssue]:
        """Valida nombres de tablas"""
        issues = []
        
        # Buscar nombres de tabla y verificar pluralización
        tablename_pattern = r'__tablename__\s*=\s*["\']([^"\']+)["\']'
        tablename_matches = re.findall(tablename_pattern, content)
        
        for table_name in tablename_matches:
            # Verificar pluralización (excepto casos especiales como 'equipment')
            if not table_name.endswith('s') and table_name not in ['equipment', 'data', 'information']:
                issues.append(ValidationIssue(
                    level=ValidationLevel.INFO,
                    file_path=file_path,
                    message=f"Tabla '{table_name}': Considerar nombre plural",
                    suggestion="Usar nombres plurales para tablas por convención"
                ))
            
            # Verificar que use snake_case
            if re.search(r'[A-Z]', table_name):
                issues.append(ValidationIssue(
                    level=ValidationLevel.WARNING,
                    file_path=file_path,
                    message=f"Tabla '{table_name}': Usar snake_case en lugar de camelCase",
                    suggestion="Convertir a snake_case: ej. 'UserProfile' -> 'user_profiles'"
                ))
        
        return issues
