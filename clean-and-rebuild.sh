#!/bin/bash
# clean-and-rebuild.sh - Script para limpiar y reconstruir todo desde cero

echo "==== MediaLab - Limpieza y Reconstrucción ===="
echo "ADVERTENCIA: Este script eliminará todas las imágenes y contenedores del proyecto"
echo "¿Estás seguro de que quieres continuar? (s/n)"
read confirm

if [[ "$confirm" != "s" && "$confirm" != "S" && "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Operación cancelada."
    exit 0
fi

echo "Iniciando limpieza completa..."

# 1. Detener todos los contenedores
echo "1. Deteniendo contenedores..."
docker-compose --env-file .env.dev --profile dev down
docker-compose --env-file .env.dev --profile dev down --remove-orphans

# 2. Eliminar imágenes del proyecto
echo "2. Eliminando imágenes del proyecto..."
docker rmi $(docker images | grep "medialab\|backend\|frontend" | awk '{print $3}') 2>/dev/null || true

# 3. Limpiar system (cuidadosamente)
echo "3. Limpiando sistema Docker..."
docker system prune -f

# 4. Limpiar build cache
echo "4. Limpiando build cache..."
docker builder prune -f

# 5. Verificar volúmenes (sin eliminar datos de BD)
echo "5. Listando volúmenes..."
docker volume ls | grep medialab

echo "¿Quieres eliminar también los volúmenes de datos? (Esto borrará la base de datos) (s/n)"
read delete_volumes

if [[ "$delete_volumes" == "s" || "$delete_volumes" == "S" || "$delete_volumes" == "y" || "$delete_volumes" == "Y" ]]; then
    echo "Eliminando volúmenes..."
    docker volume rm $(docker volume ls | grep medialab | awk '{print $2}') 2>/dev/null || true
fi

# 6. Reconstruir desde cero
echo "6. Reconstruyendo imágenes desde cero..."
docker-compose --env-file .env.dev --profile dev build --no-cache

# 7. Verificar que las imágenes se construyeron
echo "7. Verificando imágenes construidas..."
docker images | grep -E "medialab|backend|frontend"

echo
echo "Limpieza y reconstrucción completada."
echo "Ahora puedes ejecutar:"
echo "./run-interactive.sh     # Para configurar administrador"
echo "# O directamente:"
echo "docker-compose --env-file .env.dev --profile dev up -d"