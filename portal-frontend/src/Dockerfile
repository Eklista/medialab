FROM node:20-alpine as build

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar archivos de código fuente
COPY . .

# Establecer variables de entorno para la construcción
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

# Construir la aplicación
RUN npm run build

# Etapa de producción usando Nginx para servir archivos estáticos
FROM nginx:alpine

# Copiar los archivos estáticos compilados
COPY --from=build /app/dist /usr/share/nginx/html

# Configurar Nginx para SPA
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]