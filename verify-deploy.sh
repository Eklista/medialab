#!/bin/bash
# verify-deploy.sh - Script para verificar el despliegue de MediaLab

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}  VERIFICACIÓN DE DESPLIEGUE        ${NC}"
echo -e "${BLUE}====================================${NC}"

# Función para verificar un endpoint
check_endpoint() {
    local name=$1
    local url=$2
    local expected_code=$3
    
    echo -e "${YELLOW}Verificando $name...${NC}"
    
    # Realizar la petición y capturar el código de estado
    status_code=$(curl -s -o /dev/null -w "%{http_code}" $url)
    
    if [ "$status_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ $name accesible (código $status_code)${NC}"
        return 0
    else
        echo -e "${RED}✗ $name NO accesible (código $status_code, esperado $expected_code)${NC}"
        return 1
    fi
}

# Verificar estado de los contenedores
echo -e "${YELLOW}Verificando estado de los contenedores...${NC}"
docker compose -f docker-compose.prod.yml ps

# Verificar los endpoints principales
domain="medialab.eklista.com"
use_https=false

# Verificar si https está disponible
if curl -s -k https://$domain > /dev/null; then
    use_https=true
    protocol="https"
    echo -e "${GREEN}HTTPS está disponible. Usaremos conexiones seguras para las pruebas.${NC}"
else
    protocol="http"
    echo -e "${YELLOW}HTTPS no disponible. Usaremos conexiones HTTP para las pruebas.${NC}"
fi

# Verificar endpoints
check_endpoint "Frontend principal" "$protocol://$domain" 200
check_endpoint "API" "$protocol://$domain/api/v1/health" 200
check_endpoint "Panel admin login" "$protocol://$domain/ml-admin/login" 200
check_endpoint "Portal externo" "$protocol://$domain/portal/" 200

# Comprobar redirección de /portal a /portal/
echo -e "${YELLOW}Verificando redirección de /portal a /portal/...${NC}"
redirect_url=$(curl -s -I "$protocol://$domain/portal" | grep -i "location" | awk '{print $2}' | tr -d '\r')

if [[ "$redirect_url" == *"/portal/"* ]]; then
    echo -e "${GREEN}✓ Redirección de /portal funciona correctamente${NC}"
else
    echo -e "${RED}✗ Redirección de /portal NO funciona correctamente${NC}"
fi

# Verificar logs de los contenedores para detectar errores
echo -e "${YELLOW}Verificando logs de los contenedores para detectar errores...${NC}"

check_container_logs() {
    local container=$1
    local error_count=$(docker compose -f docker-compose.prod.yml logs --tail=50 $container | grep -i "error\|exception\|fail" | wc -l)
    
    if [ $error_count -gt 0 ]; then
        echo -e "${RED}✗ $container tiene $error_count errores en sus logs recientes${NC}"
        echo -e "${YELLOW}Muestra de errores en $container:${NC}"
        docker compose -f docker-compose.prod.yml logs --tail=50 $container | grep -i "error\|exception\|fail"
    else
        echo -e "${GREEN}✓ No se encontraron errores en logs recientes de $container${NC}"
    fi
}

check_container_logs "frontend"
check_container_logs "portal-frontend"
check_container_logs "backend"
check_container_logs "nginx"

echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}  RESUMEN DE VERIFICACIÓN           ${NC}"
echo -e "${BLUE}====================================${NC}"

echo -e "${GREEN}Frontend principal: $protocol://$domain${NC}"
echo -e "${GREEN}Dashboard admin: $protocol://$domain/dashboard${NC}"
echo -e "${GREEN}Login admin: $protocol://$domain/ml-admin/login${NC}"
echo -e "${GREEN}Portal externo: $protocol://$domain/portal/${NC}"
echo -e "${GREEN}API: $protocol://$domain/api/v1${NC}"

echo -e "${YELLOW}Para ver más información:${NC}"
echo -e "${YELLOW}- Logs completos: docker compose -f docker-compose.prod.yml logs${NC}"
echo -e "${YELLOW}- Seguimiento de logs: docker compose -f docker-compose.prod.yml logs -f${NC}"
echo -e "${YELLOW}- Estado de los contenedores: docker compose -f docker-compose.prod.yml ps${NC}"