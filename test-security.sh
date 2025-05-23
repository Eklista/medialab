#!/bin/bash

# ===========================================
# SCRIPT DE VERIFICACIÓN RÁPIDA DE SEGURIDAD
# ===========================================

API_URL="http://localhost:8000"
echo "🔍 Verificando seguridad de MediaLab API..."
echo "=================================="

# 1. Verificar que el servidor esté corriendo
echo "📡 1. Verificando conexión al servidor..."
if curl -s "$API_URL/health" > /dev/null; then
    echo "✅ Servidor respondiendo"
    curl -s "$API_URL/health" | jq '.' 2>/dev/null || echo "Health check response received"
else
    echo "❌ Servidor no responde - verificar docker-compose"
    echo "   Ejecutar: docker-compose up -d"
    exit 1
fi

echo ""

# 2. Verificar CORS y headers de seguridad
echo "🛡️  2. Verificando headers de seguridad..."
HEADERS=$(curl -s -I "$API_URL/api/v1/auth/me" -H "Origin: http://localhost:3000")

if echo "$HEADERS" | grep -q "X-Frame-Options"; then
    echo "✅ X-Frame-Options presente"
else
    echo "⚠️  X-Frame-Options ausente"
fi

if echo "$HEADERS" | grep -q "X-Content-Type-Options"; then
    echo "✅ X-Content-Type-Options presente"
else
    echo "⚠️  X-Content-Type-Options ausente"
fi

if echo "$HEADERS" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS configurado"
else
    echo "⚠️  CORS no configurado"
fi

echo ""

# 3. Test de JWT forgery básico
echo "🔨 3. Probando JWT forgery..."
FAKE_TOKEN="eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxIiwiZXhwIjo5OTk5OTk5OTk5fQ."

RESPONSE=$(curl -s -w "%{http_code}" "$API_URL/api/v1/auth/me" \
    -H "Authorization: Bearer $FAKE_TOKEN" \
    -o /dev/null)

if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "403" ]; then
    echo "✅ JWT forgery rechazado (código: $RESPONSE)"
else
    echo "❌ JWT forgery aceptado - VULNERABLE (código: $RESPONSE)"
fi

echo ""

# 4. Test de rate limiting
echo "⚡ 4. Probando rate limiting..."
RATE_LIMIT_TRIGGERED=false

for i in {1..10}; do
    RESPONSE=$(curl -s -w "%{http_code}" "$API_URL/api/v1/auth/login" \
        -X POST \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=test@test.com&password=wrongpassword" \
        -o /dev/null)
    
    if [ "$RESPONSE" = "429" ]; then
        echo "✅ Rate limiting activado después de $i intentos"
        RATE_LIMIT_TRIGGERED=true
        break
    fi
    
    sleep 0.5
done

if [ "$RATE_LIMIT_TRIGGERED" = false ]; then
    echo "⚠️  Rate limiting no detectado en 10 intentos"
fi

echo ""

# 5. Verificar endpoints críticos
echo "🎯 5. Verificando endpoints críticos..."

ENDPOINTS=(
    "/api/v1/auth/login"
    "/api/v1/auth/logout"
    "/api/v1/auth/refresh"
    "/api/v1/auth/me"
    "/api/v1/users/me"
)

for endpoint in "${ENDPOINTS[@]}"; do
    RESPONSE=$(curl -s -w "%{http_code}" "$API_URL$endpoint" -o /dev/null)
    
    if [ "$RESPONSE" = "405" ] || [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "422" ]; then
        echo "✅ $endpoint - Respondiendo correctamente ($RESPONSE)"
    elif [ "$RESPONSE" = "000" ]; then
        echo "❌ $endpoint - No responde"
    else
        echo "⚠️  $endpoint - Código inesperado: $RESPONSE"
    fi
done

echo ""

# 6. Test de información de seguridad
echo "📊 6. Información de seguridad del sistema..."
curl -s "$API_URL/security-info" | jq '.' 2>/dev/null || curl -s "$API_URL/security-info"

echo ""
echo "=================================="
echo "✅ Verificación de seguridad completada"
echo ""
echo "📋 Próximos pasos:"
echo "1. Si hay errores de conexión: docker-compose up -d"
echo "2. Si faltan headers: verificar middleware en main.py"
echo "3. Para test completo: usar security_test.html"
echo ""
echo "🔗 URLs de prueba:"
echo "   - API Docs: $API_URL/api/v1/docs"
echo "   - Health: $API_URL/health"
echo "   - Security Info: $API_URL/security-info"