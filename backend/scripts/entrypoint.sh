#!/bin/bash
# backend/scripts/entrypoint.sh - FUSIONADO CON REDIS (CORREGIDO)

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# ===============================================
# FUNCIONES DE ESPERA DE SERVICIOS (CORREGIDAS)
# ===============================================

wait_for_mysql() {
    log "Esperando a que la base de datos esté lista..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        # Usar timeout y manejo de errores más robusto
        if timeout 5 nc -z db 3306 >/dev/null 2>&1; then
            log "✅ Base de datos lista!"
            
            # Verificación adicional con mysql client si está disponible
            if command -v mysql >/dev/null 2>&1; then
                info "🔍 Verificando acceso a la base de datos..."
                if timeout 10 mysql -h db -u "${DB_USER:-medialab_user}" -p"${DB_PASSWORD:-MediaLab2025Db\$3cur3}" -e "SELECT 1;" >/dev/null 2>&1; then
                    log "✅ Acceso a base de datos verificado!"
                    return 0
                else
                    warn "⚠️ Conexión de red OK pero acceso a DB falló, reintentando..."
                fi
            else
                log "✅ Conexión de red a MySQL verificada!"
                return 0
            fi
        fi
        
        info "Intento $attempt/$max_attempts - MySQL no disponible, esperando 2s..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    error "❌ MySQL no disponible después de $max_attempts intentos"
    return 1
}

wait_for_redis() {
    local redis_host=${REDIS_HOST:-redis}
    local redis_port=${REDIS_PORT:-6379}
    local max_attempts=${1:-20}
    
    if [ "$REDIS_ENABLED" = "false" ]; then
        warn "⚠️ Redis está deshabilitado, saltando verificación"
        return 0
    fi
    
    log "Esperando conexión con Redis en $redis_host:$redis_port..."
    
    local attempt=1
    while [ $attempt -le $max_attempts ]; do
        if timeout 3 nc -z "$redis_host" "$redis_port" >/dev/null 2>&1; then
            log "✅ Redis disponible!"
            
            # Test básico de ping si redis-cli está disponible
            if command -v redis-cli >/dev/null 2>&1; then
                if timeout 5 redis-cli -h "$redis_host" -p "$redis_port" ping >/dev/null 2>&1; then
                    log "✅ Test de ping a Redis exitoso"
                else
                    warn "⚠️ Redis responde pero ping falló"
                fi
            fi
            return 0
        fi
        
        info "Intento $attempt/$max_attempts - Redis no disponible, esperando 3s..."
        sleep 3
        attempt=$((attempt + 1))
    done
    
    if [ "$REDIS_ENABLED" = "true" ]; then
        warn "⚠️ Redis no disponible después de $max_attempts intentos"
        warn "⚠️ Continuando sin Redis - funcionalidad limitada"
    fi
    
    return 1
}

# ===============================================
# CONFIGURACIÓN DE VARIABLES
# ===============================================

setup_environment() {
    log "🔧 Configurando variables de entorno..."
    
    # Variables de inicialización existentes
    export INIT_BASE_STRUCTURE=${INIT_BASE_STRUCTURE:-true}
    export INIT_DEPARTMENT_DATA=${INIT_DEPARTMENT_DATA:-true}
    export INIT_SERVICE_DATA=${INIT_SERVICE_DATA:-true}
    export INIT_PERMISSIONS=${INIT_PERMISSIONS:-true}
    export INIT_EMAIL_TEMPLATES=${INIT_EMAIL_TEMPLATES:-true}
    export INTERACTIVE_ADMIN=${INTERACTIVE_ADMIN:-false}
    export START_SERVER=${START_SERVER:-true}
    
    # Variables de Redis (nuevas)
    export REDIS_ENABLED=${REDIS_ENABLED:-true}
    export REDIS_HOST=${REDIS_HOST:-redis}
    export REDIS_PORT=${REDIS_PORT:-6379}
    export REDIS_DB=${REDIS_DB:-0}
    export RATE_LIMIT_ENABLED=${RATE_LIMIT_ENABLED:-true}
    export TOKEN_BLACKLIST_ENABLED=${TOKEN_BLACKLIST_ENABLED:-true}
    export CACHE_ENABLED=${CACHE_ENABLED:-true}
    
    # Variables generales
    export ENVIRONMENT=${ENVIRONMENT:-development}
    export DEBUG=${DEBUG:-false}
    
    # Crear directorio para flags si no existe
    mkdir -p /app/data
    mkdir -p /app/logs
    
    log "✅ Variables configuradas"
    info "Entorno: $ENVIRONMENT"
    info "Redis habilitado: $REDIS_ENABLED"
    info "Rate limiting: $RATE_LIMIT_ENABLED"
    info "Token blacklist: $TOKEN_BLACKLIST_ENABLED"
}

# ===============================================
# INICIALIZACIÓN DE REDIS
# ===============================================

init_redis() {
    if [ "$REDIS_ENABLED" = "true" ]; then
        log "🚀 Inicializando Redis..."
        
        # Verificar si el script de inicialización existe
        if [ -f "/app/scripts/init_redis.py" ]; then
            if timeout 30 python /app/scripts/init_redis.py; then
                log "✅ Redis inicializado correctamente"
            else
                warn "⚠️ Problemas inicializando Redis (continuando)"
            fi
        else
            warn "⚠️ Script de inicialización de Redis no encontrado"
        fi
    else
        info "⏭️ Inicialización de Redis saltada (deshabilitada)"
    fi
}

# ===============================================
# INICIALIZACIÓN DE BASE DE DATOS
# ===============================================

run_migrations() {
    log "🔄 Ejecutando migraciones..."
    timeout 60 python -m alembic upgrade head
    log "✅ Migraciones completadas"
}

init_base_structure() {
    local flag="/app/data/.base_structure_initialized"
    
    if [ "$INIT_BASE_STRUCTURE" = "true" ] && [ ! -f "$flag" ]; then
        log "🏗️ Inicializando estructura base..."
        if [ -f "/app/scripts/init_base_structure.py" ]; then
            timeout 60 python /app/scripts/init_base_structure.py
            touch "$flag"
            log "✅ Estructura base inicializada"
        else
            warn "⚠️ No se encontró script de inicialización de estructura base"
        fi
    else
        info "⏭️ Estructura base ya inicializada o desactivada"
    fi
}

init_permissions() {
    local flag="/app/data/.permissions_initialized"
    
    if [ "$INIT_PERMISSIONS" = "true" ] && [ ! -f "$flag" ]; then
        log "🔐 Inicializando permisos extendidos..."
        if [ -f "/app/scripts/add_permissions.py" ]; then
            timeout 60 python /app/scripts/add_permissions.py
            touch "$flag"
            log "✅ Permisos inicializados"
        else
            warn "⚠️ No se encontró script de inicialización de permisos"
        fi
    else
        info "⏭️ Permisos ya inicializados o desactivados"
    fi
}

init_department_data() {
    local flag="/app/data/.department_data_initialized"
    
    if [ "$INIT_DEPARTMENT_DATA" = "true" ] && [ ! -f "$flag" ]; then
        log "🏢 Inicializando datos de departamentos..."
        if [ -f "/app/scripts/init_department_data.py" ]; then
            timeout 60 python /app/scripts/init_department_data.py
            touch "$flag"
            log "✅ Datos de departamentos inicializados"
        else
            warn "⚠️ No se encontró script de inicialización de departamentos"
        fi
    else
        info "⏭️ Datos de departamentos ya inicializados o desactivados"
    fi
}

init_service_data() {
    local flag="/app/data/.service_data_initialized"
    
    if [ "$INIT_SERVICE_DATA" = "true" ] && [ ! -f "$flag" ]; then
        log "⚙️ Inicializando datos de servicios..."
        if [ -f "/app/scripts/init_services_data.py" ]; then
            timeout 60 python /app/scripts/init_services_data.py
            touch "$flag"
            log "✅ Datos de servicios inicializados"
        else
            warn "⚠️ No se encontró script de inicialización de servicios"
        fi
    else
        info "⏭️ Datos de servicios ya inicializados o desactivados"
    fi
}

init_email_templates() {
    local flag="/app/data/.email_templates_initialized"
    
    if [ "$INIT_EMAIL_TEMPLATES" = "true" ] && [ ! -f "$flag" ]; then
        log "📧 Inicializando plantillas de correo..."
        if [ -f "/app/scripts/init_email_templates.py" ]; then
            timeout 60 python /app/scripts/init_email_templates.py
            touch "$flag"
            log "✅ Plantillas de correo inicializadas"
        else
            warn "⚠️ No se encontró script de inicialización de plantillas de correo"
        fi
    else
        info "⏭️ Plantillas de correo ya inicializadas o desactivadas"
    fi
}

interactive_admin_setup() {
    local flag="/app/data/.interactive_admin_initialized"
    
    if [ "$INTERACTIVE_ADMIN" = "true" ] && [ ! -f "$flag" ]; then
        log "👤 Iniciando configuración interactiva de administrador..."
        if [ -f "/app/scripts/interactive_admin_setup.py" ]; then
            timeout 120 python /app/scripts/interactive_admin_setup.py
            touch "$flag"
            log "✅ Configuración de administrador completada"
        else
            warn "⚠️ No se encontró script de configuración interactiva de administrador"
        fi
    else
        info "⏭️ Configuración interactiva de administrador ya realizada o desactivada"
    fi
}

# ===============================================
# FUNCIÓN PRINCIPAL
# ===============================================

main() {
    log "🚀 Iniciando MediaLab Backend con Redis integrado"
    log "=================================================================="
    
    # 1. Configurar entorno
    setup_environment
    
    # 2. Mostrar configuración
    log "📋 Configuración de inicialización:"
    info "  • Estructura base: $INIT_BASE_STRUCTURE"
    info "  • Datos de departamentos: $INIT_DEPARTMENT_DATA"
    info "  • Datos de servicios: $INIT_SERVICE_DATA"
    info "  • Permisos extendidos: $INIT_PERMISSIONS"
    info "  • Plantillas de correo: $INIT_EMAIL_TEMPLATES"
    info "  • Admin interactivo: $INTERACTIVE_ADMIN"
    info "  • Redis habilitado: $REDIS_ENABLED"
    info "  • Iniciar servidor: $START_SERVER"
    
    # 3. Esperar servicios externos
    log "⏳ Esperando servicios externos..."
    
    # Usar funciones con timeout y mejor manejo de errores
    if ! wait_for_mysql; then
        error "❌ No se pudo conectar a MySQL"
        exit 1
    fi
    
    wait_for_redis  # Redis puede fallar sin detener el proceso
    
    # 4. Ejecutar migraciones con timeout
    log "🔄 Ejecutando migraciones de base de datos..."
    if ! run_migrations; then
        error "❌ Error ejecutando migraciones"
        exit 1
    fi
    
    # 5. Inicializar Redis con timeout
    log "🔧 Configurando Redis..."
    init_redis
    
    # 6. Inicializar estructura de datos con timeouts
    log "🏗️ Inicializando estructura de datos..."
    init_base_structure
    init_permissions
    init_department_data
    init_service_data
    init_email_templates
    
    # 7. Configuración interactiva
    if [ "$INTERACTIVE_ADMIN" = "true" ]; then
        log "👤 Configuración interactiva..."
        interactive_admin_setup
    fi
    
    # 8. Verificar sistema
    log "🔍 Verificando sistemas..."
    
    # Verificar archivos críticos
    critical_files=(
        "/app/app/main.py"
        "/app/alembic.ini"
    )
    
    for file in "${critical_files[@]}"; do
        if [ ! -f "$file" ]; then
            error "❌ Archivo crítico no encontrado: $file"
            exit 1
        fi
    done
    
    log "✅ Todos los archivos críticos encontrados"
    
    # 9. Información del sistema
    log "📊 Información del sistema:"
    info "  • Python: $(python --version)"
    info "  • Directorio: $(pwd)"
    info "  • Usuario: $(whoami)"
    info "  • Entorno: $ENVIRONMENT"
    
    # 10. Resumen de servicios con verificación robusta
    log "🔍 Estado de servicios:"
    if timeout 3 nc -z db 3306 >/dev/null 2>&1; then
        info "  • MySQL: ✅ Disponible"
    else
        warn "  • MySQL: ⚠️ Problema de conectividad detectado"
    fi
    
    if [ "$REDIS_ENABLED" = "true" ]; then
        if timeout 3 nc -z "${REDIS_HOST:-redis}" "${REDIS_PORT:-6379}" >/dev/null 2>&1; then
            info "  • Redis: ✅ Disponible"
        else
            info "  • Redis: ⚠️ No disponible (funcionalidad limitada)"
        fi
    else
        info "  • Redis: ⏭️ Deshabilitado"
    fi
    
    log "=================================================================="
    log "✅ Inicialización completada exitosamente"
    
    # 11. Iniciar aplicación
    if [ "$START_SERVER" = "true" ]; then
        log "🚀 Iniciando servidor FastAPI..."
        log "=================================================================="
        
        if [ "$ENVIRONMENT" = "development" ]; then
            log "🔧 Modo desarrollo - recarga automática habilitada"
            exec uvicorn app.main:app \
                --host 0.0.0.0 \
                --port 8000 \
                --reload \
                --reload-dir /app/app \
                --log-level debug \
                --access-log
        else
            log "🚀 Modo producción - optimizado para performance"
            exec uvicorn app.main:app \
                --host 0.0.0.0 \
                --port 8000 \
                --workers 4 \
                --log-level info \
                --access-log \
                --loop asyncio
        fi
    else
        log "⏹️ Configuración completada. No se iniciará el servidor."
        log "=================================================================="
        exit 0
    fi
}

# ===============================================
# MANEJO DE ERRORES MEJORADO
# ===============================================

cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        error "❌ Script terminado con código de error $exit_code"
        
        # Información de debug en caso de error
        error "🔍 Información de debug:"
        error "  • PWD: $(pwd)"
        error "  • USER: $(whoami)"
        error "  • ENVIRONMENT: ${ENVIRONMENT:-'no definido'}"
        error "  • REDIS_ENABLED: ${REDIS_ENABLED:-'no definido'}"
        
        # Verificar servicios con timeout
        if timeout 3 nc -z db 3306 >/dev/null 2>&1; then
            error "  • MySQL: ✅ Disponible"
        else
            error "  • MySQL: ❌ No disponible"
        fi
        
        if [ "$REDIS_ENABLED" = "true" ]; then
            if timeout 3 nc -z "${REDIS_HOST:-redis}" "${REDIS_PORT:-6379}" >/dev/null 2>&1; then
                error "  • Redis: ✅ Disponible"
            else
                error "  • Redis: ❌ No disponible"
            fi
        fi
    fi
    exit $exit_code
}

# Configurar trap para cleanup
trap cleanup EXIT

# Ejecutar función principal
main "$@"