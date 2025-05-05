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

echo "Inicializando datos..."
if [ -f "/app/scripts/initial_data.py" ]; then
    python /app/scripts/initial_data.py
else
    echo "Advertencia: No se encontró script de datos iniciales en /app/scripts/initial_data.py"
fi

echo "Iniciando aplicación..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000