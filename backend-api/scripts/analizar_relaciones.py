#!/usr/bin/env python3
"""
Script para analizar y identificar relaciones incorrectas en los modelos
"""

import re
import os
from pathlib import Path
from collections import defaultdict

def analizar_archivo(archivo):
    """Analiza un archivo Python para extraer ForeignKeys y relationships"""
    try:
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
    except:
        return None, None, None
    
    # Extraer nombre de la clase
    clase_match = re.search(r'class\s+(\w+)\s*\([^)]*Base[^)]*\):', contenido)
    if not clase_match:
        return None, None, None
    
    nombre_clase = clase_match.group(1)
    
    # Extraer ForeignKeys
    fk_pattern = r'(\w+)\s*=\s*Column\([^)]*ForeignKey\(["\']([^"\']+)["\'][^)]*\)'
    foreign_keys = re.findall(fk_pattern, contenido)
    
    # Extraer relationships
    rel_pattern = r'(\w+)\s*=\s*relationship\(["\']([^"\']+)["\'](?:.*?back_populates=["\']([^"\']+)["\'])?'
    relationships = re.findall(rel_pattern, contenido)
    
    return nombre_clase, foreign_keys, relationships

def main():
    models_dir = Path("/media/eklista/DATA/Proyectos/Medialab/backend-api/app/models")
    
    # Mapas para análisis
    clases_encontradas = {}
    foreign_keys_globales = defaultdict(list)
    relationships_globales = defaultdict(list)
    
    print("🔍 Analizando modelos de base de datos...")
    print("="*60)
    
    # Analizar todos los archivos
    for archivo in models_dir.rglob("*.py"):
        if archivo.name in ["__init__.py", "base.py"]:
            continue
            
        nombre_clase, foreign_keys, relationships = analizar_archivo(archivo)
        
        if nombre_clase:
            clases_encontradas[nombre_clase] = str(archivo.relative_to(models_dir))
            
            if foreign_keys:
                foreign_keys_globales[nombre_clase] = foreign_keys
                
            if relationships:
                relationships_globales[nombre_clase] = relationships
    
    print(f"📊 Encontradas {len(clases_encontradas)} clases modelo")
    print("\n🔗 ANÁLISIS DE RELACIONES PROBLEMÁTICAS:")
    print("="*60)
    
    problemas = []
    
    # Verificar relationships sin back_populates
    for clase, rels in relationships_globales.items():
        for rel_nombre, rel_clase, back_pop in rels:
            if not back_pop:  # Sin back_populates
                problemas.append(f"❌ {clase}.{rel_nombre} → {rel_clase} (sin back_populates)")
            else:
                # Verificar si la relación inversa existe
                if rel_clase in relationships_globales:
                    rel_inversa_existe = any(
                        r[0] == back_pop and r[1] == clase 
                        for r in relationships_globales[rel_clase]
                    )
                    if not rel_inversa_existe:
                        problemas.append(f"⚠️  {clase}.{rel_nombre} ↔ {rel_clase}.{back_pop} (relación inversa faltante)")
    
    # Verificar ForeignKeys sin relationship correspondiente
    for clase, fks in foreign_keys_globales.items():
        if clase in relationships_globales:
            rel_names = [r[0] for r in relationships_globales[clase]]
            for fk_nombre, fk_tabla in fks:
                # Buscar si existe un relationship para este FK
                fk_base = fk_nombre.replace('_id', '')
                if fk_base not in rel_names and fk_nombre not in rel_names:
                    problemas.append(f"🔗 {clase}.{fk_nombre} → {fk_tabla} (sin relationship)")
    
    # Mostrar resultados
    if problemas:
        print("\n🚨 PROBLEMAS ENCONTRADOS:")
        for i, problema in enumerate(problemas, 1):
            print(f"{i:2d}. {problema}")
    else:
        print("✅ No se encontraron problemas en las relaciones!")
    
    print(f"\n📈 RESUMEN:")
    print(f"   • Clases analizadas: {len(clases_encontradas)}")
    print(f"   • ForeignKeys encontrados: {sum(len(fks) for fks in foreign_keys_globales.values())}")
    print(f"   • Relationships encontrados: {sum(len(rels) for rels in relationships_globales.values())}")
    print(f"   • Problemas detectados: {len(problemas)}")

if __name__ == "__main__":
    main()
