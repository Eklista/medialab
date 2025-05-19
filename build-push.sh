#!/bin/bash
# Script para construir y publicar imágenes Docker de MediaLab

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Función para imprimir headers
print_header() {
  local message="$1"
  local padding=$(( (36 - ${#message}) / 2 ))
  local pad_left=$(printf "%${padding}s" "")
  local pad_right=$(printf "%${padding}s" "")
  
  echo -e "${BLUE}====================================${NC}"
  echo -e "${BLUE}${pad_left}${message}${pad_right}${NC}"
  echo -e "${BLUE}====================================${NC}"
}

# Función para imprimir mensajes de éxito
print_success() {
  local message="$1"
  local padding=$(( (36 - ${#message}) / 2 ))
  local pad_left=$(printf "%${padding}s" "")
  local pad_right=$(printf "%${padding}s" "")
  
  echo -e "${GREEN}====================================${NC}"
  echo -e "${GREEN}${pad_left}${message}${pad_right}${NC}"
  echo -e "${GREEN}====================================${NC}"
}

# Función para solicitar confirmación (s/n) con validación
ask_confirmation() {
  local prompt="$1"
  local response=""
  
  while true; do
    echo -e "${YELLOW}${prompt} (s/n)${NC}"
    read response
    response=$(echo "$response" | tr '[:upper:]' '[:lower:]')
    
    if [[ "$response" == "s" || "$response" == "n" ]]; then
      break
    else
      echo -e "${RED}Por favor, ingresa 's' para sí o 'n' para no.${NC}"
    fi
  done
  
  [[ "$response" == "s" ]]
  return $?
}

# Función para construir y etiquetar una imagen
build_and_tag() {
  local compose_file=$1
  local service=$2
  local tag=$3
  local build_args=$4
  
  echo -e "\n${YELLOW}Construyendo $service ($tag)...${NC}"
  
  if [ -z "$build_args" ]; then
    if ! docker compose -f $compose_file build $service; then
      echo -e "${RED}Error al construir $service${NC}"
      return 1
    fi
  else
    if ! docker compose -f $compose_file build --build-arg $build_args $service; then
      echo -e "${RED}Error al construir $service con argumentos: $build_args${NC}"
      return 1
    fi
  fi
  
  # Obtener el nombre de la imagen generada
  local image_name="medialab-$service"
  
  echo -e "${YELLOW}Etiquetando $image_name como eklista/medialab:$tag${NC}"
  if ! docker tag ${image_name}:latest eklista/medialab:$tag; then
    echo -e "${RED}Error al etiquetar $image_name${NC}"
    return 1
  fi
  
  echo -e "${GREEN}✓ Imagen $service:$tag construida correctamente${NC}"
  return 0
}

# Función para hacer push de una imagen
push_image() {
  local tag=$1
  echo -e "\n${YELLOW}Publicando eklista/medialab:$tag...${NC}"
  
  if ! docker push eklista/medialab:$tag; then
    echo -e "${RED}Error al publicar eklista/medialab:$tag${NC}"
    return 1
  fi
  
  echo -e "${GREEN}✓ Imagen eklista/medialab:$tag publicada correctamente${NC}"
  return 0
}

# Función para verificar si Docker está instalado y en ejecución
check_docker() {
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker no está instalado. Por favor, instálalo primero.${NC}"
    exit 1
  fi
  
  if ! docker info &> /dev/null; then
    echo -e "${RED}El servicio Docker no está en ejecución o no tienes permisos.${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✓ Docker está instalado y en ejecución${NC}"
}

# Función para verificar la existencia de archivos docker-compose
check_compose_files() {
  if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Archivo docker-compose.yml no encontrado${NC}"
    exit 1
  fi
  
  if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}Archivo docker-compose.prod.yml no encontrado${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✓ Archivos docker-compose verificados${NC}"
}

# Inicio del script
print_header "CONSTRUCCIÓN Y PUSH DE IMÁGENES"

# Verificar requisitos
check_docker
check_compose_files

# Variables para controlar qué imágenes se construyeron
build_dev_success=false
build_prod_success=false

# Construir imágenes de desarrollo
if ask_confirmation "¿Construir imágenes de desarrollo?"; then
  if build_and_tag "docker-compose.yml" "frontend" "frontend" "VITE_API_URL=http://localhost:8000/api/v1" && 
     build_and_tag "docker-compose.yml" "backend" "backend" ""; then
    echo -e "${GREEN}✓ Todas las imágenes de desarrollo construidas correctamente${NC}"
    build_dev_success=true
  else
    echo -e "${RED}✗ Hubo errores al construir algunas imágenes de desarrollo${NC}"
  fi
fi

# Construir imágenes de producción
if ask_confirmation "¿Construir imágenes de producción?"; then
  if build_and_tag "docker-compose.prod.yml" "frontend" "frontend-prod" "VITE_API_URL=/api/v1" && 
     build_and_tag "docker-compose.prod.yml" "backend" "backend-prod" "" &&
     build_and_tag "docker-compose.prod.yml" "nginx" "nginx-prod" ""; then
    echo -e "${GREEN}✓ Todas las imágenes de producción construidas correctamente${NC}"
    build_prod_success=true
  else
    echo -e "${RED}✗ Hubo errores al construir algunas imágenes de producción${NC}"
  fi
fi

# Hacer push de las imágenes
if ($build_dev_success || $build_prod_success) && ask_confirmation "¿Hacer push de las imágenes a Docker Hub?"; then
  # Iniciar sesión en Docker Hub
  echo -e "${YELLOW}Iniciando sesión en Docker Hub...${NC}"
  if ! docker login; then
    echo -e "${RED}Error al iniciar sesión en Docker Hub${NC}"
    exit 1
  fi
  
  # Push de imágenes de desarrollo si se construyeron
  if $build_dev_success; then
    if push_image "frontend" && push_image "backend"; then
      echo -e "${GREEN}✓ Todas las imágenes de desarrollo publicadas correctamente${NC}"
    else
      echo -e "${RED}✗ Hubo errores al publicar algunas imágenes de desarrollo${NC}"
    fi
  fi
  
  # Push de imágenes de producción si se construyeron
  if $build_prod_success; then
    if push_image "frontend-prod" && push_image "backend-prod" && push_image "nginx-prod"; then
      echo -e "${GREEN}✓ Todas las imágenes de producción publicadas correctamente${NC}"
    else
      echo -e "${RED}✗ Hubo errores al publicar algunas imágenes de producción${NC}"
    fi
  fi
  
  echo -e "${GREEN}Proceso de publicación completado${NC}"
fi

print_success "PROCESO COMPLETADO"