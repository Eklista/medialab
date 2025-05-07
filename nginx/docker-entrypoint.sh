#!/bin/sh
# docker-entrypoint.sh para Nginx

set -e

# Verificar si hay certificados SSL
if [ -f "/etc/nginx/ssl/fullchain.pem" ] && [ -f "/etc/nginx/ssl/privkey.pem" ]; then
    echo "Certificados SSL encontrados, habilitando HTTPS"
    
    # Habilitamos la redirección de HTTP a HTTPS
    sed -i 's/# SSL_REDIRECT/return 301 https:\/\/$host$request_uri;/g' /etc/nginx/conf.d/medialab.conf
    
    # Aseguramos que la sección de servidor SSL esté habilitada
    # (No necesitamos hacer nada porque ya está descomentado en el archivo)
else
    echo "No se encontraron certificados SSL, deshabilitando HTTPS"
    
    # Eliminamos la redirección de HTTP a HTTPS
    sed -i 's/# SSL_REDIRECT//g' /etc/nginx/conf.d/medialab.conf
    
    # Comentamos toda la sección del servidor SSL
    sed -i '/#\ SSL_SERVER_START/,/#\ SSL_SERVER_END/d' /etc/nginx/conf.d/medialab.conf
fi

# Ejecutar comando
exec "$@"