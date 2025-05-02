#!/bin/bash

echo "Esperando a que la base de datos esté lista..."
# Esperar que MySQL esté listo
while ! nc -z db 3306; do
  sleep 1
done
echo "Base de datos lista!"

echo "Ejecutando migraciones..."
# Ejecutar migraciones
python -m alembic upgrade head

echo "Inicializando datos (si es necesario)..."
# Comprobar si hay datos iniciales y crearlos si no existen
python -m app.initial_data

echo "Iniciando la aplicación..."
# Iniciar la aplicación
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload