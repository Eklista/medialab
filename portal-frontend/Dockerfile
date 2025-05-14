FROM node:20-alpine as build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el código fuente
COPY . .

# Construir la aplicación para producción
RUN npm run build

# Etapa de producción
FROM nginx:alpine

# Copiar configuración de nginx personalizada si es necesario
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos de construcción desde la etapa de build
COPY --from=build /app/dist /usr/share/nginx/html

# Configurar para que NGINX maneje las rutas SPA (Single Page Application)
RUN echo 'server { \
    listen 5173; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 5174

CMD ["nginx", "-g", "daemon off;"]