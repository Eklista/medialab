#!/bin/bash

# ==============================================
# MEDIALAB TESTING SCRIPT
# ==============================================
# Script para probar todos los servicios del sistema Medialab

echo "🔧 MEDIALAB - Testing Suite"
echo "==================================="
echo

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test functions
test_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $service_name... "
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        return 1
    fi
}

test_container_health() {
    local container_name=$1
    local status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null)
    
    echo -n "Container $container_name health... "
    
    if [ "$status" = "healthy" ]; then
        echo -e "${GREEN}✅ HEALTHY${NC}"
        return 0
    elif [ "$status" = "starting" ]; then
        echo -e "${YELLOW}⏳ STARTING${NC}"
        return 1
    else
        echo -e "${RED}❌ UNHEALTHY${NC}"
        return 1
    fi
}

# Main testing
echo "📊 Testing Docker Containers"
echo "-----------------------------------"

# Test all containers
containers=("postgres_db" "redis_cache" "fastapi_backend")
for container in "${containers[@]}"; do
    test_container_health "$container"
done

# Test WordPress separately (might be starting)
if test_container_health "wordpress_cms"; then
    WORDPRESS_READY=true
else
    WORDPRESS_READY=false
fi

echo
echo "🌐 Testing Service Endpoints"
echo "-----------------------------------"

# Test PostgreSQL (via container)
echo -n "PostgreSQL connection... "
if docker exec postgres_db pg_isready -U medialab_user -d medialab_db >/dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
fi

# Test Redis (via container)
echo -n "Redis connection... "
if docker exec redis_cache redis-cli -a redis_secure_password ping 2>/dev/null | grep -q "PONG"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
fi

# Test FastAPI health endpoint
echo -n "FastAPI health endpoint... "
if docker exec fastapi_backend curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
fi

# Test WordPress (if ready)
if [ "$WORDPRESS_READY" = true ]; then
    echo -n "WordPress health endpoint... "
    if docker exec wordpress_cms curl -s -o /dev/null -w "%{http_code}" http://localhost/wp-admin/admin-ajax.php | grep -q "200\|400\|403"; then
        echo -e "${GREEN}✅ OK${NC}"
    else
        echo -e "${RED}❌ FAIL${NC}"
    fi
else
    echo -e "WordPress health endpoint... ${YELLOW}⏳ WAITING${NC}"
fi

echo
echo "🔍 Testing Database Setup"
echo "-----------------------------------"

# Test database schema
echo -n "Database tables created... "
if docker exec postgres_db psql -U medialab_user -d medialab_db -c "SELECT COUNT(*) FROM users;" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
fi

# Test default admin user
echo -n "Default admin user exists... "
if docker exec postgres_db psql -U medialab_user -d medialab_db -c "SELECT email FROM users WHERE email='admin@medialab.com';" 2>/dev/null | grep -q "admin@medialab.com"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
fi

echo
echo "📈 System Status Summary"
echo "-----------------------------------"

# Get service status
echo "Service Status:"
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo
echo "💾 Volume Usage:"
docker volume ls | grep medialab

echo
echo "🌐 Access URLs (when all services are ready):"
echo "  • Main Site: http://localhost (via nginx)"
echo "  • API Direct: docker exec fastapi_backend curl http://localhost:8000/health"

# Check if API is exposed for development
if docker compose ps | grep fastapi_backend | grep -q "0.0.0.0:8000"; then
    echo "  • API Swagger UI: http://localhost:8000/docs (DEVELOPMENT ONLY)"
    echo "  • API ReDoc: http://localhost:8000/redoc (DEVELOPMENT ONLY)"
    echo "  • API Health: http://localhost:8000/health"
    echo "  ⚠️  WARNING: API is exposed! Use only for development."
else
    echo "  • API: Internal only (production mode) ✅"
fi

echo "  • Database: localhost:5433"
echo "  • Redis: localhost:6379"

echo
echo "🔧 Quick Commands:"
echo "  • View all logs: docker compose logs"
echo "  • Stop all: docker compose down"
echo "  • Start specific service: docker compose up <service> -d"
echo "  • View specific logs: docker compose logs <service> --tail=20"
