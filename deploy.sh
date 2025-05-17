#!/bin/bash
# deploy.sh - Script mejorado para despliegue de MediaLab (versión unificada)

set -e

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}    DESPLIEGUE DE MEDIALAB         ${NC}"
echo -e "${BLUE}====================================${NC}"

# Verificar si los directorios necesarios existen
echo -e "${YELLOW}Verificando estructura de directorios...${NC}"
mkdir -p nginx/conf.d
mkdir -p nginx/ssl

# Verificar si hay certificados SSL
echo -e "${YELLOW}Verificando certificados SSL...${NC}"
if [ -f "nginx/ssl/fullchain.pem" ] && [ -f "nginx/ssl/privkey.pem" ]; then
    echo -e "${GREEN}Certificados SSL encontrados.${NC}"
    USE_SSL=true
else
    echo -e "${YELLOW}No se encontraron certificados SSL.${NC}"
    echo -e "${YELLOW}El sitio estará disponible solo por HTTP.${NC}"
    USE_SSL=false
fi

# Detener servicios existentes antes de construir (para liberar recursos)
echo -e "${YELLOW}Deteniendo servicios existentes si están en ejecución...${NC}"
docker compose -f docker-compose.prod.yml down || true

# Construir imágenes
echo -e "${YELLOW}Construyendo imágenes Docker...${NC}"
docker compose -f docker-compose.prod.yml build

# Levantar servicios
echo -e "${YELLOW}Levantando servicios...${NC}"
docker compose -f docker-compose.prod.yml up -d

# Esperar a que los servicios estén listos
echo -e "${YELLOW}Esperando a que los servicios estén listos...${NC}"
sleep 20

# Verificar estado de los servicios
echo -e "${YELLOW}Verificando estado de los servicios...${NC}"
docker compose -f docker-compose.prod.yml ps

# Verificar si el backend está respondiendo
echo -e "${YELLOW}Verificando que el backend esté respondiendo...${NC}"
BACKEND_READY=false
RETRY_COUNT=0
MAX_RETRIES=10

while [ $BACKEND_READY = false ] && [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s "http://localhost:8000/api/v1/health" | grep -q "healthy"; then
        BACKEND_READY=true
        echo -e "${GREEN}Backend está respondiendo correctamente.${NC}"
    else
        RETRY_COUNT=$((RETRY_COUNT+1))
        echo -e "${YELLOW}Esperando a que el backend esté listo (intento $RETRY_COUNT de $MAX_RETRIES)...${NC}"
        sleep 10
    fi
done

if [ $BACKEND_READY = false ]; then
    echo -e "${RED}¡Advertencia! El backend no parece estar respondiendo.${NC}"
    echo -e "${YELLOW}El despliegue continuará, pero podría haber problemas.${NC}"
fi

# Si tenemos certificados, copiarlos al contenedor de Nginx
if [ "$USE_SSL" = true ]; then
    echo -e "${YELLOW}Copiando certificados SSL al contenedor de Nginx...${NC}"
    
    # Obtener el nombre del contenedor de Nginx
    NGINX_CONTAINER=$(docker compose -f docker-compose.prod.yml ps -q nginx)
    
    if [ -n "$NGINX_CONTAINER" ]; then
        # Crear directorio SSL si no existe en el contenedor
        docker exec $NGINX_CONTAINER mkdir -p /etc/nginx/ssl
        
        # Copiar certificados
        docker cp nginx/ssl/fullchain.pem $NGINX_CONTAINER:/etc/nginx/ssl/
        docker cp nginx/ssl/privkey.pem $NGINX_CONTAINER:/etc/nginx/ssl/
        
        # Reiniciar Nginx para aplicar certificados
        echo -e "${YELLOW}Reiniciando Nginx para aplicar certificados...${NC}"
        docker exec $NGINX_CONTAINER nginx -s reload
        
        echo -e "${GREEN}Certificados SSL aplicados correctamente.${NC}"
    else
        echo -e "${RED}No se pudo encontrar el contenedor de Nginx.${NC}"
    fi
fi

echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}  DESPLIEGUE COMPLETADO CON ÉXITO  ${NC}"
echo -e "${GREEN}====================================${NC}"
echo -e "${YELLOW}MediaLab debería estar accesible en http://medialab.eklista.com${NC}"

if [ "$USE_SSL" = true ]; then
    echo -e "${YELLOW}También disponible en https://medialab.eklista.com${NC}"
fi

echo -e "${YELLOW}Aplicación:${NC}"
echo -e "${YELLOW}- Panel admin: http://medialab.eklista.com/ml-admin/login${NC}"
echo -e "${YELLOW}- Dashboard: http://medialab.eklista.com/dashboard${NC}"
echo -e "${YELLOW}- Portal: http://medialab.eklista.com/portal${NC}"

echo -e "${YELLOW}Para ver logs: docker compose -f docker-compose.prod.yml logs -f${NC}"

# Limpiar imágenes antiguas (opcional)
echo -e "${YELLOW}¿Desea limpiar imágenes antiguas no utilizadas? (s/n)${NC}"
read clean_images
if [[ "$clean_images" == "s" || "$clean_images" == "S" ]]; then
    echo -e "${YELLOW}Limpiando imágenes antiguas...${NC}"
    docker image prune -f
    echo -e "${GREEN}Limpieza completada.${NC}"
fi