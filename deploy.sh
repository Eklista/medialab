#!/bin/bash
# deploy.sh - Script para despliegue de MediaLab (versión unificada)
set -e

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Función para solicitar confirmación
ask_confirmation() {
    local prompt="$1"
    local timeout="${2:-10}"
    local response=""
    
    echo -e "${YELLOW}$prompt (s/n) [timeout: ${timeout}s]${NC}"
    read -t $timeout -n 1 response || response="n"
    echo
    response=$(echo "$response" | tr '[:upper:]' '[:lower:]')
    [[ "$response" == "s" ]]
    return $?
}

echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}    DESPLIEGUE DE MEDIALAB         ${NC}"
echo -e "${BLUE}====================================${NC}"

# Verificar si docker-compose.yml existe
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: docker-compose.yml no encontrado${NC}"
    exit 1
fi

# Detectar entorno - buscar archivo .env para determinar el entorno
ENVIRONMENT="production"
ENV_FILE=".env"

# Verificar qué archivo .env usar
if [ -f ".env.prod" ]; then
    ENV_FILE=".env.prod"
    ENVIRONMENT="production"
    echo -e "${YELLOW}Usando entorno de producción (.env.prod)${NC}"
elif [ -f ".env" ]; then
    ENV_FILE=".env"
    # Determinar entorno por el contenido del archivo
    if grep -q "ENVIRONMENT=production" .env 2>/dev/null; then
        ENVIRONMENT="production"
        echo -e "${YELLOW}Usando entorno de producción (.env)${NC}"
    elif grep -q "ENVIRONMENT=development" .env 2>/dev/null; then
        ENVIRONMENT="development"
        echo -e "${YELLOW}Detectado entorno de desarrollo - cambiando a producción${NC}"
    else
        echo -e "${YELLOW}Asumiendo entorno de producción${NC}"
    fi
else
    echo -e "${RED}No se encontró archivo .env - creando configuración básica${NC}"
    cat > .env << EOF
ENVIRONMENT=production
COMPOSE_PROFILES=prod
EOF
fi

# Configurar variables de entorno para producción
export ENVIRONMENT="production"
export COMPOSE_PROFILES="prod"

echo -e "${GREEN}✓ Configurando despliegue para: ${ENVIRONMENT}${NC}"
echo -e "${GREEN}✓ Profiles activos: ${COMPOSE_PROFILES}${NC}"

# Verificar si los directorios necesarios existen
echo -e "${YELLOW}Verificando estructura de directorios...${NC}"
mkdir -p nginx/ssl
mkdir -p ssl  # Por si usa el volumen ./ssl

# Verificar si hay certificados SSL
echo -e "${YELLOW}Verificando certificados SSL...${NC}"
SSL_ENABLED=false
if [ -f "nginx/ssl/fullchain.pem" ] && [ -f "nginx/ssl/privkey.pem" ]; then
    echo -e "${GREEN}✓ Certificados SSL encontrados en nginx/ssl/${NC}"
    SSL_ENABLED=true
elif [ -f "ssl/fullchain.pem" ] && [ -f "ssl/privkey.pem" ]; then
    echo -e "${GREEN}✓ Certificados SSL encontrados en ssl/${NC}"
    SSL_ENABLED=true
else
    echo -e "${YELLOW}⚠️  No se encontraron certificados SSL. El sitio estará disponible solo por HTTP.${NC}"
fi

# Verificar configuración de seguridad
echo -e "${YELLOW}Verificando configuración de seguridad...${NC}"
if [ -f "backend/.env" ]; then
    if grep -q "SECRET_KEY=your-secret-key\|SECRET_KEY=$\|SECRET_KEY=\"\"" backend/.env 2>/dev/null; then
        echo -e "${RED}⚠️  Configuración de seguridad necesita actualizarse${NC}"
        if ask_confirmation "¿Ejecutar configuración de seguridad automática?" 15; then
            if [ -f "backend/scripts/setup_security.py" ]; then
                echo -e "${PURPLE}Ejecutando configuración de seguridad...${NC}"
                cd backend && python scripts/setup_security.py && cd ..
                echo -e "${GREEN}✓ Configuración de seguridad completada${NC}"
                
                # Advertir sobre archivos de backup
                if ls security_keys_backup_*.txt &>/dev/null; then
                    echo -e "${RED}🔐 IMPORTANTE: Se generaron archivos de backup de claves${NC}"
                    echo -e "${YELLOW}   Guárdalos en un lugar seguro y elimínalos del servidor${NC}"
                fi
            else
                echo -e "${YELLOW}Script de seguridad no encontrado, continuando...${NC}"
            fi
        fi
    else
        echo -e "${GREEN}✓ Configuración de seguridad verificada${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Archivo backend/.env no encontrado${NC}"
fi

# Limpiar recursos no utilizados antes del despliegue
echo -e "${YELLOW}Limpiando recursos Docker no utilizados...${NC}"
docker system prune -f || true

# Actualizar imágenes desde Docker Hub (solo si usa imágenes remotas)
echo -e "${YELLOW}Verificando si hay imágenes para actualizar...${NC}"
if docker-compose --env-file="$ENV_FILE" config | grep -q "image:" && 
   docker-compose --env-file="$ENV_FILE" config | grep -q "eklista/medialab"; then
    echo -e "${YELLOW}Actualizando imágenes desde Docker Hub...${NC}"
    if ! COMPOSE_PROFILES="$COMPOSE_PROFILES" docker-compose --env-file="$ENV_FILE" pull; then
        echo -e "${YELLOW}⚠️  Algunas imágenes no se pudieron actualizar, usando locales...${NC}"
    fi
else
    echo -e "${YELLOW}Usando construcción local de imágenes...${NC}"
fi

# Detener servicios existentes
echo -e "${YELLOW}Deteniendo servicios existentes...${NC}"
COMPOSE_PROFILES="$COMPOSE_PROFILES" docker-compose --env-file="$ENV_FILE" down

# Construir y levantar servicios
echo -e "${YELLOW}Construyendo y levantando servicios...${NC}"
if ! COMPOSE_PROFILES="$COMPOSE_PROFILES" docker-compose --env-file="$ENV_FILE" up -d --build; then
    echo -e "${RED}Error al levantar los servicios${NC}"
    echo -e "${YELLOW}Intentando sin --build...${NC}"
    if ! COMPOSE_PROFILES="$COMPOSE_PROFILES" docker-compose --env-file="$ENV_FILE" up -d; then
        echo -e "${RED}Error crítico al levantar servicios${NC}"
        exit 1
    fi
fi

# Esperar a que los servicios estén listos
echo -e "${YELLOW}Esperando a que los servicios estén listos...${NC}"
sleep 20

# Verificar estado de los servicios
echo -e "${YELLOW}Verificando estado de los servicios...${NC}"
COMPOSE_PROFILES="$COMPOSE_PROFILES" docker-compose --env-file="$ENV_FILE" ps

# Verificar que la base de datos esté lista
echo -e "${YELLOW}Verificando que la base de datos esté lista...${NC}"
DB_READY=false
RETRY_COUNT=0
MAX_RETRIES=10

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
    echo -e "${RED}¡Advertencia! La base de datos no está respondiendo.${NC}"
    echo -e "${YELLOW}Mostrando logs de la base de datos:${NC}"
    COMPOSE_PROFILES="$COMPOSE_PROFILES" docker-compose --env-file="$ENV_FILE" logs --tail=10 db
fi

# Verificar si el backend está respondiendo
echo -e "${YELLOW}Verificando que el backend esté respondiendo...${NC}"
BACKEND_READY=false
RETRY_COUNT=0
MAX_RETRIES=10

# Determinar puerto del backend según el entorno
BACKEND_PORT="8000"
if [ "$ENVIRONMENT" = "production" ]; then
    # En producción, el backend puede estar detrás de nginx
    BACKEND_ENDPOINTS=(
        "http://localhost/api/v1/health"
        "http://localhost:8000/api/v1/health"
        "http://localhost/health"
        "http://localhost:8000/health"
    )
else
    BACKEND_ENDPOINTS=(
        "http://localhost:8000/api/v1/health"
        "http://localhost:8000/health"
    )
fi

while [ $BACKEND_READY = false ] && [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    for endpoint in "${BACKEND_ENDPOINTS[@]}"; do
        if curl -s "$endpoint" | grep -q "healthy\|ok\|status" 2>/dev/null; then
            BACKEND_READY=true
            echo -e "${GREEN}✓ Backend está respondiendo en: $endpoint${NC}"
            break
        fi
    done
    
    if [ $BACKEND_READY = false ]; then
        RETRY_COUNT=$((RETRY_COUNT+1))
        echo -e "${YELLOW}Esperando a que el backend esté listo (intento $RETRY_COUNT de $MAX_RETRIES)...${NC}"
        sleep 10
    fi
done

if [ $BACKEND_READY = false ]; then
    echo -e "${RED}¡Advertencia! El backend no parece estar respondiendo.${NC}"
    echo -e "${YELLOW}Mostrando logs del backend:${NC}"
    COMPOSE_PROFILES="$COMPOSE_PROFILES" docker-compose --env-file="$ENV_FILE" logs --tail=10 backend
    echo -e "${YELLOW}El despliegue continuará, pero podría haber problemas.${NC}"
fi

# Verificar nginx si está en el profile de producción
if [ "$COMPOSE_PROFILES" = "prod" ]; then
    echo -e "${YELLOW}Verificando que nginx esté respondiendo...${NC}"
    NGINX_READY=false
    RETRY_COUNT=0
    MAX_RETRIES=5

    while [ $NGINX_READY = false ] && [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -s -f "http://localhost/" > /dev/null 2>&1; then
            NGINX_READY=true
            echo -e "${GREEN}✓ Nginx está respondiendo correctamente.${NC}"
        else
            RETRY_COUNT=$((RETRY_COUNT+1))
            echo -e "${YELLOW}Esperando a que nginx esté listo (intento $RETRY_COUNT de $MAX_RETRIES)...${NC}"
            sleep 5
        fi
    done

    if [ $NGINX_READY = false ]; then
        echo -e "${RED}¡Advertencia! Nginx no parece estar respondiendo.${NC}"
        echo -e "${YELLOW}Mostrando logs de nginx:${NC}"
        COMPOSE_PROFILES="$COMPOSE_PROFILES" docker-compose --env-file="$ENV_FILE" logs --tail=10 nginx
    fi

    # Verificar SSL si está habilitado
    if [ "$SSL_ENABLED" = true ] && [ "$NGINX_READY" = true ]; then
        echo -e "${YELLOW}Verificando configuración SSL...${NC}"
        if curl -s -k "https://localhost/" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ SSL está funcionando correctamente.${NC}"
        else
            echo -e "${YELLOW}⚠️  SSL no está respondiendo correctamente.${NC}"
        fi
    fi
fi

# Verificación de seguridad opcional
echo -e "\n${YELLOW}=== VERIFICACIÓN DE SEGURIDAD ===${NC}"
if ask_confirmation "¿Ejecutar verificación rápida de seguridad?" 10; then
    if [ -f "test-security.sh" ]; then
        echo -e "${PURPLE}Ejecutando verificación de seguridad...${NC}"
        chmod +x test-security.sh
        ./test-security.sh
    else
        echo -e "${YELLOW}⚠️  test-security.sh no encontrado${NC}"
        echo -e "${YELLOW}Puedes crearlo para verificaciones futuras${NC}"
    fi
else
    echo -e "${YELLOW}Saltando verificación de seguridad${NC}"
fi

# Mostrar logs recientes
echo -e "\n${YELLOW}=== LOGS RECIENTES ===${NC}"
echo -e "${YELLOW}Logs de los últimos 5 minutos:${NC}"
COMPOSE_PROFILES="$COMPOSE_PROFILES" docker-compose --env-file="$ENV_FILE" logs --tail=20 --since=5m

echo -e "\n${GREEN}====================================${NC}"
echo -e "${GREEN}  DESPLIEGUE COMPLETADO CON ÉXITO  ${NC}"
echo -e "${GREEN}====================================${NC}"

# URLs de acceso
if [ "$SSL_ENABLED" = true ]; then
    BASE_URL="https://medialab.eklista.com"
    echo -e "${GREEN}🌐 MediaLab está accesible en: ${BASE_URL}${NC}"
    echo -e "${YELLOW}   También en: http://medialab.eklista.com (redirige a HTTPS)${NC}"
else
    BASE_URL="http://medialab.eklista.com"
    echo -e "${GREEN}🌐 MediaLab está accesible en: ${BASE_URL}${NC}"
fi

echo -e "\n${YELLOW}📱 Rutas de la aplicación:${NC}"
echo -e "${YELLOW}   - Panel admin: ${BASE_URL}/ml-admin/login${NC}"
echo -e "${YELLOW}   - Dashboard: ${BASE_URL}/dashboard${NC}"
echo -e "${YELLOW}   - Portal: ${BASE_URL}/portal${NC}"
echo -e "${YELLOW}   - API: ${BASE_URL}/api/v1/${NC}"
echo -e "${YELLOW}   - Documentación: ${BASE_URL}/api/v1/docs${NC}"

echo -e "\n${YELLOW}🛠️  Comandos útiles:${NC}"
echo -e "${YELLOW}   - Ver logs: COMPOSE_PROFILES=prod docker-compose --env-file=$ENV_FILE logs -f${NC}"
echo -e "${YELLOW}   - Ver estado: COMPOSE_PROFILES=prod docker-compose --env-file=$ENV_FILE ps${NC}"
echo -e "${YELLOW}   - Reiniciar: COMPOSE_PROFILES=prod docker-compose --env-file=$ENV_FILE restart${NC}"
echo -e "${YELLOW}   - Detener: COMPOSE_PROFILES=prod docker-compose --env-file=$ENV_FILE down${NC}"

echo -e "\n${YELLOW}🔐 Recordatorios de seguridad:${NC}"
echo -e "${YELLOW}   - Revisa los logs regularmente${NC}"
echo -e "${YELLOW}   - Mantén las imágenes actualizadas${NC}"
echo -e "${YELLOW}   - Configura backups automáticos${NC}"
echo -e "${YELLOW}   - Rota las claves cada 90 días${NC}"

# Limpiar recursos antiguos
if ask_confirmation "¿Limpiar imágenes Docker antiguas?" 5; then
    echo -e "${YELLOW}Limpiando imágenes antiguas...${NC}"
    docker image prune -f
    echo -e "${GREEN}✓ Limpieza completada${NC}"
fi

echo -e "\n${GREEN}🎉 ¡Despliegue finalizado exitosamente!${NC}"
echo -e "${GREEN}   Entorno: $ENVIRONMENT${NC}"
echo -e "${GREEN}   Profiles: $COMPOSE_PROFILES${NC}"