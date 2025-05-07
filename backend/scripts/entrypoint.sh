#!/bin/bash
set -e

echo "Esperando a que la base de datos esté lista..."
while ! nc -z db 3306; do
  echo "MySQL no está disponible todavía - esperando..."
  sleep 2
done
echo "Base de datos lista!"

echo "Ejecutando migraciones..."
python -m alembic upgrade head

# Crear directorio para flags si no existe
mkdir -p /app/data

# Verificar modo de inicialización
INIT_BASE_STRUCTURE=${INIT_BASE_STRUCTURE:-true}
INIT_DEPARTMENT_DATA=${INIT_DEPARTMENT_DATA:-true}
INTERACTIVE_ADMIN=${INTERACTIVE_ADMIN:-false}
# Nueva variable para controlar si se inicia el servidor
START_SERVER=${START_SERVER:-true}

# Flags para seguimiento de inicializaciones
BASE_STRUCTURE_FLAG="/app/data/.base_structure_initialized"
DEPARTMENT_DATA_FLAG="/app/data/.department_data_initialized"
INTERACTIVE_ADMIN_FLAG="/app/data/.interactive_admin_initialized"

echo "==== Configuración de inicialización ===="
echo "Inicializar estructura base: $INIT_BASE_STRUCTURE"
echo "Inicializar datos de departamentos: $INIT_DEPARTMENT_DATA"
echo "Configuración interactiva de administrador: $INTERACTIVE_ADMIN"
echo "Iniciar servidor después de configuración: $START_SERVER"
echo "========================================"

# Inicializar estructura base (roles, permisos, áreas)
if [ "$INIT_BASE_STRUCTURE" = "true" ] && [ ! -f "$BASE_STRUCTURE_FLAG" ]; then
    echo "Inicializando estructura base..."
    if [ -f "/app/scripts/init_base_structure.py" ]; then
        python /app/scripts/init_base_structure.py
        touch "$BASE_STRUCTURE_FLAG"
    else
        echo "Advertencia: No se encontró script de inicialización de estructura base"
    fi
else
    echo "Estructura base ya inicializada o desactivada"
fi

# Inicializar datos de departamentos
if [ "$INIT_DEPARTMENT_DATA" = "true" ] && [ ! -f "$DEPARTMENT_DATA_FLAG" ]; then
    echo "Inicializando datos de departamentos..."
    if [ -f "/app/scripts/init_department_data.py" ]; then
        python /app/scripts/init_department_data.py
        touch "$DEPARTMENT_DATA_FLAG"
    else
        echo "Advertencia: No se encontró script de inicialización de departamentos"
    fi
else
    echo "Datos de departamentos ya inicializados o desactivados"
fi

# Configuración interactiva de administrador
if [ "$INTERACTIVE_ADMIN" = "true" ] && [ ! -f "$INTERACTIVE_ADMIN_FLAG" ]; then
    echo "Iniciando configuración interactiva de administrador..."
    if [ -f "/app/scripts/interactive_admin_setup.py" ]; then
        python /app/scripts/interactive_admin_setup.py
        touch "$INTERACTIVE_ADMIN_FLAG"
    else
        echo "Advertencia: No se encontró script de configuración interactiva de administrador"
    fi
else
    echo "Configuración interactiva de administrador ya realizada o desactivada"
fi

echo "Inicialización completada"

# Solo iniciar la aplicación si START_SERVER es true
if [ "$START_SERVER" = "true" ]; then
    echo "Iniciando aplicación..."
    exec uvicorn app.main:app --host 0.0.0.0 --port 8000
else
    echo "Configuración completada. No se iniciará el servidor."
    exit 0
fi