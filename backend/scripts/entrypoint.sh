#!/bin/bash

# Ejecutar migraciones
echo "Ejecutando migraciones..."
python -m alembic upgrade head

# Ejecutar la aplicación
echo "Iniciando aplicación..."
if [ "$ENVIRONMENT" = "development" ]; then
  # En desarrollo, usar reloader
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
else
  # En producción, sin reloader
  uvicorn app.main:app --host 0.0.0.0 --port 8000
fi
