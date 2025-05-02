#!/bin/bash

# Script para desplegar MediaLab en producción

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Iniciando despliegue de MediaLab...${NC}"

# Ir al directorio del proyecto
cd /var/www/medialab/medialab

# Actualizar código desde el repositorio
echo -e "${YELLOW}Actualizando código desde el repositorio...${NC}"
git pull

# Construir y levantar contenedores Docker con variables de entorno
echo -e "${YELLOW}Construyendo y levantando servicios Docker...${NC}"
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build

# Esperar a que los servicios estén listos
echo -e "${YELLOW}Esperando a que los servicios estén listos...${NC}"
sleep 10

# Copiar los archivos del build del frontend al directorio que lee Nginx
echo -e "${YELLOW}Copiando archivos del frontend a la carpeta servida por Nginx...${NC}"
mkdir -p /var/www/medialab/medialab/frontend/dist
docker cp $(docker compose -f docker-compose.prod.yml ps -q frontend):/app/dist/. /var/www/medialab/medialab/frontend/dist/

# Ajustar permisos
echo -e "${YELLOW}Ajustando permisos...${NC}"
chown -R www-data:www-data /var/www/medialab/medialab/frontend/dist

# Verificar que el backend esté funcionando
echo -e "${YELLOW}Verificando que el backend esté funcionando...${NC}"
if curl -s http://localhost:8000/api/v1/ > /dev/null; then
    echo -e "${GREEN}Backend funcionando correctamente${NC}"
else
    echo -e "${RED}Error: El backend no responde. Verifica los logs con: docker compose -f docker-compose.prod.yml logs backend${NC}"
fi

# Recordatorio de verificar Nginx
echo -e "${YELLOW}Verificando configuración de Nginx...${NC}"
nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Configuración de Nginx correcta. Reiniciando Nginx...${NC}"
    systemctl restart nginx
else
    echo -e "${RED}Error en la configuración de Nginx. Corrige los errores antes de continuar.${NC}"
    exit 1
fi

echo -e "${GREEN}¡Despliegue completado! MediaLab debería estar accesible en https://medialab.eklista.com${NC}"
echo -e "${YELLOW}Si encuentras algún problema, verifica los logs con: docker compose -f docker-compose.prod.yml logs${NC}"