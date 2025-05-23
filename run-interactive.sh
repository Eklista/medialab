#!/bin/bash
# run-interactive.sh - Script para ejecutar la configuración interactiva (versión unificada)

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Función para imprimir headers
print_header() {
    local message="$1"
    echo -e "${BLUE}====================================${NC}"
    echo -e "${BLUE}    $message${NC}"
    echo -e "${BLUE}====================================${NC}"
}

# Función para solicitar confirmación
ask_confirmation() {
    local prompt="$1"
    local response=""
    
    while true; do
        echo -e "${YELLOW}$prompt (s/n)${NC}"
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

print_header "MEDIALAB - CONFIGURACIÓN INTERACTIVA"

echo -e "${YELLOW}Este script ejecutará el contenedor backend en modo interactivo${NC}"
echo -e "${YELLOW}para configurar un administrador personalizado y otros datos.${NC}"
echo

# Verificar si docker-compose.yml existe
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: docker-compose.yml no encontrado${NC}"
    exit 1
fi

# Determinar archivo de entorno
ENV_FILE=".env.dev"
if [ -f ".env.dev" ]; then
    ENV_FILE=".env.dev"
    echo -e "${YELLOW}Usando archivo de entorno: .env.dev${NC}"
elif [ -f ".env" ]; then
    ENV_FILE=".env"
    echo -e "${YELLOW}Usando archivo de entorno: .env${NC}"
else
    echo -e "${YELLOW}Creando archivo .env.dev básico...${NC}"
    cat > .env.dev << EOF
ENVIRONMENT=development
COMPOSE_PROFILES=dev
BACKEND_VOLUME_SOURCE=./backend
VITE_API_URL=http://localhost:8000/api/v1
VITE_FRONTEND_URL=http://localhost:5173
EOF
    ENV_FILE=".env.dev"
fi

# Configurar variables para desarrollo/configuración interactiva
export ENVIRONMENT="development"
export COMPOSE_PROFILES="dev"

# ===== CONFIGURACIÓN DE SEGURIDAD =====
print_header "CONFIGURACIÓN DE SEGURIDAD"

# Verificar si existen archivos .env
BACKEND_ENV="backend/.env"

echo -e "${YELLOW}Verificando archivos de configuración...${NC}"

# Verificar si necesita configuración de seguridad
NEEDS_SECURITY_SETUP=false

if [ ! -f "$BACKEND_ENV" ]; then
    echo -e "${YELLOW}No se encontró $BACKEND_ENV${NC}"
    NEEDS_SECURITY_SETUP=true
elif ! grep -q "SECRET_KEY=" "$BACKEND_ENV" || grep -q "SECRET_KEY=your-secret-key" "$BACKEND_ENV" || grep -q "SECRET_KEY=$" "$BACKEND_ENV"; then
    NEEDS_SECURITY_SETUP=true
    echo -e "${YELLOW}SECRET_KEY no configurada en $BACKEND_ENV${NC}"
fi

if [ "$NEEDS_SECURITY_SETUP" = true ] || ask_confirmation "¿Ejecutar configuración de seguridad (generar claves)?"; then
    echo -e "${PURPLE}Ejecutando configuración de seguridad...${NC}"
    
    if [ -f "backend/scripts/setup_security.py" ]; then
        cd backend && python scripts/setup_security.py && cd ..
        echo -e "${GREEN}✓ Configuración de seguridad completada${NC}"
    elif [ -f "scripts/setup_security.py" ]; then
        python scripts/setup_security.py
        echo -e "${GREEN}✓ Configuración de seguridad completada${NC}"
    else
        echo -e "${RED}⚠️  Script setup_security.py no encontrado${NC}"
        echo -e "${YELLOW}Continuando sin configuración de seguridad...${NC}"
    fi
    
    echo -e "\n${YELLOW}📋 IMPORTANTE: Si se generó un archivo security_keys_backup_*.txt:${NC}"
    echo -e "${YELLOW}   1. Guárdalo en un lugar seguro${NC}"
    echo -e "${YELLOW}   2. Elimínalo del directorio del proyecto después${NC}"
    echo -e "${YELLOW}   3. NO lo subas a Git${NC}"
    echo
fi

# ===== CONFIGURACIÓN DE BASE DE DATOS =====
print_header "CONFIGURACIÓN DE BASE DE DATOS"

# Verificar si el contenedor de la base de datos está en ejecución
echo -e "${YELLOW}Verificando estado de la base de datos...${NC}"

if ! docker ps | grep -q "db\|mysql"; then
    echo -e "${YELLOW}No se detectó el contenedor de base de datos en ejecución.${NC}"
    echo -e "${YELLOW}Iniciando la base de datos...${NC}"
    
    # Usar docker-compose para iniciar solo la base de datos
    COMPOSE_PROFILES="$COMPOSE_PROFILES" docker-compose --env-file="$ENV_FILE" up -d db
    
    # Esperar a que la base de datos esté lista
    echo -e "${YELLOW}Esperando a que la base de datos esté lista...${NC}"
    sleep 20
    
    # Verificar que la base de datos esté respondiendo
    DB_READY=false
    RETRY_COUNT=0
    MAX_RETRIES=5
    
    while [ $DB_READY = false ] && [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if COMPOSE_PROFILES="$COMPOSE_PROFILES" docker-compose --env-file="$ENV_FILE" exec -T db mysqladmin ping -h localhost --silent 2>/dev/null; then
            DB_READY=true
            echo -e "${GREEN}✓ Base de datos está lista.${NC}"
        else
            RETRY_COUNT=$((RETRY_COUNT+1))
            echo -e "${YELLOW}Esperando a que la base de datos esté lista (intento $RETRY_COUNT de $MAX_RETRIES)...${NC}"
            sleep 10
        fi
    done
    
    if [ $DB_READY = false ]; then
        echo -e "${RED}¡Error! La base de datos no está respondiendo.${NC}"
        echo -e "${YELLOW}Mostrando logs de la base de datos:${NC}"
        COMPOSE_PROFILES="$COMPOSE_PROFILES" docker-compose --env-file="$ENV_FILE" logs db
        exit 1
    fi
else
    echo -e "${GREEN}✓ Base de datos ya está en ejecución.${NC}"
fi

# ===== CONFIGURACIÓN DE INICIALIZACIÓN =====
print_header "CONFIGURACIÓN DE INICIALIZACIÓN"

# Detener el backend si está en ejecución
if docker ps | grep -q "backend\|medialab.*backend"; then
    echo -e "${YELLOW}Deteniendo contenedor backend existente...${NC}"
    COMPOSE_PROFILES="$COMPOSE_PROFILES" docker-compose --env-file="$ENV_FILE" stop backend || true
fi

# Eliminar flags de inicialización previos si existen
echo -e "${YELLOW}¿Quieres borrar las marcas de inicialización previas?${NC}"
echo -e "${YELLOW}(Útil si hubo errores o quieres reinicializar todo)${NC}"
if ask_confirmation "¿Borrar marcas de inicialización?"; then
    echo -e "${YELLOW}Eliminando marcas de inicialización...${NC}"
    
    # Buscar el nombre correcto del volumen de datos del backend
    PROJECT_NAME=$(basename $(pwd))
    POSSIBLE_VOLUMES=(
        "${PROJECT_NAME}_backend_data"
        "${PROJECT_NAME}-backend-data"
        "backend_data"
        "medialab_backend_data"
        "medialab-backend-data"
    )
    
    for volume in "${POSSIBLE_VOLUMES[@]}"; do
        if docker volume ls | grep -q "$volume"; then
            echo -e "${YELLOW}Limpiando volumen: $volume${NC}"
            docker run --rm -v "$volume:/data" alpine sh -c "rm -f /data/.base_structure_initialized /data/.department_data_initialized /data/.service_data_initialized /data/.permissions_initialized /data/.email_templates_initialized /data/.interactive_admin_initialized" 2>/dev/null || true
            break
        fi
    done
    
    echo -e "${GREEN}✓ Marcas de inicialización eliminadas.${NC}"
fi

# Seleccionar qué inicializar
echo -e "\n${YELLOW}Selecciona qué datos inicializar:${NC}"
echo -e "${BLUE}1.${NC} Todo (estructura base + permisos + departamentos + servicios + plantillas de correo + administrador interactivo)"
echo -e "${BLUE}2.${NC} Solo estructura base, permisos, departamentos, servicios y plantillas de correo"
echo -e "${BLUE}3.${NC} Solo estructura base, permisos, servicios, plantillas de correo y administrador interactivo"
echo -e "${BLUE}4.${NC} Solo estructura base, permisos, departamentos y plantillas de correo"
echo -e "${BLUE}5.${NC} Solo estructura base, permisos, plantillas de correo y administrador interactivo"
echo -e "${BLUE}6.${NC} Solo estructura base, permisos, servicios y plantillas de correo"
echo -e "${BLUE}7.${NC} Solo permisos (si ya existe estructura base)"
echo -e "${BLUE}8.${NC} Solo administrador interactivo (si ya existe estructura base)"
echo -e "${BLUE}9.${NC} Solo administrador interactivo y permisos (si ya existe estructura base)"
echo -e "${BLUE}10.${NC} Solo plantillas de correo (si ya existe estructura base)"
echo -e "${BLUE}11.${NC} Solo configuración de seguridad (claves y configuración)"
echo
read -p "Opción (1-11): " init_option

# Configurar variables según la opción seleccionada
case $init_option in
    1)
        INIT_BASE_STRUCTURE=true
        INIT_PERMISSIONS=true
        INIT_DEPARTMENT_DATA=true
        INIT_SERVICE_DATA=true
        INIT_EMAIL_TEMPLATES=true
        INTERACTIVE_ADMIN=true
        ;;
    2)
        INIT_BASE_STRUCTURE=true
        INIT_PERMISSIONS=true
        INIT_DEPARTMENT_DATA=true
        INIT_SERVICE_DATA=true
        INIT_EMAIL_TEMPLATES=true
        INTERACTIVE_ADMIN=false
        ;;
    3)
        INIT_BASE_STRUCTURE=true
        INIT_PERMISSIONS=true
        INIT_DEPARTMENT_DATA=false
        INIT_SERVICE_DATA=true
        INIT_EMAIL_TEMPLATES=true
        INTERACTIVE_ADMIN=true
        ;;
    4)
        INIT_BASE_STRUCTURE=true
        INIT_PERMISSIONS=true
        INIT_DEPARTMENT_DATA=true
        INIT_SERVICE_DATA=false
        INIT_EMAIL_TEMPLATES=true
        INTERACTIVE_ADMIN=false
        ;;
    5)
        INIT_BASE_STRUCTURE=true
        INIT_PERMISSIONS=true
        INIT_DEPARTMENT_DATA=false
        INIT_SERVICE_DATA=false
        INIT_EMAIL_TEMPLATES=true
        INTERACTIVE_ADMIN=true
        ;;
    6)
        INIT_BASE_STRUCTURE=true
        INIT_PERMISSIONS=true
        INIT_DEPARTMENT_DATA=false
        INIT_SERVICE_DATA=true
        INIT_EMAIL_TEMPLATES=true
        INTERACTIVE_ADMIN=false
        ;;
    7)
        INIT_BASE_STRUCTURE=false
        INIT_PERMISSIONS=true
        INIT_DEPARTMENT_DATA=false
        INIT_SERVICE_DATA=false
        INIT_EMAIL_TEMPLATES=false
        INTERACTIVE_ADMIN=false
        ;;
    8)
        INIT_BASE_STRUCTURE=false
        INIT_PERMISSIONS=false
        INIT_DEPARTMENT_DATA=false
        INIT_SERVICE_DATA=false
        INIT_EMAIL_TEMPLATES=false
        INTERACTIVE_ADMIN=true
        ;;
    9)
        INIT_BASE_STRUCTURE=false
        INIT_PERMISSIONS=true
        INIT_DEPARTMENT_DATA=false
        INIT_SERVICE_DATA=false
        INIT_EMAIL_TEMPLATES=false
        INTERACTIVE_ADMIN=true
        ;;
    10)
        INIT_BASE_STRUCTURE=false
        INIT_PERMISSIONS=false
        INIT_DEPARTMENT_DATA=false
        INIT_SERVICE_DATA=false
        INIT_EMAIL_TEMPLATES=true
        INTERACTIVE_ADMIN=false
        ;;
    11)
        echo -e "${PURPLE}Ejecutando solo configuración de seguridad...${NC}"
        if [ -f "backend/scripts/setup_security.py" ]; then
            cd backend && python scripts/setup_security.py && cd ..
        elif [ -f "scripts/setup_security.py" ]; then
            python scripts/setup_security.py
        else
            echo -e "${RED}Script setup_security.py no encontrado${NC}"
            exit 1
        fi
        echo -e "${GREEN}✓ Configuración de seguridad completada${NC}"
        exit 0
        ;;
    *)
        echo -e "${YELLOW}Opción no válida. Usando configuración por defecto (todo).${NC}"
        INIT_BASE_STRUCTURE=true
        INIT_PERMISSIONS=true
        INIT_DEPARTMENT_DATA=true
        INIT_SERVICE_DATA=true
        INIT_EMAIL_TEMPLATES=true
        INTERACTIVE_ADMIN=true
        ;;
esac

# ===== CONSTRUCCIÓN Y EJECUCIÓN =====
print_header "CONSTRUCCIÓN Y EJECUCIÓN"

# Construir el contenedor backend con docker-compose
echo -e "${YELLOW}Construyendo imagen backend...${NC}"
if ! COMPOSE_PROFILES="$COMPOSE_PROFILES" docker-compose --env-file="$ENV_FILE" build backend; then
    echo -e "${RED}Error al construir la imagen del backend${NC}"
    exit 1
fi

# Iniciar backend con las variables adecuadas en modo interactivo
# Pasamos START_SERVER=false para evitar que inicie el servidor
echo -e "${PURPLE}Iniciando backend en modo interactivo...${NC}"
echo -e "${YELLOW}Configuración seleccionada:${NC}"
echo -e "  - Estructura base: $INIT_BASE_STRUCTURE"
echo -e "  - Permisos: $INIT_PERMISSIONS"
echo -e "  - Departamentos: $INIT_DEPARTMENT_DATA"
echo -e "  - Servicios: $INIT_SERVICE_DATA"
echo -e "  - Plantillas email: $INIT_EMAIL_TEMPLATES"
echo -e "  - Admin interactivo: $INTERACTIVE_ADMIN"
echo

COMPOSE_PROFILES="$COMPOSE_PROFILES" docker-compose --env-file="$ENV_FILE" run --rm \
    -e INIT_BASE_STRUCTURE=$INIT_BASE_STRUCTURE \
    -e INIT_PERMISSIONS=$INIT_PERMISSIONS \
    -e INIT_DEPARTMENT_DATA=$INIT_DEPARTMENT_DATA \
    -e INIT_SERVICE_DATA=$INIT_SERVICE_DATA \
    -e INIT_EMAIL_TEMPLATES=$INIT_EMAIL_TEMPLATES \
    -e INTERACTIVE_ADMIN=$INTERACTIVE_ADMIN \
    -e START_SERVER=false \
    backend

# ===== FINALIZACIÓN =====
print_header "CONFIGURACIÓN COMPLETADA"

echo -e "${GREEN}✓ Configuración interactiva completada exitosamente.${NC}"
echo
echo -e "${YELLOW}📋 Próximos pasos:${NC}"
echo -e "${YELLOW}1. Para continuar con el funcionamiento normal en desarrollo:${NC}"
echo -e "   ${BLUE}COMPOSE_PROFILES=dev docker-compose --env-file=$ENV_FILE up -d${NC}"
echo
echo -e "${YELLOW}2. Para verificar que todo funciona:${NC}"
echo -e "   ${BLUE}COMPOSE_PROFILES=dev docker-compose --env-file=$ENV_FILE ps${NC}"
echo -e "   ${BLUE}COMPOSE_PROFILES=dev docker-compose --env-file=$ENV_FILE logs -f backend${NC}"
echo
echo -e "${YELLOW}3. Para acceder a la aplicación en desarrollo:${NC}"
echo -e "   ${BLUE}- Frontend: http://localhost:5173${NC}"
echo -e "   ${BLUE}- API: http://localhost:8000/api/v1${NC}"
echo -e "   ${BLUE}- Docs: http://localhost:8000/api/v1/docs${NC}"
echo
echo -e "${YELLOW}4. Para cambiar a producción:${NC}"
echo -e "   ${BLUE}COMPOSE_PROFILES=prod docker-compose --env-file=.env up -d${NC}"
echo
echo -e "${YELLOW}5. Para verificar seguridad (opcional):${NC}"
echo -e "   ${BLUE}./test-security.sh${NC}"

# Verificar si hay archivos de backup de claves
BACKUP_FILES=$(ls security_keys_backup_*.txt 2>/dev/null || true)
if [ ! -z "$BACKUP_FILES" ]; then
    echo
    echo -e "${RED}🔐 IMPORTANTE - ARCHIVOS DE SEGURIDAD:${NC}"
    echo -e "${YELLOW}Se encontraron archivos de backup de claves:${NC}"
    for file in $BACKUP_FILES; do
        echo -e "   ${RED}- $file${NC}"
    done
    echo -e "${YELLOW}📝 Acciones requeridas:${NC}"
    echo -e "   ${YELLOW}1. Guarda estos archivos en un lugar seguro${NC}"
    echo -e "   ${YELLOW}2. Elimínalos del directorio del proyecto:${NC}"
    echo -e "      ${BLUE}rm security_keys_backup_*.txt${NC}"
    echo -e "   ${YELLOW}3. NO los subas a Git${NC}"
fi

echo -e "\n${GREEN}🎉 ¡Configuración interactiva finalizada!${NC}"
echo -e "${GREEN}   Entorno configurado: $ENVIRONMENT${NC}"
echo -e "${GREEN}   Profiles disponibles: dev, prod, test${NC}"