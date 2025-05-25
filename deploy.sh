#!/bin/bash
# deploy.sh - Deploy simple de MediaLab
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DOMAIN="medialab.eklista.com"
EMAIL="pablo.lacan@galileo.edu"  # CAMBIAR POR TU EMAIL

echo -e "${GREEN}🚀 Desplegando MediaLab...${NC}"

# Git pull
echo -e "${YELLOW}📥 Actualizando código...${NC}"
git pull

# Instalar certbot si no existe
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}📦 Instalando Certbot...${NC}"
    apt update && apt install -y certbot
fi

# Parar servicios
echo -e "${YELLOW}🛑 Parando servicios...${NC}"
ENV_FILE=.env.prod docker compose --profile prod down || true

# Levantar servicios base
echo -e "${YELLOW}🔄 Levantando servicios...${NC}"
ENV_FILE=.env.prod docker compose up -d db redis backend frontend-prod

# Esperar que estén listos
sleep 15

# Obtener SSL si no existe
if [ ! -f "ssl/fullchain.pem" ]; then
    echo -e "${YELLOW}🔒 Obteniendo certificados SSL...${NC}"
    
    # Nginx temporal para certbot
    cat > nginx/conf.d/temp.conf << 'EOF'
server {
    listen 80;
    server_name medialab.eklista.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }
    
    location /api/v1/ { 
        proxy_pass http://backend:8000/api/v1/; 
        proxy_set_header Host $host; 
    }
    
    location / { 
        proxy_pass http://frontend-prod:80; 
        proxy_set_header Host $host; 
    }
}
EOF
    
    # Levantar nginx temporal
    ENV_FILE=.env.prod docker compose up -d nginx
    sleep 5
    
    # Obtener certificados
    mkdir -p /var/www/certbot
    if certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive; then
        cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ssl/
        cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" ssl/
        chmod 644 ssl/fullchain.pem
        chmod 600 ssl/privkey.pem
        echo -e "${GREEN}✅ SSL obtenido${NC}"
    else
        echo -e "${YELLOW}⚠️ SSL falló, continuando sin HTTPS${NC}"
    fi
fi

# Restaurar nginx con SSL si existe
if [ -f "ssl/fullchain.pem" ]; then
    echo -e "${YELLOW}🔧 Configurando nginx con SSL...${NC}"
    git checkout nginx/conf.d/medialab.conf || true
else
    echo -e "${YELLOW}🔧 Configurando nginx sin SSL...${NC}"
    cat > nginx/conf.d/medialab.conf << 'EOF'
upstream backend { server backend:8000; }
upstream frontend { server frontend-prod:80; }
server {
    listen 80;
    server_name medialab.eklista.com;
    location /api/v1/ { proxy_pass http://backend/api/v1/; proxy_set_header Host $host; }
    location / { proxy_pass http://frontend; proxy_set_header Host $host; }
}
EOF
fi

# Reiniciar nginx
ENV_FILE=.env.prod docker compose restart nginx

# Verificar
sleep 10
echo -e "${YELLOW}🔍 Verificando...${NC}"
docker compose ps

if curl -s "http://$DOMAIN" > /dev/null; then
    echo -e "${GREEN}✅ Deploy completado!${NC}"
    if [ -f "ssl/fullchain.pem" ]; then
        echo -e "${GREEN}🌐 Acceso: https://$DOMAIN${NC}"
    else
        echo -e "${GREEN}🌐 Acceso: http://$DOMAIN${NC}"
    fi
else
    echo -e "${RED}❌ Algo falló, revisa los logs${NC}"
    docker compose logs --tail=10
fi