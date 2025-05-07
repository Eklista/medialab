FROM nginx:alpine

# Eliminar la configuración por defecto
RUN rm /etc/nginx/conf.d/default.conf

# Copiar archivos de configuración
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/medialab.conf /etc/nginx/conf.d/

# Crear directorio para certificados SSL
RUN mkdir -p /etc/nginx/ssl

# Copiar script de entrada y hacerlo ejecutable
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Exponer puertos
EXPOSE 80
EXPOSE 443

# Usar el script como punto de entrada
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]