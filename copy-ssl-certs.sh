#!/bin/bash
# copy-ssl-certs.sh - Script para copiar certificados SSL al contenedor de Nginx

set -e

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Copiando certificados SSL al contenedor de Nginx...${NC}"

# Verificar si los archivos de certificados existen
if [ ! -f "./nginx/ssl/fullchain.pem" ] || [ ! -f "./nginx/ssl/privkey.pem" ]; then
    echo -e "${RED}No se encontraron los archivos de certificados en ./nginx/ssl/${NC}"
    echo -e "${YELLOW}Asegúrate de tener los archivos fullchain.pem y privkey.pem en el directorio ./nginx/ssl/${NC}"
    exit 1
fi

# Obtener el nombre del contenedor de Nginx
NGINX_CONTAINER=$(docker compose -f docker-compose.prod.yml ps -q nginx)

if [ -z "$NGINX_CONTAINER" ]; then
    echo -e "${RED}No se pudo encontrar el contenedor de Nginx.${NC}"
    echo -e "${YELLOW}Asegúrate de que el servicio de Nginx esté en ejecución.${NC}"
    exit 1
fi

# Copiar los certificados al contenedor
docker cp ./nginx/ssl/fullchain.pem $NGINX_CONTAINER:/etc/nginx/ssl/
docker cp ./nginx/ssl/privkey.pem $NGINX_CONTAINER:/etc/nginx/ssl/

# Verificar si la copia fue exitosa
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Certificados copiados exitosamente.${NC}"
    echo -e "${YELLOW}Reiniciando Nginx para aplicar los cambios...${NC}"
    
    # Reiniciar Nginx dentro del contenedor
    docker exec $NGINX_CONTAINER nginx -s reload
    
    echo -e "${GREEN}¡Listo! Nginx ha sido reiniciado con los nuevos certificados.${NC}"
else
    echo -e "${RED}Hubo un error al copiar los certificados.${NC}"
    exit 1
fi