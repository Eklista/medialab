#!/bin/bash
# Script para construir y publicar imágenes Docker de MediaLab

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}  CONSTRUCCIÓN Y PUSH DE IMÁGENES  ${NC}"
echo -e "${BLUE}====================================${NC}"

# Función para construir y etiquetar una imagen
build_and_tag() {
    local compose_file=$1
    local service=$2
    local tag=$3
    local build_args=$4
    
    echo -e "${YELLOW}Construyendo $service ($tag)...${NC}"
    
    if [ -z "$build_args" ]; then
        docker compose -f $compose_file build $service
    else
        docker compose -f $compose_file build --build-arg $build_args $service
    fi
    
    # Obtener el nombre de la imagen generada
    local image_name="medialab-$service"
    
    echo -e "${YELLOW}Etiquetando $image_name como eklista/medialab:$tag${NC}"
    docker tag ${image_name}:latest eklista/medialab:$tag
}

# Función para hacer push de una imagen
push_image() {
    local tag=$1
    echo -e "${YELLOW}Publicando eklista/medialab:$tag...${NC}"
    docker push eklista/medialab:$tag
}

# Preguntar si se quiere construir imágenes de desarrollo
echo -e "${YELLOW}¿Construir imágenes de desarrollo? (s/n)${NC}"
read build_dev
if [[ "$build_dev" == "s" || "$build_dev" == "S" ]]; then
    # Construir imágenes de desarrollo
    build_and_tag "docker-compose.yml" "frontend" "frontend" "VITE_API_URL=http://localhost:8000/api/v1"
    build_and_tag "docker-compose.yml" "portal-frontend" "portal-frontend" "VITE_API_URL=http://localhost:8000/api/v1"
    build_and_tag "docker-compose.yml" "backend" "backend" ""
    
    echo -e "${GREEN}Imágenes de desarrollo construidas correctamente${NC}"
fi

# Preguntar si se quiere construir imágenes de producción
echo -e "${YELLOW}¿Construir imágenes de producción? (s/n)${NC}"
read build_prod
if [[ "$build_prod" == "s" || "$build_prod" == "S" ]]; then
    # Construir imágenes de producción
    build_and_tag "docker-compose.prod.yml" "frontend" "frontend-prod" "VITE_API_URL=/api/v1"
    build_and_tag "docker-compose.prod.yml" "portal-frontend" "portal-frontend-prod" "VITE_API_URL=/api/v1"
    build_and_tag "docker-compose.prod.yml" "backend" "backend-prod" ""
    build_and_tag "docker-compose.prod.yml" "nginx" "nginx-prod" ""
    
    echo -e "${GREEN}Imágenes de producción construidas correctamente${NC}"
fi

# Preguntar si se quiere hacer push de las imágenes
echo -e "${YELLOW}¿Hacer push de las imágenes a Docker Hub? (s/n)${NC}"
read do_push
if [[ "$do_push" == "s" || "$do_push" == "S" ]]; then
    # Iniciar sesión en Docker Hub
    echo -e "${YELLOW}Iniciando sesión en Docker Hub...${NC}"
    docker login
    
    # Push de imágenes de desarrollo si se construyeron
    if [[ "$build_dev" == "s" || "$build_dev" == "S" ]]; then
        push_image "frontend"
        push_image "portal-frontend"
        push_image "backend"
    fi
    
    # Push de imágenes de producción si se construyeron
    if [[ "$build_prod" == "s" || "$build_prod" == "S" ]]; then
        push_image "frontend-prod"
        push_image "portal-frontend-prod"
        push_image "backend-prod"
        push_image "nginx-prod"
    fi
    
    echo -e "${GREEN}Todas las imágenes seleccionadas han sido publicadas${NC}"
fi

echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}   PROCESO COMPLETADO CON ÉXITO    ${NC}"
echo -e "${GREEN}====================================${NC}"