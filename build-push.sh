#!/bin/bash
# Script para construir y publicar imágenes Docker de MediaLab (versión unificada)

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
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
  local timeout="${2:-30}"
  local response=""
  
  while true; do
    echo -e "${YELLOW}${prompt} (s/n) [timeout: ${timeout}s]${NC}"
    read -t $timeout response || response="n"
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

# Función para construir y etiquetar imágenes usando profiles
build_with_profile() {
  local profile=$1
  local tag_suffix=$2
  
  echo -e "\n${YELLOW}Construyendo imágenes con profile: $profile${NC}"
  
  # Determinar archivo .env según el profile
  local env_file=""
  if [ "$profile" = "prod" ]; then
    if [ -f ".env.prod" ]; then
      env_file=".env.prod"
    elif [ -f ".env" ]; then
      env_file=".env"
    fi
    export ENVIRONMENT="production"
    export VITE_API_URL="/api/v1"
    export VITE_FRONTEND_URL="https://medialab.eklista.com"
  else
    if [ -f ".env.dev" ]; then
      env_file=".env.dev"
    elif [ -f ".env" ]; then
      env_file=".env"
    fi
    export ENVIRONMENT="development"
    export VITE_API_URL="http://localhost:8000/api/v1"
    export VITE_FRONTEND_URL="http://localhost:5173"
  fi
  
  export COMPOSE_PROFILES="$profile"
  
  # Preparar comando docker-compose
  local compose_cmd="COMPOSE_PROFILES=$profile docker-compose"
  if [ -n "$env_file" ]; then
    compose_cmd="$compose_cmd --env-file=$env_file"
    echo -e "${GREEN}Usando archivo de entorno: $env_file${NC}"
  else
    echo -e "${YELLOW}No se encontró archivo .env específico, usando variables de entorno del sistema${NC}"
  fi
  
  # Construir servicios del profile
  compose_cmd="$compose_cmd build"
  echo -e "${BLUE}Ejecutando: $compose_cmd${NC}"
  
  if ! eval "$compose_cmd"; then
    echo -e "${RED}Error al construir imágenes con profile: $profile${NC}"
    return 1
  fi
  
  # Obtener nombres de las imágenes construidas
  local project_name=$(basename $(pwd))
  local images_built=()
  local tags=()
  
  # Buscar imágenes que corresponden a este profile
  case $profile in
    "dev")
      images_built=("${project_name}_frontend-dev" "${project_name}_backend")
      tags=("frontend-dev$tag_suffix" "backend$tag_suffix")
      ;;
    "dev-hot")
      images_built=("${project_name}_frontend-dev" "${project_name}_backend-dev")
      tags=("frontend-dev$tag_suffix" "backend-dev$tag_suffix")
      ;;
    "prod")
      # Para prod, nginx no se construye, es una imagen base
      images_built=("${project_name}_frontend-prod" "${project_name}_backend")
      tags=("frontend-prod$tag_suffix" "backend-prod$tag_suffix")
      ;;
    "test")
      images_built=("${project_name}_frontend-test" "${project_name}_backend")
      tags=("frontend-test$tag_suffix" "backend-test$tag_suffix")
      ;;
  esac
  
  # Etiquetar imágenes
  local success_count=0
  for i in "${!images_built[@]}"; do
    local image_name="${images_built[$i]}"
    local tag="${tags[$i]}"
    
    # Buscar la imagen (probando múltiples variantes de nombres)
    local actual_image=""
    local search_variants=(
      "${image_name}:latest"
      "${image_name//_/-}:latest"
      "${image_name//-/_}:latest"
    )
    
    for variant in "${search_variants[@]}"; do
      local repo_name=$(echo "$variant" | cut -d':' -f1)
      if docker images --format "{{.Repository}}" | grep -q "^${repo_name}$"; then
        actual_image="$variant"
        echo -e "${BLUE}Encontrada imagen: $actual_image${NC}"
        break
      fi
    done
    
    if [ -n "$actual_image" ]; then
      echo -e "${YELLOW}Etiquetando $actual_image como eklista/medialab:$tag${NC}"
      if docker tag "$actual_image" "eklista/medialab:$tag"; then
        echo -e "${GREEN}✓ Imagen $tag etiquetada correctamente${NC}"
        ((success_count++))
      else
        echo -e "${RED}Error al etiquetar $actual_image${NC}"
      fi
    else
      echo -e "${RED}No se encontró imagen: $image_name${NC}"
      echo -e "${YELLOW}Imágenes disponibles:${NC}"
      docker images | grep -E "$project_name|medialab" | head -5
    fi
  done
  
  if [ $success_count -gt 0 ]; then
    echo -e "${GREEN}✓ Profile $profile: $success_count imágenes construidas correctamente${NC}"
    return 0
  else
    echo -e "${RED}✗ Profile $profile: No se construyeron imágenes correctamente${NC}"
    return 1
  fi
}

# Función para hacer push de imágenes
push_images() {
  local pattern="$1"
  echo -e "\n${YELLOW}Publicando imágenes que coinciden con: $pattern${NC}"
  
  local pushed_count=0
  local images=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "eklista/medialab" | grep "$pattern")
  
  for image in $images; do
    echo -e "${YELLOW}Publicando $image...${NC}"
    if docker push "$image"; then
      echo -e "${GREEN}✓ $image publicada correctamente${NC}"
      ((pushed_count++))
    else
      echo -e "${RED}✗ Error al publicar $image${NC}"
    fi
  done
  
  echo -e "${GREEN}✓ $pushed_count imágenes publicadas${NC}"
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
  
  echo -e "${GREEN}✓ Archivo docker-compose.yml verificado${NC}"
}

# Función para verificar directorios necesarios
check_directories() {
  local required_dirs=("frontend" "backend")
  
  for dir in "${required_dirs[@]}"; do
    if [ ! -d "$dir" ]; then
      echo -e "${RED}Directorio $dir/ no encontrado${NC}"
      exit 1
    fi
  done
  
  # Nginx es opcional, solo verificar si existe el profile prod
  if docker-compose config --profiles 2>/dev/null | grep -q "prod" && [ ! -d "nginx" ]; then
    echo -e "${YELLOW}⚠️  Directorio nginx/ no encontrado - requerido para profile prod${NC}"
  fi
  
  echo -e "${GREEN}✓ Directorios verificados${NC}"
}

# Función para verificar configuración de seguridad antes del build
check_security_config() {
  echo -e "${PURPLE}Verificando configuración de seguridad...${NC}"
  
  # Verificar archivo .env de backend
  if [ -f "backend/.env" ]; then
    if grep -q "SECRET_KEY=your-secret-key\|SECRET_KEY=$\|SECRET_KEY=\"\"" backend/.env 2>/dev/null; then
      echo -e "${YELLOW}⚠️  Configuración de seguridad necesita actualizarse${NC}"
      if ask_confirmation "¿Ejecutar configuración de seguridad antes del build?" 15; then
        if [ -f "backend/scripts/setup_security.py" ]; then
          echo -e "${PURPLE}Ejecutando configuración de seguridad...${NC}"
          cd backend && python scripts/setup_security.py && cd ..
          echo -e "${GREEN}✓ Configuración de seguridad completada${NC}"
        elif [ -f "scripts/setup_security.py" ]; then
          python scripts/setup_security.py
          echo -e "${GREEN}✓ Configuración de seguridad completada${NC}"
        else
          echo -e "${YELLOW}Script de seguridad no encontrado${NC}"
        fi
      fi
    else
      echo -e "${GREEN}✓ Configuración de seguridad verificada${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️  Archivo backend/.env no encontrado - las imágenes usarán valores por defecto${NC}"
    echo -e "${YELLOW}Archivos .env disponibles:${NC}"
    ls -la .env* 2>/dev/null | while read line; do echo -e "${BLUE}    $line${NC}"; done || echo -e "${YELLOW}    Ningún archivo .env encontrado${NC}"
  fi
}

# Inicio del script
print_header "CONSTRUCCIÓN Y PUSH DE IMÁGENES"

# Verificar requisitos
check_docker
check_compose_files
check_directories
check_security_config

# Mostrar profiles disponibles y archivos .env
echo -e "${YELLOW}Archivos de entorno disponibles:${NC}"
ls -la .env* 2>/dev/null | while read line; do echo -e "${BLUE}  $line${NC}"; done || echo -e "${YELLOW}  Ningún archivo .env encontrado${NC}"

echo -e "\n${YELLOW}Profiles disponibles en docker-compose.yml:${NC}"
AVAILABLE_PROFILES=$(docker-compose config --profiles 2>/dev/null | sort | uniq)
for profile in $AVAILABLE_PROFILES; do
    echo -e "${BLUE}  - $profile${NC}"
done

# Variables para controlar qué imágenes se construyeron
build_dev_success=false
build_prod_success=false
build_test_success=false

# Limpiar recursos antes del build
if ask_confirmation "¿Limpiar imágenes y recursos no utilizados antes del build?" 10; then
  echo -e "${YELLOW}Limpiando recursos Docker...${NC}"
  docker system prune -f
  echo -e "${GREEN}✓ Limpieza completada${NC}"
fi

# Construir imágenes de desarrollo
if echo "$AVAILABLE_PROFILES" | grep -q "dev" && ask_confirmation "¿Construir imágenes de desarrollo (profile: dev)?" 15; then
  if build_with_profile "dev" ""; then
    build_dev_success=true
  fi
fi

# Construir imágenes de producción
if echo "$AVAILABLE_PROFILES" | grep -q "prod" && ask_confirmation "¿Construir imágenes de producción (profile: prod)?" 15; then
  if build_with_profile "prod" ""; then
    build_prod_success=true
  fi
fi

# Construir imágenes de testing
if echo "$AVAILABLE_PROFILES" | grep -q "test" && ask_confirmation "¿Construir imágenes de testing (profile: test)?" 15; then
  if build_with_profile "test" ""; then
    build_test_success=true
  fi
fi

# Mostrar imágenes construidas
echo -e "\n${YELLOW}📦 Imágenes construidas:${NC}"
docker images | grep "eklista/medialab" | head -10

# Hacer push de las imágenes
if ($build_dev_success || $build_prod_success || $build_test_success) && ask_confirmation "¿Hacer push de las imágenes a Docker Hub?" 15; then
  # Iniciar sesión en Docker Hub
  echo -e "${YELLOW}Iniciando sesión en Docker Hub...${NC}"
  if ! docker login; then
    echo -e "${RED}Error al iniciar sesión en Docker Hub${NC}"
    exit 1
  fi
  
  # Push de imágenes según lo que se construyó
  if $build_dev_success; then
    push_images "dev\|backend[^-]"
  fi
  
  if $build_prod_success; then
    push_images "prod"
  fi
  
  if $build_test_success; then
    push_images "test"
  fi
  
  echo -e "${GREEN}Proceso de publicación completado${NC}"
  
  # Mostrar imágenes publicadas
  echo -e "\n${YELLOW}📦 Imágenes disponibles en Docker Hub:${NC}"
  docker images | grep "eklista/medialab" | awk '{print "   - " $1 ":" $2}'
fi

# Limpiar archivos de backup de seguridad si existen
if ls security_keys_backup_*.txt &>/dev/null; then
  echo -e "\n${RED}🔐 IMPORTANTE: Archivos de backup de claves encontrados${NC}"
  echo -e "${YELLOW}Se recomienda moverlos a un lugar seguro y eliminarlos del proyecto${NC}"
  if ask_confirmation "¿Eliminar archivos de backup de claves del directorio actual?" 10; then
    rm -f security_keys_backup_*.txt
    echo -e "${GREEN}✓ Archivos de backup eliminados${NC}"
  fi
fi

print_success "PROCESO COMPLETADO"

echo -e "\n${YELLOW}📋 Próximos pasos:${NC}"
echo -e "${YELLOW}   1. Para desplegar en VPS: ./deploy.sh${NC}"
echo -e "${YELLOW}   2. Para desarrollo local: COMPOSE_PROFILES=dev docker-compose up -d${NC}"
echo -e "${YELLOW}   3. Para producción local: COMPOSE_PROFILES=prod docker-compose up -d${NC}"
echo -e "${YELLOW}   4. Para verificar imágenes: docker images | grep eklista/medialab${NC}"

echo -e "\n${YELLOW}🔧 Comandos útiles por entorno:${NC}"
echo -e "${YELLOW}   Desarrollo:${NC}"
echo -e "${BLUE}     COMPOSE_PROFILES=dev docker-compose up -d${NC}"
echo -e "${BLUE}     COMPOSE_PROFILES=dev docker-compose logs -f${NC}"
echo -e "${YELLOW}   Producción:${NC}"
echo -e "${BLUE}     COMPOSE_PROFILES=prod docker-compose up -d${NC}"
echo -e "${BLUE}     COMPOSE_PROFILES=prod docker-compose logs -f${NC}"
echo -e "${YELLOW}   Testing:${NC}"
echo -e "${BLUE}     COMPOSE_PROFILES=test docker-compose up -d${NC}"
echo -e "${BLUE}     COMPOSE_PROFILES=test docker-compose logs -f${NC}"