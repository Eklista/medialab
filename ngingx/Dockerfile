# nginx/Dockerfile
FROM nginx:alpine

# Remover configuración por defecto
RUN rm /etc/nginx/conf.d/default.conf

# Copiar configuración personalizada
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/medialab.conf /etc/nginx/conf.d/medialab.conf

# Copiar certificados SSL (si los tienes)
# COPY ssl/ /etc/nginx/ssl/

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]