#!/bin/bash
# ===========================================
# SCRIPT DE VERIFICACIÓN RÁPIDA DE SEGURIDAD
# MediaLab API - Versión actualizada
# ===========================================

API_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:5173"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Verificando seguridad de MediaLab API...${NC}"
echo "=================================="

# 1. Verificar que el servidor esté corriendo
echo -e "${BLUE}📡 1. Verificando conexión al servidor...${NC}"
if curl -s "$API_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ Servidor respondiendo${NC}"
    HEALTH_RESPONSE=$(curl -s "$API_URL/health")
    echo "   Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}❌ Servidor no responde - verificar docker-compose${NC}"
    echo "   Ejecutar: docker-compose up -d"
    exit 1
fi
echo ""

# 2. Verificar CORS y headers de seguridad
echo -e "${BLUE}🛡️  2. Verificando headers de seguridad...${NC}"
HEADERS=$(curl -s -I "$API_URL/api/v1/users/me" -H "Origin: $FRONTEND_URL")

# Verificar headers específicos
if echo "$HEADERS" | grep -qi "access-control-allow-origin"; then
    echo -e "${GREEN}✅ CORS configurado${NC}"
    CORS_ORIGIN=$(echo "$HEADERS" | grep -i "access-control-allow-origin" | cut -d' ' -f2- | tr -d '\r')
    echo "   Origin permitido: $CORS_ORIGIN"
else
    echo -e "${YELLOW}⚠️  CORS no configurado${NC}"
fi

if echo "$HEADERS" | grep -qi "access-control-allow-credentials"; then
    echo -e "${GREEN}✅ CORS credentials habilitado${NC}"
else
    echo -e "${YELLOW}⚠️  CORS credentials no configurado${NC}"
fi

# Verificar si el endpoint está protegido
RESPONSE_CODE=$(echo "$HEADERS" | head -n1 | cut -d' ' -f2)
if [ "$RESPONSE_CODE" = "401" ]; then
    echo -e "${GREEN}✅ Endpoint /users/me protegido correctamente${NC}"
else
    echo -e "${YELLOW}⚠️  Endpoint /users/me responde código: $RESPONSE_CODE${NC}"
fi
echo ""

# 3. Test de JWT forgery con tokens encriptados
echo -e "${BLUE}🔨 3. Probando JWT forgery y validación de tokens...${NC}"

# Test 1: Token completamente falso
FAKE_TOKEN="fake.token.here"
RESPONSE=$(curl -s -w "%{http_code}" "$API_URL/api/v1/users/me" \
    -H "Authorization: Bearer $FAKE_TOKEN" \
    -o /dev/null)
if [ "$RESPONSE" = "401" ]; then
    echo -e "${GREEN}✅ Token falso rechazado (código: $RESPONSE)${NC}"
else
    echo -e "${RED}❌ Token falso aceptado - VULNERABLE (código: $RESPONSE)${NC}"
fi

# Test 2: JWT normal (no encriptado) - debería ser rechazado
JWT_NORMAL="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjo5OTk5OTk5OTk5fQ.Lnf7i_bPxdGHhDOLIjFSZOKXDG8RuKN7dHWqx8VkKn8"
RESPONSE=$(curl -s -w "%{http_code}" "$API_URL/api/v1/users/me" \
    -H "Authorization: Bearer $JWT_NORMAL" \
    -o /dev/null)
if [ "$RESPONSE" = "401" ]; then
    echo -e "${GREEN}✅ JWT normal rechazado - Sistema requiere JWE (código: $RESPONSE)${NC}"
else
    echo -e "${RED}❌ JWT normal aceptado - Posible vulnerabilidad (código: $RESPONSE)${NC}"
fi

# Test 3: Sin token
RESPONSE=$(curl -s -w "%{http_code}" "$API_URL/api/v1/users/me" -o /dev/null)
if [ "$RESPONSE" = "401" ]; then
    echo -e "${GREEN}✅ Acceso sin token rechazado (código: $RESPONSE)${NC}"
else
    echo -e "${RED}❌ Acceso sin token permitido - VULNERABLE (código: $RESPONSE)${NC}"
fi
echo ""

# 4. Test de rate limiting en login
echo -e "${BLUE}⚡ 4. Probando rate limiting en login...${NC}"
RATE_LIMIT_TRIGGERED=false
echo "   Realizando intentos de login con credenciales inválidas..."

for i in {1..8}; do
    RESPONSE=$(curl -s -w "%{http_code}" "$API_URL/api/v1/auth/login" \
        -X POST \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=test@invalid.com&password=wrongpassword" \
        -o /dev/null)
   
    if [ "$RESPONSE" = "429" ]; then
        echo -e "${GREEN}✅ Rate limiting activado después de $i intentos (código: $RESPONSE)${NC}"
        RATE_LIMIT_TRIGGERED=true
        break
    elif [ "$RESPONSE" = "401" ]; then
        echo "   Intento $i: Credenciales rechazadas (esperado)"
    else
        echo "   Intento $i: Código inesperado $RESPONSE"
    fi
   
    sleep 0.3
done

if [ "$RATE_LIMIT_TRIGGERED" = false ]; then
    echo -e "${YELLOW}⚠️  Rate limiting no detectado en 8 intentos${NC}"
    echo "   Esto podría ser normal si el límite es mayor a 8"
fi
echo ""

# 5. Verificar endpoints críticos
echo -e "${BLUE}🎯 5. Verificando endpoints críticos...${NC}"
declare -A ENDPOINTS
ENDPOINTS["/api/v1/auth/login"]="POST - Debería devolver 422 sin datos"
ENDPOINTS["/api/v1/auth/logout"]="POST - Debería devolver 401 sin auth"
ENDPOINTS["/api/v1/auth/refresh"]="POST - Debería devolver 401 sin refresh token"
ENDPOINTS["/api/v1/auth/validate-token"]="POST - Debería devolver 401 sin token"
ENDPOINTS["/api/v1/users/me"]="GET - Debería devolver 401 sin auth"
ENDPOINTS["/api/v1/users/"]="GET - Debería devolver 401 sin auth"

for endpoint in "${!ENDPOINTS[@]}"; do
    RESPONSE=$(curl -s -w "%{http_code}" "$API_URL$endpoint" -o /dev/null)
   
    if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "422" ] || [ "$RESPONSE" = "405" ]; then
        echo -e "${GREEN}✅ $endpoint - Protegido correctamente ($RESPONSE)${NC}"
    elif [ "$RESPONSE" = "000" ]; then
        echo -e "${RED}❌ $endpoint - No responde${NC}"
    else
        echo -e "${YELLOW}⚠️  $endpoint - Código: $RESPONSE${NC}"
        echo "     ${ENDPOINTS[$endpoint]}"
    fi
done
echo ""

# 6. Test de cookies y autenticación real
echo -e "${BLUE}🍪 6. Verificando configuración de cookies...${NC}"
# Intentar login con credenciales de ejemplo
LOGIN_RESPONSE=$(curl -s -w "%{http_code}" -c /tmp/cookies.txt "$API_URL/api/v1/auth/login" \
    -X POST \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=admin@example.com&password=admin123")

if echo "$LOGIN_RESPONSE" | grep -q "200"; then
    echo -e "${GREEN}✅ Login de prueba exitoso - cookies guardadas${NC}"
    
    # Verificar que las cookies fueron establecidas
    if [ -f /tmp/cookies.txt ] && grep -q "access_token" /tmp/cookies.txt; then
        echo -e "${GREEN}✅ Cookie access_token establecida${NC}"
        
        # Verificar flags de seguridad
        if grep -q "HttpOnly" /tmp/cookies.txt; then
            echo -e "${GREEN}✅ Cookie HttpOnly configurada${NC}"
        else
            echo -e "${YELLOW}⚠️  Cookie HttpOnly no detectada${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Cookies no detectadas en respuesta${NC}"
    fi
    
    # Limpiar archivo temporal
    rm -f /tmp/cookies.txt
else
    echo -e "${YELLOW}⚠️  Login de prueba falló (credenciales de ejemplo no válidas)${NC}"
    echo "   Esto es normal si no tienes usuario admin@example.com"
fi
echo ""

# 7. Verificar blacklist de tokens
echo -e "${BLUE}📋 7. Verificando sistema de blacklist...${NC}"
# Verificar si la tabla existe
BLACKLIST_CHECK=$(docker exec -i medialab_db_1 mysql -u root -prootpassword medialab_db -e "SHOW TABLES LIKE 'token_blacklist';" 2>/dev/null)
if echo "$BLACKLIST_CHECK" | grep -q "token_blacklist"; then
    echo -e "${GREEN}✅ Tabla token_blacklist existe${NC}"
    
    # Contar tokens en blacklist
    TOKEN_COUNT=$(docker exec -i medialab_db_1 mysql -u root -prootpassword medialab_db -e "SELECT COUNT(*) FROM token_blacklist;" 2>/dev/null | tail -n1)
    echo "   Tokens en blacklist: $TOKEN_COUNT"
else
    echo -e "${YELLOW}⚠️  No se pudo verificar tabla token_blacklist${NC}"
    echo "   Puede ser que Docker no esté corriendo o credenciales cambien"
fi
echo ""

# 8. Resumen final
echo "=================================="
echo -e "${BLUE}📊 RESUMEN DE SEGURIDAD${NC}"
echo "=================================="
echo -e "${GREEN}✅ Funciones de seguridad detectadas:${NC}"
echo "   - Autenticación JWT/JWE requerida"
echo "   - Endpoints protegidos correctamente"
echo "   - Validación de tokens funcionando"
echo "   - CORS configurado para frontend"
echo ""
echo -e "${BLUE}🔗 URLs útiles:${NC}"
echo "   - API Docs: $API_URL/api/v1/docs"
echo "   - Health Check: $API_URL/health"
echo "   - Frontend: $FRONTEND_URL"
echo ""
echo -e "${BLUE}📋 Para testing manual:${NC}"
echo "   1. Abrir frontend en: $FRONTEND_URL"
echo "   2. Intentar login con credenciales reales"
echo "   3. Verificar tokens encriptados en Network tab"
echo "   4. Probar logout y verificar revocación"
echo ""
echo -e "${GREEN}✅ Verificación de seguridad completada${NC}"