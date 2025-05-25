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

# Levantar servicios base primero
echo -e "${YELLOW}🔄 Levantando servicios base...${NC}"
ENV_FILE=.env.prod docker compose up -d db redis backend frontend-prod

# Esperar que estén listos
echo -e "${YELLOW}⏳ Esperando servicios...${NC}"
sleep 20

# Verificar que el backend esté respondiendo
echo -e "${YELLOW}🔍 Verificando backend...${NC}"
for i in {1..10}; do
    if docker compose exec backend curl -f http://localhost:8000/api/v1/health 2>/dev/null; then
        echo -e "${GREEN}✅ Backend listo${NC}"
        break
    fi
    echo "Intento $i/10 - esperando backend..."
    sleep 5
done

# Configurar nginx sin SSL primero
echo -e "${YELLOW}🔧 Configurando nginx temporal...${NC}"
cat > nginx/conf.d/medialab.conf << 'EOF'
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend-prod:80;
}

server {
    listen 80;
    server_name medialab.eklista.com;
    
    # Para certificados SSL
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }
    
    # Backend API
    location /api/v1/ {
        proxy_pass http://backend/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS básico
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE, PATCH' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    }
    
    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    access_log /var/log/nginx/medialab_access.log;
    error_log /var/log/nginx/medialab_error.log;
}
EOF

# Levantar nginx
echo -e "${YELLOW}🔄 Levantando nginx...${NC}"
ENV_FILE=.env.prod docker compose up -d nginx

# Esperar nginx
sleep 10

# Verificar que nginx esté funcionando
echo -e "${YELLOW}🔍 Verificando nginx...${NC}"
if ! docker compose ps nginx | grep -q "Up"; then
    echo -e "${RED}❌ Nginx no está funcionando, revisando logs...${NC}"
    docker compose logs nginx --tail=20
    exit 1
fi

# Intentar obtener SSL solo si no existe
if [ ! -f "ssl/fullchain.pem" ]; then
    echo -e "${YELLOW}🔒 Intentando obtener certificados SSL...${NC}"
    
    # Crear directorio para certbot
    mkdir -p /var/www/certbot
    
    # Verificar que el dominio apunte al servidor
    echo -e "${YELLOW}🌐 Verificando DNS...${NC}"
    if ! nslookup "$DOMAIN" | grep -q "$(curl -s ifconfig.me)"; then
        echo -e "${YELLOW}⚠️ El dominio $DOMAIN no apunta a este servidor${NC}"
        echo -e "${YELLOW}⚠️ Verifica tu configuración DNS antes de continuar${NC}"
    fi
    
    # Verificar que el puerto 80 esté accesible
    echo -e "${YELLOW}🔍 Verificando acceso HTTP...${NC}"
    if timeout 10 curl -s "http://$DOMAIN" > /dev/null; then
        echo -e "${GREEN}✅ Sitio accesible vía HTTP${NC}"
        
        # Intentar obtener certificados
        if certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive --dry-run; then
            echo -e "${GREEN}✅ Dry-run exitoso, obteniendo certificado real...${NC}"
            if certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive; then
                # Copiar certificados
                cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ssl/
                cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" ssl/
                chmod 644 ssl/fullchain.pem
                chmod 600 ssl/privkey.pem
                echo -e "${GREEN}✅ SSL obtenido exitosamente${NC}"
                
                # Configurar nginx con SSL
                echo -e "${YELLOW}🔧 Configurando HTTPS...${NC}"
                cat > nginx/conf.d/medialab.conf << 'EOF'
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend-prod:80;
}

# Redirección HTTP a HTTPS
server {
    listen 80;
    server_name medialab.eklista.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

# Servidor HTTPS
server {
    listen 443 ssl http2;
    server_name medialab.eklista.com;
    
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Backend API
    location /api/v1/ {
        proxy_pass http://backend/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS básico
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE, PATCH' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    }
    
    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    access_log /var/log/nginx/medialab_access.log;
    error_log /var/log/nginx/medialab_error.log;
}
EOF
            else
                echo -e "${RED}❌ Error obteniendo certificado real${NC}"
            fi
        else
            echo -e "${RED}❌ Dry-run falló${NC}"
        fi
    else
        echo -e "${RED}❌ Sitio no accesible vía HTTP${NC}"
        echo -e "${YELLOW}⚠️ Verifica tu firewall y DNS${NC}"
    fi
else
    echo -e "${GREEN}✅ Certificados SSL ya existen${NC}"
fi

# Reiniciar nginx con la nueva configuración
echo -e "${YELLOW}🔄 Reiniciando nginx...${NC}"
ENV_FILE=.env.prod docker compose restart nginx

# Esperar y verificar
sleep 15
echo -e "${YELLOW}🔍 Verificación final...${NC}"

# Mostrar estado de contenedores
docker compose ps

# Verificar accesibilidad
if curl -s --max-time 10 "http://$DOMAIN" > /dev/null; then
    echo -e "${GREEN}✅ Deploy completado exitosamente!${NC}"
    
    if [ -f "ssl/fullchain.pem" ]; then
        echo -e "${GREEN}🌐 Acceso HTTPS: https://$DOMAIN${NC}"
        echo -e "${GREEN}🌐 Acceso HTTP: http://$DOMAIN (redirige a HTTPS)${NC}"
    else
        echo -e "${GREEN}🌐 Acceso HTTP: http://$DOMAIN${NC}"
        echo -e "${YELLOW}⚠️ SSL no configurado - revisa DNS y firewall${NC}"
    fi
    
    echo -e "${GREEN}🔧 API disponible en: http://$DOMAIN/api/v1/${NC}"
else
    echo -e "${RED}❌ El sitio no responde${NC}"
    echo -e "${YELLOW}📋 Revisando logs de nginx:${NC}"
    docker compose logs nginx --tail=10
    echo -e "${YELLOW}📋 Revisando logs de backend:${NC}"
    docker compose logs backend --tail=5
fi

echo -e "${YELLOW}💡 Comandos útiles:${NC}"
echo -e "${YELLOW}   - Ver logs: docker compose logs -f${NC}"
echo -e "${YELLOW}   - Reiniciar: docker compose restart${NC}"
echo -e "${YELLOW}   - Estado: docker compose ps${NC}"