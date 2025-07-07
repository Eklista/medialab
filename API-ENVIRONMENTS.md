# 🔧 Configuración de Entornos: Desarrollo vs Producción

## 🚀 Modo Desarrollo (API Expuesta)

### Configuración Actual
- ✅ API expuesta en `http://localhost:8000`
- ✅ Swagger UI disponible en `http://localhost:8000/docs`
- ✅ ReDoc disponible en `http://localhost:8000/redoc`
- ⚠️  Solo para desarrollo y testing

### URLs de Desarrollo
```
🌐 Swagger UI:  http://localhost:8000/docs
📚 ReDoc:       http://localhost:8000/redoc  
❤️  Health:     http://localhost:8000/health
🔍 Database:    localhost:5433
💾 Redis:       localhost:6379
```

### Ventajas del Modo Desarrollo
- 🔍 **Debugging**: Acceso directo a la API
- 📖 **Documentación**: Swagger UI interactivo
- 🧪 **Testing**: Probar endpoints fácilmente
- 🔧 **Desarrollo**: Integración con herramientas externas

---

## 🛡️ Modo Producción (API Interna)

### Configuración para Producción
Para activar el modo producción (API no expuesta):

1. **Editar `.env`**:
   ```bash
   # Comentar o eliminar esta línea:
   # API_EXPOSE_PORT=8000
   
   # O dejar vacía:
   API_EXPOSE_PORT=
   ```

2. **Aplicar cambios**:
   ```bash
   docker compose stop api
   docker compose up api -d
   ```

3. **Verificar**:
   ```bash
   ./test-system.sh
   # Debería mostrar: "API: Internal only (production mode) ✅"
   ```

### Seguridad en Producción
- ✅ **API interna**: Solo accesible desde otros servicios Docker
- ✅ **Sin Swagger**: No hay documentación expuesta públicamente
- ✅ **Aislamiento**: Reduce la superficie de ataque
- ✅ **Escalabilidad**: Mejor para balanceadores de carga

---

## 🔄 Cambio Rápido entre Entornos

### Desarrollo → Producción
```bash
# 1. Editar .env
sed -i 's/API_EXPOSE_PORT=8000/# API_EXPOSE_PORT=8000/' .env

# 2. Reiniciar API
docker compose stop api && docker compose up api -d

# 3. Verificar
./test-system.sh
```

### Producción → Desarrollo  
```bash
# 1. Editar .env
sed -i 's/# API_EXPOSE_PORT=8000/API_EXPOSE_PORT=8000/' .env

# 2. Reiniciar API
docker compose stop api && docker compose up api -d

# 3. Verificar
./test-system.sh
```

---

## 📁 Archivos de Configuración

### Archivos Disponibles
- `.env` - Configuración actual (desarrollo)
- `.env.example` - Plantilla con comentarios
- `.env.production` - Configuración lista para producción

### Uso de Archivos
```bash
# Para desarrollo
cp .env.example .env
# Editar API_EXPOSE_PORT=8000

# Para producción
cp .env.production .env
# API_EXPOSE_PORT queda comentado/vacío
```

---

## 🧪 Testing de la Configuración

### Script de Verificación
```bash
# Ejecutar suite completa de tests
./test-system.sh

# Solo verificar estado de la API
docker compose ps | grep fastapi_backend
```

### Endpoints de Prueba
```bash
# Health check (siempre disponible)
curl http://localhost:8000/health

# Swagger (solo en desarrollo)
curl http://localhost:8000/docs

# Desde contenedor (siempre funciona)
docker exec fastapi_backend curl http://localhost:8000/health
```

---

## ⚠️ Consideraciones Importantes

### Desarrollo
- 🔓 **Nunca en producción**: API expuesta es un riesgo de seguridad
- 🔧 **Solo para debug**: Usar para desarrollo y testing únicamente
- 📝 **Documentar cambios**: Mantener registro de configuraciones

### Producción
- 🛡️ **Seguridad primero**: API siempre debe ser interna
- 🔒 **Acceso controlado**: Solo a través de nginx/proxy
- 📊 **Monitoreo**: Usar logs para debugging en lugar de acceso directo

---

**Configuración actual**: 🔧 **DESARROLLO** (API expuesta)  
**Para cambiar a producción**: Seguir los pasos en la sección "Modo Producción"
