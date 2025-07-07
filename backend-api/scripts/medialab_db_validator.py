#!/usr/bin/env python3
"""
Validador de Base de Datos de Medialab
======================================

Script unificado para validar, reparar y generar reportes sobre modelos de base de datos.
Reemplaza todos los scripts de validación legacy con una herramienta única y modular.

Uso:
    python medialab_db_validator.py validar [--filtro tipo] [--verboso]
    python medialab_db_validator.py reparar [--filtro tipo] [--prueba] [--verboso]
    python medialab_db_validator.py reporte [--formato json|html|txt] [--salida archivo]

Ejemplos:
    # Validar todos los modelos
    python medialab_db_validator.py validar
    
    # Validar solo problemas de tipos
    python medialab_db_validator.py validar --filtro types
    
    # Reparar problemas de tipos con ejecución de prueba
    python medialab_db_validator.py reparar --filtro types --prueba
    
    # Generar reporte HTML
    python medialab_db_validator.py reporte --formato html --salida reporte.html
"""

import argparse
import sys
import os
from pathlib import Path
from typing import List, Dict, Any, Optional

# Add the backend-api directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

def import_validator(validator_type: str):
    """Importar dinámicamente una clase validadora."""
    try:
        if validator_type == 'structure':
            from db_tools.validators.structure import StructureValidator
            return StructureValidator
        elif validator_type == 'types':
            from db_tools.validators.types import TypeValidator
            return TypeValidator
        elif validator_type == 'cascades':
            from db_tools.validators.cascades import CascadeValidator
            return CascadeValidator
        elif validator_type == 'integrity':
            from db_tools.validators.integrity import IntegrityValidator
            return IntegrityValidator
        else:
            raise ValueError(f"Tipo de validador desconocido: {validator_type}")
    except ImportError as e:
        print(f"Error importando validador {validator_type}: {e}")
        return None

def import_fixer(fixer_type: str):
    """Importar dinámicamente una clase reparadora."""
    try:
        if fixer_type == 'types':
            from db_tools.fixers.types import TypeFixer
            return TypeFixer
        elif fixer_type == 'structure':
            from db_tools.fixers.structure import StructureFixer
            return StructureFixer
        else:
            raise ValueError(f"Tipo de reparador desconocido: {fixer_type}")
    except ImportError as e:
        print(f"Error importando reparador {fixer_type}: {e}")
        return None

def import_reporter():
    """Importar dinámicamente el generador de reportes."""
    try:
        from db_tools.reporters.generator import ReportGenerator
        return ReportGenerator
    except ImportError as e:
        print(f"Error importando generador de reportes: {e}")
        return None

def validate_command(args):
    """Ejecutar comando de validación."""
    print("🔍 Iniciando validación de modelos de base de datos...")
    
    # Determinar ruta de modelos
    models_path = str(backend_dir / "app" / "models")
    
    validator_types = ['structure', 'types', 'cascades', 'integrity']
    if args.filtro:
        if args.filtro not in validator_types:
            print(f"❌ Filtro inválido: {args.filtro}. Opciones válidas: {', '.join(validator_types)}")
            return 1
        validator_types = [args.filtro]
    
    all_results = {}
    total_issues = 0
    
    for validator_type in validator_types:
        if args.verboso:
            print(f"  Ejecutando validación de {validator_type}...")
        
        ValidatorClass = import_validator(validator_type)
        if not ValidatorClass:
            print(f"❌ Error al cargar validador {validator_type}")
            continue
        
        try:
            validator = ValidatorClass(models_path)
            results = validator.validate()
            all_results[validator_type] = results
            
            issues = len(results.issues) if hasattr(results, 'issues') else 0
            total_issues += issues
            
            if args.verboso:
                print(f"    Encontrados {issues} problemas")
                # Mostrar algunos problemas de ejemplo si hay muchos
                if hasattr(results, 'issues') and results.issues:
                    # Filtrar por tipo de problema si se especifica
                    issues_to_show = results.issues
                    if hasattr(args, 'solo_criticos') and args.solo_criticos:
                        issues_to_show = [i for i in results.issues if i.level.name in ["CRITICAL", "ERROR"]]
                    
                    if issues_to_show:
                        print(f"      Ejemplos de problemas encontrados:")
                        for i, issue in enumerate(issues_to_show[:3]):  # Mostrar solo los primeros 3
                            level_icon = "🚨" if issue.level.name == "CRITICAL" else "❌" if issue.level.name == "ERROR" else "⚠️" if issue.level.name == "WARNING" else "ℹ️"
                            print(f"        {level_icon} [{issue.level.name}] {issue.message}")
                        if len(issues_to_show) > 3:
                            print(f"        ... y {len(issues_to_show) - 3} más")
                    elif hasattr(args, 'solo_criticos') and args.solo_criticos:
                        print(f"      ✅ No hay problemas críticos en {validator_type}")
                
        except Exception as e:
            print(f"❌ Error en validación de {validator_type}: {e}")
            if args.verboso:
                import traceback
                traceback.print_exc()
    
    # Resumen
    print(f"\n📊 Resumen de Validación:")
    
    # Contar solo problemas reales (CRITICAL y ERROR)
    critical_issues = 0
    error_issues = 0
    warning_issues = 0
    info_issues = 0
    
    for validator_type, results in all_results.items():
        if hasattr(results, 'issues') and results.issues:
            for issue in results.issues:
                if issue.level.name == "CRITICAL":
                    critical_issues += 1
                elif issue.level.name == "ERROR":
                    error_issues += 1
                elif issue.level.name == "WARNING":
                    warning_issues += 1
                elif issue.level.name == "INFO":
                    info_issues += 1
    
    real_problems = critical_issues + error_issues
    print(f"   Problemas críticos: {critical_issues}")
    print(f"   Errores: {error_issues}")
    print(f"   Advertencias: {warning_issues}")
    print(f"   Sugerencias de optimización: {info_issues}")
    print(f"   Total de problemas encontrados: {total_issues}")
    
    if real_problems == 0:
        print("✅ ¡No hay problemas críticos! El código está funcionalmente correcto.")
        if warning_issues > 0:
            print(f"ℹ️  Hay {warning_issues} advertencias menores que pueden revisarse.")
        if info_issues > 0:
            print(f"💡 Hay {info_issues} sugerencias de optimización disponibles.")
        return 0
    else:
        print(f"❌ Se encontraron {real_problems} problemas que requieren atención.")
        
        # Mostrar resumen breve de problemas reales
        for validator_type, results in all_results.items():
            if hasattr(results, 'issues') and results.issues:
                real_issues = [i for i in results.issues if i.level.name in ["CRITICAL", "ERROR"]]
                if real_issues:
                    print(f"   {validator_type}: {len(real_issues)} problemas críticos/errores")
        
        return 1

def fix_command(args):
    """Ejecutar comando de reparación."""
    action = "simulación" if args.prueba else "reparación"
    print(f"🔧 Iniciando {action} de modelos de base de datos...")
    
    # Determinar ruta de modelos
    models_path = str(backend_dir / "app" / "models")
    
    fixer_types = ['types', 'structure']
    if args.filtro:
        if args.filtro not in fixer_types:
            print(f"❌ Filtro inválido: {args.filtro}. Opciones válidas: {', '.join(fixer_types)}")
            return 1
        fixer_types = [args.filtro]
    
    all_results = {}
    total_fixes = 0
    
    for fixer_type in fixer_types:
        if args.verboso:
            print(f"  Ejecutando reparador de {fixer_type}...")
        
        FixerClass = import_fixer(fixer_type)
        if not FixerClass:
            print(f"❌ Error al cargar reparador {fixer_type}")
            continue
        
        try:
            fixer = FixerClass(models_path)
            results = fixer.fix(dry_run=args.prueba)
            all_results[fixer_type] = results
            
            fixes = len(results.fixes_applied) if hasattr(results, 'fixes_applied') else 0
            total_fixes += fixes
            
            if args.verboso:
                print(f"    Aplicadas {fixes} reparaciones")
                
        except Exception as e:
            print(f"❌ Error en reparador {fixer_type}: {e}")
            if args.verboso:
                import traceback
                traceback.print_exc()
    
    # Resumen
    action_word = "se aplicarían" if args.prueba else "aplicadas"
    print(f"\n📊 Resumen de Reparación:")
    print(f"   Total de reparaciones {action_word}: {total_fixes}")
    
    if total_fixes == 0:
        print("✅ ¡No se necesitan reparaciones!")
    else:
        for fixer_type, results in all_results.items():
            if hasattr(results, 'fixes_applied') and results.fixes_applied:
                print(f"   {fixer_type}: {len(results.fixes_applied)} reparaciones")
    
    return 0

def report_command(args):
    """Ejecutar comando de reporte."""
    print("📋 Generando reporte de modelos de base de datos...")
    
    # Determinar ruta de modelos
    models_path = str(backend_dir / "app" / "models")
    
    ReportGeneratorClass = import_reporter()
    if not ReportGeneratorClass:
        print("❌ Error al cargar generador de reportes")
        return 1
    
    try:
        generator = ReportGeneratorClass()
        
        # Ejecutar todas las validaciones y agregar resultados
        validator_types = ['structure', 'types', 'cascades', 'integrity']
        for validator_type in validator_types:
            ValidatorClass = import_validator(validator_type)
            if ValidatorClass:
                try:
                    validator = ValidatorClass(models_path)
                    results = validator.validate()
                    generator.add_result(results)
                except Exception as e:
                    print(f"⚠️  Error en validador {validator_type}: {e}")
        
        # Generar reporte con formato especificado
        if args.formato == 'json':
            import json
            stats = generator.get_stats_summary()
            content = json.dumps(stats, indent=2, ensure_ascii=False)
        elif args.formato == 'html':
            # Para HTML, generar una versión básica basada en el reporte de texto
            text_report = generator.generate_summary_report()
            content = f"""<!DOCTYPE html>
<html>
<head>
    <title>Reporte de Validación - Medialab</title>
    <meta charset="utf-8">
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        pre {{ background: #f5f5f5; padding: 15px; border-radius: 5px; }}
    </style>
</head>
<body>
    <h1>Reporte de Validación de Base de Datos - Medialab</h1>
    <pre>{text_report}</pre>
</body>
</html>"""
        else:  # txt
            content = generator.generate_summary_report()
        
        # Salida a archivo o consola
        if args.salida:
            with open(args.salida, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Reporte guardado en {args.salida}")
        else:
            print("\n" + "="*50)
            print(content)
            print("="*50)
        
        return 0
        
    except Exception as e:
        print(f"❌ Error generando reporte: {e}")
        if args.verboso:
            import traceback
            traceback.print_exc()
        return 1

def main():
    """Punto de entrada principal."""
    parser = argparse.ArgumentParser(
        description="Validador de Base de Datos Medialab - Herramienta unificada para validación, reparación y reportes de modelos",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Comandos disponibles')
    
    # Comando validar
    validate_parser = subparsers.add_parser('validar', help='Validar modelos de base de datos')
    validate_parser.add_argument('--filtro', choices=['structure', 'types', 'cascades', 'integrity'],
                                help='Filtrar validación por tipo')
    validate_parser.add_argument('--solo-criticos', action='store_true',
                                help='Mostrar solo problemas críticos y errores (no sugerencias)')
    validate_parser.add_argument('--verboso', '-v', action='store_true',
                                help='Salida detallada')
    
    # Comando reparar
    fix_parser = subparsers.add_parser('reparar', help='Reparar problemas de modelos de base de datos')
    fix_parser.add_argument('--filtro', choices=['types', 'structure'],
                           help='Filtrar reparaciones por tipo')
    fix_parser.add_argument('--prueba', action='store_true',
                           help='Mostrar qué se repararía sin aplicar cambios')
    fix_parser.add_argument('--verboso', '-v', action='store_true',
                           help='Salida detallada')
    
    # Comando reporte
    report_parser = subparsers.add_parser('reporte', help='Generar reporte de modelos')
    report_parser.add_argument('--formato', choices=['json', 'html', 'txt'], default='txt',
                              help='Formato del reporte (por defecto: txt)')
    report_parser.add_argument('--salida', '-s', help='Archivo de salida (por defecto: consola)')
    report_parser.add_argument('--verboso', '-v', action='store_true',
                              help='Salida detallada')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return 1
    
    # Ejecutar comando
    try:
        if args.command == 'validar':
            return validate_command(args)
        elif args.command == 'reparar':
            return fix_command(args)
        elif args.command == 'reporte':
            return report_command(args)
        else:
            print(f"❌ Comando desconocido: {args.command}")
            return 1
    except KeyboardInterrupt:
        print("\n⚠️  Operación cancelada por el usuario")
        return 1
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())
