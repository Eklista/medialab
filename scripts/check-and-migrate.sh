#!/bin/bash

set -e

echo "Esperando a que la base de datos esté lista..."
# Esperar a que MySQL esté disponible
until nc -z db 3306; do
  echo "MySQL no está disponible todavía - esperando..."
  sleep 2
done
echo "Base de datos está disponible!"

# Verificar si las tablas existen
echo "Verificando si las tablas ya existen..."
TABLE_EXISTS=$(mysql -h db -u root -prootpassword -D medialab_db -e "SHOW TABLES LIKE 'users';" 2>/dev/null | grep -c "users" || true)

if [ "$TABLE_EXISTS" -eq 0 ]; then
    echo "La tabla 'users' no existe. Ejecutando migraciones..."
    # Ejecutar migraciones
    python -m alembic upgrade head
    
    # Verificar si las migraciones crearon las tablas
    TABLE_EXISTS=$(mysql -h db -u root -prootpassword -D medialab_db -e "SHOW TABLES LIKE 'users';" 2>/dev/null | grep -c "users" || true)
    
    if [ "$TABLE_EXISTS" -eq 0 ]; then
        echo "ERROR: La tabla 'users' no se creó después de ejecutar las migraciones."
        exit 1
    else
        echo "Migraciones aplicadas exitosamente."
    fi
else
    echo "La tabla 'users' ya existe. No es necesario ejecutar migraciones."
fi

# Ejecutar datos iniciales si es necesario
if [ "$INITIALIZE_DATA" = "true" ]; then
    echo "Inicializando datos..."
    python -m scripts.initial_data
fi

# Iniciar la aplicación
echo "Iniciando aplicación..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload