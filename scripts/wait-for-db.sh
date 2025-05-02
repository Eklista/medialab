# Crear scripts/wait-for-db.sh
echo '#!/bin/bash

set -e

echo "Esperando a que la base de datos esté lista..."
until nc -z db 3306; do
  echo "MySQL no está disponible todavía - esperando..."
  sleep 2
done
echo "Base de datos lista!"

exec "$@"' > scripts/wait-for-db.sh

# Crear scripts/entrypoint.sh
echo '#!/bin/bash

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
fi' > scripts/entrypoint.sh

# Hacer ejecutables los scripts
chmod +x scripts/wait-for-db.sh scripts/entrypoint.sh