"""
Generador de reportes de validación
"""

from typing import List, Dict, Any
from datetime import datetime

from .results import ValidationResult, ValidationLevel


class ReportGenerator:
    """Genera reportes consolidados de validaciones"""
    
    def __init__(self):
        self.results: List[ValidationResult] = []
    
    def add_result(self, result: ValidationResult):
        """Agrega un resultado de validación"""
        self.results.append(result)
    
    def generate_summary_report(self) -> str:
        """Genera reporte resumen de todas las validaciones"""
        if not self.results:
            return "No hay resultados de validación disponibles."
        
        total_issues = sum(len(result.issues) for result in self.results)
        total_critical = sum(result.critical_count for result in self.results)
        total_errors = sum(result.error_count for result in self.results)
        total_warnings = sum(result.warning_count for result in self.results)
        total_info = sum(result.info_count for result in self.results)
        
        # Determinar estado general
        if total_critical > 0:
            status = "🔴 CRÍTICO"
            status_msg = "Problemas críticos requieren atención inmediata"
        elif total_errors > 0:
            status = "🟠 ERRORES"
            status_msg = "Errores encontrados, corrección recomendada"
        elif total_warnings > 5:
            status = "🟡 ADVERTENCIAS"
            status_msg = "Múltiples advertencias, revisar para optimización"
        else:
            status = "✅ EXCELENTE"
            status_msg = "Modelos optimizados y bien configurados"
        
        report = f"""
{'='*80}
📋 REPORTE CONSOLIDADO MEDIALAB DB VALIDATOR
{'='*80}

🎯 ESTADO GENERAL: {status}
   {status_msg}

📊 RESUMEN DE VALIDACIONES:
   • Validadores ejecutados: {len(self.results)}
   • Total de problemas: {total_issues}
   • Críticos: {total_critical}
   • Errores: {total_errors}  
   • Advertencias: {total_warnings}
   • Informativos: {total_info}

📈 RESULTADOS POR VALIDADOR:
"""
        
        for result in self.results:
            success_icon = "✅" if result.success else "❌"
            report += f"""
   {success_icon} {result.validator_name}:
      • Tiempo: {result.execution_time:.2f}s
      • Problemas: {len(result.issues)} ({result.critical_count}C, {result.error_count}E, {result.warning_count}W, {result.info_count}I)
"""
            
            # Agregar estadísticas específicas si existen
            if result.stats:
                report += f"      • Stats: {self._format_stats(result.stats)}\n"
        
        if total_critical > 0 or total_errors > 0:
            report += f"\n❌ PROBLEMAS PRINCIPALES:\n"
            for result in self.results:
                critical_and_errors = [i for i in result.issues 
                                     if i.level in [ValidationLevel.CRITICAL, ValidationLevel.ERROR]]
                if critical_and_errors:
                    report += f"\n   📁 {result.validator_name}:\n"
                    for issue in critical_and_errors[:5]:  # Mostrar solo los primeros 5
                        report += f"      {self._get_level_icon(issue.level)} {issue.message}\n"
                        if issue.suggestion:
                            report += f"         💡 {issue.suggestion}\n"
        
        report += f"\n🎯 RECOMENDACIONES GENERALES:\n"
        if total_critical > 0:
            report += "   🚨 Corregir problemas críticos antes de producción\n"
        if total_errors > 0:
            report += "   🔧 Aplicar correcciones automáticas disponibles\n"
        if total_warnings > 3:
            report += "   ⚡ Optimizar configuración según advertencias\n"
        
        report += f"\n📝 Reporte generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        
        return report
    
    def generate_detailed_report(self, validator_name: str = None) -> str:
        """Genera reporte detallado de un validador específico o todos"""
        if validator_name:
            results = [r for r in self.results if r.validator_name == validator_name]
            if not results:
                return f"No se encontraron resultados para {validator_name}"
        else:
            results = self.results
        
        report = f"""
{'='*80}
📋 REPORTE DETALLADO MEDIALAB DB VALIDATOR
{'='*80}
"""
        
        for result in results:
            report += f"""
🔍 VALIDADOR: {result.validator_name}
   • Estado: {'✅ Exitoso' if result.success else '❌ Con problemas'}
   • Tiempo de ejecución: {result.execution_time:.2f} segundos
   • Total de problemas: {len(result.issues)}

"""
            
            if result.stats:
                report += "📊 ESTADÍSTICAS:\n"
                for key, value in result.stats.items():
                    report += f"   • {key.replace('_', ' ').title()}: {value}\n"
                report += "\n"
            
            if result.issues:
                # Agrupar por nivel
                by_level = {}
                for issue in result.issues:
                    if issue.level not in by_level:
                        by_level[issue.level] = []
                    by_level[issue.level].append(issue)
                
                for level in [ValidationLevel.CRITICAL, ValidationLevel.ERROR, 
                            ValidationLevel.WARNING, ValidationLevel.INFO]:
                    if level in by_level:
                        issues = by_level[level]
                        report += f"{self._get_level_icon(level)} {level.value} ({len(issues)}):\n"
                        
                        for issue in issues:
                            report += f"   📁 {issue.file_path}\n"
                            if issue.field_name:
                                report += f"      🔖 Campo: {issue.field_name}\n"
                            report += f"      📝 {issue.message}\n"
                            if issue.suggestion:
                                report += f"      💡 {issue.suggestion}\n"
                            report += "\n"
            
            report += f"{'-'*60}\n"
        
        return report
    
    def _format_stats(self, stats: Dict[str, Any]) -> str:
        """Formatea estadísticas para mostrar"""
        formatted = []
        for key, value in stats.items():
            if isinstance(value, (int, float)) and key != 'execution_time':
                formatted.append(f"{key.replace('_', ' ')}: {value}")
        return ", ".join(formatted[:3])  # Mostrar solo las primeras 3
    
    def _get_level_icon(self, level: ValidationLevel) -> str:
        """Obtiene icono para nivel de severidad"""
        icons = {
            ValidationLevel.CRITICAL: "🚨",
            ValidationLevel.ERROR: "❌", 
            ValidationLevel.WARNING: "⚠️",
            ValidationLevel.INFO: "ℹ️"
        }
        return icons.get(level, "•")
    
    def get_stats_summary(self) -> Dict[str, Any]:
        """Obtiene resumen de estadísticas combinadas"""
        if not self.results:
            return {}
        
        combined_stats = {}
        
        # Combinar estadísticas numéricas
        for result in self.results:
            for key, value in result.stats.items():
                if isinstance(value, (int, float)):
                    if key not in combined_stats:
                        combined_stats[key] = 0
                    combined_stats[key] += value
        
        # Agregar métricas de problemas
        combined_stats['total_validators'] = len(self.results)
        combined_stats['successful_validators'] = sum(1 for r in self.results if r.success)
        combined_stats['total_issues'] = sum(len(r.issues) for r in self.results)
        combined_stats['critical_issues'] = sum(r.critical_count for r in self.results)
        combined_stats['error_issues'] = sum(r.error_count for r in self.results)
        combined_stats['warning_issues'] = sum(r.warning_count for r in self.results)
        
        return combined_stats
