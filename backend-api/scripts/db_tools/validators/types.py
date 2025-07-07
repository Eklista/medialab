"""
Validador de tipos de campos PostgreSQL
"""

import re
import time
from typing import List

from ..reporters.results import BaseValidator, ValidationResult, ValidationIssue, ValidationLevel


class TypeValidator(BaseValidator):
    """Valida tipos de campos optimizados para PostgreSQL"""
    
    def validate(self) -> ValidationResult:
        """Valida todos los tipos de campo"""
        start_time = time.time()
        issues = []
        stats = {
            'json_fields': 0,
            'uuid_fields': 0,
            'datetime_timezone': 0,
            'numeric_fields': 0,
            'text_fields': 0,
            'boolean_fields': 0,
            'files_analyzed': 0
        }
        
        model_files = self._get_model_files()
        
        for model_file in model_files:
            content = self._read_file_safe(model_file)
            if not content:
                continue
            
            stats['files_analyzed'] += 1
            relative_path = str(model_file.relative_to(self.models_path))
            
            # Validar tipos específicos
            issues.extend(self._validate_json_fields(content, relative_path))
            issues.extend(self._validate_uuid_fields(content, relative_path))
            issues.extend(self._validate_datetime_fields(content, relative_path))
            issues.extend(self._validate_numeric_fields(content, relative_path))
            issues.extend(self._validate_boolean_fields(content, relative_path))
            
            # Actualizar estadísticas
            stats['json_fields'] += len(re.findall(r'Column\(JSON', content))
            stats['uuid_fields'] += len(re.findall(r'Column\(UUID', content))
            stats['datetime_timezone'] += len(re.findall(r'DateTime\([^)]*timezone=True', content))
            stats['numeric_fields'] += len(re.findall(r'Column\((?:Numeric|DECIMAL)', content))
            stats['text_fields'] += len(re.findall(r'Column\((?:Text|String)', content))
            stats['boolean_fields'] += len(re.findall(r'Column\(Boolean', content))
        
        execution_time = time.time() - start_time
        success = len([i for i in issues if i.level in [ValidationLevel.CRITICAL, ValidationLevel.ERROR]]) == 0
        
        return ValidationResult(
            validator_name=self.name,
            success=success,
            issues=issues,
            stats=stats,
            execution_time=execution_time
        )
    
    def _validate_json_fields(self, content: str, file_path: str) -> List[ValidationIssue]:
        """Valida campos JSON"""
        issues = []
        
        # Buscar Text/String usado para JSON (con comentarios que lo indiquen)
        json_text_pattern = r'(\w+)\s*=\s*Column\((?:Text|String)[^)]*\).*(?:#.*[Jj][Ss][Oo][Nn]|json|JSON)'
        matches = re.findall(json_text_pattern, content, re.IGNORECASE)
        
        for field_name in matches:
            issues.append(ValidationIssue(
                level=ValidationLevel.ERROR,
                file_path=file_path,
                field_name=field_name,
                message=f"Campo {field_name}: Usar JSON en lugar de Text/String para datos JSON",
                suggestion="Cambiar a Column(JSON) e importar from sqlalchemy.dialects.postgresql import JSON"
            ))
        
        # Verificar imports faltantes
        if 'Column(JSON' in content:
            if 'from sqlalchemy.dialects.postgresql import' not in content or 'JSON' not in content:
                issues.append(ValidationIssue(
                    level=ValidationLevel.WARNING,
                    file_path=file_path,
                    message="Import PostgreSQL JSON faltante",
                    suggestion="Agregar: from sqlalchemy.dialects.postgresql import JSON"
                ))
        
        return issues
    
    def _validate_uuid_fields(self, content: str, file_path: str) -> List[ValidationIssue]:
        """Valida campos UUID"""
        issues = []
        
        # Buscar String(36) que probablemente son UUIDs
        uuid_pattern = r'(\w+)\s*=\s*Column\(String\(36\)[^)]*\)'
        matches = re.findall(uuid_pattern, content)
        
        # Solo reportar si hay 3 o más campos UUID en el mismo archivo
        uuid_fields = [field for field in matches if 'id' in field.lower() or field.endswith('_id')]
        
        if len(uuid_fields) >= 3:
            issues.append(ValidationIssue(
                level=ValidationLevel.INFO,
                file_path=file_path,
                message=f"Archivo con {len(uuid_fields)} campos String(36) para IDs: {', '.join(uuid_fields[:3])}{'...' if len(uuid_fields) > 3 else ''}",
                suggestion="Considerar cambiar a Column(UUID) para mejor rendimiento"
            ))
        
        # Verificar imports UUID
        if 'Column(UUID' in content:
            if 'from sqlalchemy.dialects.postgresql import' not in content or 'UUID' not in content:
                issues.append(ValidationIssue(
                    level=ValidationLevel.WARNING,
                    file_path=file_path,
                    message="Import PostgreSQL UUID faltante",
                    suggestion="Agregar UUID al import: from sqlalchemy.dialects.postgresql import UUID"
                ))
        
        return issues
    
    def _validate_datetime_fields(self, content: str, file_path: str) -> List[ValidationIssue]:
        """Valida campos DateTime"""
        issues = []
        
        # Buscar DateTime sin timezone
        datetime_pattern = r'(\w+)\s*=\s*Column\(DateTime(?!\([^)]*timezone=True)[^)]*\)'
        matches = re.findall(datetime_pattern, content)
        
        for field_name in matches:
            issues.append(ValidationIssue(
                level=ValidationLevel.WARNING,
                file_path=file_path,
                field_name=field_name,
                message=f"Campo {field_name}: DateTime sin timezone",
                suggestion="Agregar timezone=True para consistencia global"
            ))
        
        # Buscar String usado para fechas obvias
        date_string_pattern = r'(\w+)\s*=\s*Column\(String[^)]*\)'
        string_fields = re.findall(date_string_pattern, content)
        
        for field_name in string_fields:
            if any(keyword in field_name.lower() for keyword in ['birth_date', 'start_date', 'end_date', 'created_date']):
                issues.append(ValidationIssue(
                    level=ValidationLevel.ERROR,
                    file_path=file_path,
                    field_name=field_name,
                    message=f"Campo {field_name}: String usado para fecha obvia",
                    suggestion="Cambiar a DateTime(timezone=True) para fechas"
                ))
        
        return issues
    
    def _validate_numeric_fields(self, content: str, file_path: str) -> List[ValidationIssue]:
        """Valida campos numéricos"""
        issues = []
        
        # Buscar Float usado para dinero
        float_pattern = r'(\w+)\s*=\s*Column\(Float[^)]*\)'
        float_fields = re.findall(float_pattern, content)
        
        for field_name in float_fields:
            if any(keyword in field_name.lower() for keyword in ['price', 'cost', 'amount', 'money', 'salary']):
                issues.append(ValidationIssue(
                    level=ValidationLevel.ERROR,
                    file_path=file_path,
                    field_name=field_name,
                    message=f"Campo {field_name}: Float usado para dinero",
                    suggestion="Usar Numeric(precision, scale) para valores monetarios"
                ))
        
        return issues
    
    def _validate_boolean_fields(self, content: str, file_path: str) -> List[ValidationIssue]:
        """Valida campos booleanos"""
        issues = []
        
        # Buscar String/Integer usado para booleanos obvios
        non_bool_pattern = r'(\w+)\s*=\s*Column\((?:String|Integer)[^)]*\)'
        fields = re.findall(non_bool_pattern, content)
        
        for field_name in fields:
            if any(prefix in field_name.lower() for prefix in ['is_', 'has_', 'can_', 'should_', 'enable']):
                issues.append(ValidationIssue(
                    level=ValidationLevel.ERROR,
                    file_path=file_path,
                    field_name=field_name,
                    message=f"Campo {field_name}: Usar Boolean en lugar de String/Integer",
                    suggestion="Cambiar a Column(Boolean) para campos booleanos"
                ))
        
        return issues
