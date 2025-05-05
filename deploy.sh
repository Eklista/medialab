#!/bin/bash
# deploy.sh

set -e

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Iniciando despliegue de MediaLab...${NC}"

# Construir imágenes
echo -e "${YELLOW}Construyendo imágenes Docker...${NC}"
docker compose -f docker-compose.prod.yml build

# Detener servicios existentes
echo -e "${YELLOW}Deteniendo servicios existentes...${NC}"
docker compose -f docker-compose.prod.yml down

# Levantar servicios
echo -e "${YELLOW}Levantando servicios...${NC}"
docker compose -f docker-compose.prod.yml up -d

# Esperar a que los servicios estén listos
echo -e "${YELLOW}Esperando a que los servicios estén listos...${NC}"
sleep 20

# Verificar estado de los servicios
echo -e "${YELLOW}Verificando estado de los servicios...${NC}"
docker compose -f docker-compose.prod.yml ps

echo -e "${GREEN}¡Despliegue completado!${NC}"
echo -e "${YELLOW}MediaLab debería estar accesible en http://medialab.eklista.com${NC}"
echo -e "${YELLOW}Para ver logs: docker compose -f docker-compose.prod.yml logs -f${NC}"