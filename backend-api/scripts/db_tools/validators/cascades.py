"""
Validador de cascadas y relaciones
"""

import re
import time
from typing import List

from ..reporters.results import BaseValidator, ValidationResult, ValidationIssue, ValidationLevel


class CascadeValidator(BaseValidator):
    """Valida cascadas y relaciones entre modelos"""
    
    def validate(self) -> ValidationResult:
        """Valida cascadas y relaciones"""
        start_time = time.time()
        issues = []
        stats = {
            'total_relationships': 0,
            'safe_cascades': 0,
            'dangerous_cascades': 0,
            'foreign_keys': 0,
            'files_analyzed': 0
        }
        
        model_files = self._get_model_files()
        
        for model_file in model_files:
            content = self._read_file_safe(model_file)
            if not content:
                continue
            
            stats['files_analyzed'] += 1
            relative_path = str(model_file.relative_to(self.models_path))
            
            # Validar cascadas
            cascade_issues = self._validate_cascades(content, relative_path)
            issues.extend(cascade_issues)
            
            # Validar ForeignKeys
            fk_issues = self._validate_foreign_keys(content, relative_path)
            issues.extend(fk_issues)
            
            # Actualizar estadísticas
            stats['total_relationships'] += len(re.findall(r'relationship\(', content))
            stats['foreign_keys'] += len(re.findall(r'ForeignKey\(', content))
            
            # Contar tipos de cascadas
            cascades = re.findall(r'cascade\s*=\s*["\']([^"\']+)["\']', content)
            for cascade in cascades:
                if 'delete-orphan' in cascade:
                    stats['dangerous_cascades'] += 1
                elif cascade in ['restrict', 'save-update']:
                    stats['safe_cascades'] += 1
        
        execution_time = time.time() - start_time
        success = len([i for i in issues if i.level in [ValidationLevel.CRITICAL, ValidationLevel.ERROR]]) == 0
        
        return ValidationResult(
            validator_name=self.name,
            success=success,
            issues=issues,
            stats=stats,
            execution_time=execution_time
        )
    
    def _validate_cascades(self, content: str, file_path: str) -> List[ValidationIssue]:
        """Valida configuración de cascadas"""
        issues = []
        
        # Buscar cascadas delete-orphan (peligrosas)
        cascade_pattern = r'(\w+)\s*=\s*relationship\([^)]*cascade\s*=\s*["\']([^"\']*delete-orphan[^"\']*)["\']'
        dangerous_matches = re.findall(cascade_pattern, content)
        
        for relationship_name, cascade_value in dangerous_matches:
            # Evaluar si la cascada es realmente peligrosa o es diseño correcto
            if self._is_dangerous_cascade(relationship_name, file_path):
                issues.append(ValidationIssue(
                    level=ValidationLevel.WARNING,
                    file_path=file_path,
                    field_name=relationship_name,
                    message=f"Relación {relationship_name}: Cascada delete-orphan puede ser peligrosa",
                    suggestion="Considerar usar 'restrict' si los registros hijos deben preservarse"
                ))
            else:
                issues.append(ValidationIssue(
                    level=ValidationLevel.INFO,
                    file_path=file_path,
                    field_name=relationship_name,
                    message=f"Relación {relationship_name}: Cascada delete-orphan es apropiada para este diseño",
                    suggestion="Esta cascada es correcta para relaciones padre-hijo estrictas"
                ))
        
        return issues
    
    def _validate_foreign_keys(self, content: str, file_path: str) -> List[ValidationIssue]:
        """Valida configuración de ForeignKeys"""
        issues = []
        
        # Buscar ForeignKeys sin nullable definido explícitamente
        fk_pattern = r'(\w+)\s*=\s*Column\([^)]*ForeignKey\([^)]+\)[^)]*\)'
        fk_matches = re.findall(fk_pattern, content)
        
        fks_without_nullable = []
        for field_name in fk_matches:
            # Verificar si tiene nullable explícito
            field_definition_pattern = rf'{field_name}\s*=\s*Column\([^)]*\)'
            field_match = re.search(field_definition_pattern, content)
            
            if field_match and 'nullable=' not in field_match.group():
                fks_without_nullable.append(field_name)
        
        # Solo reportar si hay 5 o más FKs sin nullable en el mismo archivo
        if len(fks_without_nullable) >= 5:
            issues.append(ValidationIssue(
                level=ValidationLevel.INFO,
                file_path=file_path,
                message=f"Archivo con {len(fks_without_nullable)} ForeignKeys sin nullable explícito: {', '.join(fks_without_nullable[:3])}{'...' if len(fks_without_nullable) > 3 else ''}",
                suggestion="Especificar nullable=True/False en ForeignKeys para mayor claridad"
            ))
        
        return issues
    
    def _is_dangerous_cascade(self, relationship_name: str, file_path: str) -> bool:
        """Determina si una cascada delete-orphan es realmente peligrosa"""
        
        # Cascadas que generalmente son diseño correcto (no peligrosas)
        safe_patterns = [
            'values',      # KPI values, configuration values
            'widgets',     # Dashboard widgets
            'attendees',   # Event attendees  
            'resources',   # Event resources
            'replies',     # Comment replies
            'children',    # Generic child relationships
            'items',       # Collection items
            'details'      # Detail records
        ]
        
        # Cascadas que pueden ser peligrosas
        dangerous_patterns = [
            'history',     # Audit history
            'templates',   # Templates that might be reused
            'logs',        # Log records for auditing
            'backups'      # Backup records
        ]
        
        relationship_lower = relationship_name.lower()
        
        # Si coincide con patrón seguro, no es peligrosa
        if any(pattern in relationship_lower for pattern in safe_patterns):
            return False
        
        # Si coincide con patrón peligroso, es peligrosa
        if any(pattern in relationship_lower for pattern in dangerous_patterns):
            return True
        
        # Por defecto, considerar como potencialmente peligrosa para revisión
        return True
