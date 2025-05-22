#!/bin/bash
# deploy.sh - Script mejorado para despliegue de MediaLab (versión corregida)

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

# Verificar si docker-compose.prod.yml existe
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}Error: docker-compose.prod.yml no encontrado${NC}"
    exit 1
fi

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

# Limpiar volúmenes huérfanos (opcional pero recomendado)
echo -e "${YELLOW}Limpiando recursos no utilizados...${NC}"
docker system prune -f || true

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

# Verificar que la base de datos esté lista
echo -e "${YELLOW}Verificando que la base de datos esté lista...${NC}"
DB_READY=false
RETRY_COUNT=0
MAX_RETRIES=10

while [ $DB_READY = false ] && [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker compose -f docker-compose.prod.yml exec -T db mysqladmin ping -h localhost --silent; then
        DB_READY=true
        echo -e "${GREEN}Base de datos está lista.${NC}"
    else
        RETRY_COUNT=$((RETRY_COUNT+1))
        echo -e "${YELLOW}Esperando a que la base de datos esté lista (intento $RETRY_COUNT de $MAX_RETRIES)...${NC}"
        sleep 10
    fi
done

if [ $DB_READY = false ]; then
    echo -e "${RED}¡Error! La base de datos no está respondiendo.${NC}"
    echo -e "${YELLOW}Mostrando logs de la base de datos:${NC}"
    docker compose -f docker-compose.prod.yml logs db
    exit 1
fi

# Verificar que nginx esté respondiendo
echo -e "${YELLOW}Verificando que nginx esté respondiendo...${NC}"
NGINX_READY=false
RETRY_COUNT=0
MAX_RETRIES=10

while [ $NGINX_READY = false ] && [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    # Intentar conectar a través de nginx (puerto 80)
    if curl -s -f "http://localhost/" > /dev/null 2>&1; then
        NGINX_READY=true
        echo -e "${GREEN}Nginx está respondiendo correctamente.${NC}"
    else
        RETRY_COUNT=$((RETRY_COUNT+1))
        echo -e "${YELLOW}Esperando a que nginx esté listo (intento $RETRY_COUNT de $MAX_RETRIES)...${NC}"
        sleep 10
    fi
done

if [ $NGINX_READY = false ]; then
    echo -e "${RED}¡Advertencia! Nginx no parece estar respondiendo en el puerto 80.${NC}"
    echo -e "${YELLOW}Mostrando logs de nginx:${NC}"
    docker compose -f docker-compose.prod.yml logs nginx
    echo -e "${YELLOW}El despliegue continuará, pero podría haber problemas.${NC}"
fi

# Verificar el API a través de nginx si está disponible
if [ $NGINX_READY = true ]; then
    echo -e "${YELLOW}Verificando que el API esté accesible a través de nginx...${NC}"
    if curl -s "http://localhost/api/v1/" > /dev/null 2>&1; then
        echo -e "${GREEN}API está accesible a través de nginx.${NC}"
    else
        echo -e "${YELLOW}API no está respondiendo, pero nginx sí. Esto es normal si el backend está iniciando.${NC}"
    fi
fi

# Verificar SSL si está habilitado
if [ "$USE_SSL" = true ] && [ $NGINX_READY = true ]; then
    echo -e "${YELLOW}Verificando configuración SSL...${NC}"
    if curl -s -k "https://localhost/" > /dev/null 2>&1; then
        echo -e "${GREEN}SSL está funcionando correctamente.${NC}"
    else
        echo -e "${YELLOW}SSL no está respondiendo. Verifica la configuración de nginx.${NC}"
    fi
fi

# Mostrar logs recientes para verificar que todo esté funcionando
echo -e "${YELLOW}Mostrando logs recientes de los servicios...${NC}"
docker compose -f docker-compose.prod.yml logs --tail=20

echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}  DESPLIEGUE COMPLETADO CON ÉXITO  ${NC}"
echo -e "${GREEN}====================================${NC}"

# Determinar la URL base
if [ "$USE_SSL" = true ]; then
    BASE_URL="https://medialab.eklista.com"
    echo -e "${YELLOW}MediaLab está accesible en: ${BASE_URL}${NC}"
    echo -e "${YELLOW}También disponible en: http://medialab.eklista.com (redirige a HTTPS)${NC}"
else
    BASE_URL="http://medialab.eklista.com"
    echo -e "${YELLOW}MediaLab está accesible en: ${BASE_URL}${NC}"
fi

echo -e "${YELLOW}Rutas de la aplicación:${NC}"
echo -e "${YELLOW}- Panel admin: ${BASE_URL}/ml-admin/login${NC}"
echo -e "${YELLOW}- Dashboard: ${BASE_URL}/dashboard${NC}"
echo -e "${YELLOW}- Portal: ${BASE_URL}/portal${NC}"
echo -e "${YELLOW}- API: ${BASE_URL}/api/v1/${NC}"

echo -e "${YELLOW}Comandos útiles:${NC}"
echo -e "${YELLOW}- Ver logs: docker compose -f docker-compose.prod.yml logs -f${NC}"
echo -e "${YELLOW}- Ver estado: docker compose -f docker-compose.prod.yml ps${NC}"
echo -e "${YELLOW}- Reiniciar: docker compose -f docker-compose.prod.yml restart${NC}"
echo -e "${YELLOW}- Detener: docker compose -f docker-compose.prod.yml down${NC}"

# Limpiar imágenes antiguas (opcional)
echo -e "\n${YELLOW}¿Desea limpiar imágenes Docker antiguas no utilizadas? (s/n)${NC}"
read -t 10 clean_images || clean_images="n"
if [[ "$clean_images" == "s" || "$clean_images" == "S" ]]; then
    echo -e "${YELLOW}Limpiando imágenes antiguas...${NC}"
    docker image prune -f
    echo -e "${GREEN}Limpieza completada.${NC}"
else
    echo -e "${YELLOW}Saltando limpieza de imágenes.${NC}"
fi

echo -e "${GREEN}¡Despliegue finalizado!${NC}"