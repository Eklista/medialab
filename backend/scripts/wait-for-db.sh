#!/bin/bash

set -e

echo "Esperando a que la base de datos esté lista..."
until nc -z db 3306; do
  echo "MySQL no está disponible todavía - esperando..."
  sleep 2
done
echo "Base de datos lista!"

exec "$@"
