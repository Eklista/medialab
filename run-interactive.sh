#!/bin/bash
# run-interactive.sh - Script para ejecutar la configuración interactiva

echo "==== MediaLab - Configuración Interactiva ===="
echo "Este script ejecutará el contenedor backend en modo interactivo"
echo "para configurar un administrador personalizado."
echo

# Verificar si el contenedor de la base de datos está en ejecución
if ! docker ps | grep -q medialab-db; then
    echo "No se detectó el contenedor de base de datos en ejecución."
    echo "Iniciando la base de datos..."
    
    # Usar docker-compose para iniciar solo la base de datos
    docker-compose up -d db
    
    # Esperar a que la base de datos esté lista
    echo "Esperando a que la base de datos esté lista..."
    sleep 20
fi

# Detener el backend si está en ejecución
if docker ps | grep -q medialab-backend; then
    echo "Deteniendo contenedor backend existente..."
    docker-compose stop backend
fi

# Eliminar flags de inicialización previos si existen
echo "¿Quieres borrar las marcas de inicialización previas? (Útil si hubo errores) (s/n)"
read reset_flags
if [[ "$reset_flags" == "s" || "$reset_flags" == "S" || "$reset_flags" == "y" || "$reset_flags" == "Y" ]]; then
    echo "Eliminando marcas de inicialización..."
    docker run --rm -v medialab_backend_data:/data alpine sh -c "rm -f /data/.base_structure_initialized /data/.department_data_initialized /data/.service_data_initialized /data/.permissions_initialized /data/.email_templates_initialized /data/.interactive_admin_initialized"
fi

# Seleccionar qué inicializar
echo
echo "Selecciona qué datos inicializar:"
echo "1. Todo (estructura base + permisos + departamentos + servicios + plantillas de correo + administrador interactivo)"
echo "2. Solo estructura base, permisos, departamentos, servicios y plantillas de correo"
echo "3. Solo estructura base, permisos, servicios, plantillas de correo y administrador interactivo"
echo "4. Solo estructura base, permisos, departamentos y plantillas de correo"
echo "5. Solo estructura base, permisos, plantillas de correo y administrador interactivo"
echo "6. Solo estructura base, permisos, servicios y plantillas de correo"
echo "7. Solo permisos (si ya existe estructura base)"
echo "8. Solo administrador interactivo (si ya existe estructura base)"
echo "9. Solo administrador interactivo y permisos (si ya existe estructura base)"
echo "10. Solo plantillas de correo (si ya existe estructura base)"
echo
read -p "Opción (1-10): " init_option

# Configurar variables según la opción seleccionada
case $init_option in
    1)
        INIT_BASE_STRUCTURE=true
        INIT_PERMISSIONS=true
        INIT_DEPARTMENT_DATA=true
        INIT_SERVICE_DATA=true
        INIT_EMAIL_TEMPLATES=true
        INTERACTIVE_ADMIN=true
        ;;
    2)
        INIT_BASE_STRUCTURE=true
        INIT_PERMISSIONS=true
        INIT_DEPARTMENT_DATA=true
        INIT_SERVICE_DATA=true
        INIT_EMAIL_TEMPLATES=true
        INTERACTIVE_ADMIN=false
        ;;
    3)
        INIT_BASE_STRUCTURE=true
        INIT_PERMISSIONS=true
        INIT_DEPARTMENT_DATA=false
        INIT_SERVICE_DATA=true
        INIT_EMAIL_TEMPLATES=true
        INTERACTIVE_ADMIN=true
        ;;
    4)
        INIT_BASE_STRUCTURE=true
        INIT_PERMISSIONS=true
        INIT_DEPARTMENT_DATA=true
        INIT_SERVICE_DATA=false
        INIT_EMAIL_TEMPLATES=true
        INTERACTIVE_ADMIN=false
        ;;
    5)
        INIT_BASE_STRUCTURE=true
        INIT_PERMISSIONS=true
        INIT_DEPARTMENT_DATA=false
        INIT_SERVICE_DATA=false
        INIT_EMAIL_TEMPLATES=true
        INTERACTIVE_ADMIN=true
        ;;
    6)
        INIT_BASE_STRUCTURE=true
        INIT_PERMISSIONS=true
        INIT_DEPARTMENT_DATA=false
        INIT_SERVICE_DATA=true
        INIT_EMAIL_TEMPLATES=true
        INTERACTIVE_ADMIN=false
        ;;
    7)
        INIT_BASE_STRUCTURE=false
        INIT_PERMISSIONS=true
        INIT_DEPARTMENT_DATA=false
        INIT_SERVICE_DATA=false
        INIT_EMAIL_TEMPLATES=false
        INTERACTIVE_ADMIN=false
        ;;
    8)
        INIT_BASE_STRUCTURE=false
        INIT_PERMISSIONS=false
        INIT_DEPARTMENT_DATA=false
        INIT_SERVICE_DATA=false
        INIT_EMAIL_TEMPLATES=false
        INTERACTIVE_ADMIN=true
        ;;
    9)
        INIT_BASE_STRUCTURE=false
        INIT_PERMISSIONS=true
        INIT_DEPARTMENT_DATA=false
        INIT_SERVICE_DATA=false
        INIT_EMAIL_TEMPLATES=false
        INTERACTIVE_ADMIN=true
        ;;
    10)
        INIT_BASE_STRUCTURE=false
        INIT_PERMISSIONS=false
        INIT_DEPARTMENT_DATA=false
        INIT_SERVICE_DATA=false
        INIT_EMAIL_TEMPLATES=true
        INTERACTIVE_ADMIN=false
        ;;
    *)
        echo "Opción no válida. Usando configuración por defecto (todo)."
        INIT_BASE_STRUCTURE=true
        INIT_PERMISSIONS=true
        INIT_DEPARTMENT_DATA=true
        INIT_SERVICE_DATA=true
        INIT_EMAIL_TEMPLATES=true
        INTERACTIVE_ADMIN=true
        ;;
esac

# Construir el contenedor backend con docker-compose
echo "Construyendo imagen backend..."
docker-compose build backend

# Iniciar backend con las variables adecuadas en modo interactivo
# Pasamos START_SERVER=false para evitar que inicie el servidor
echo "Iniciando backend en modo interactivo..."
docker-compose run --rm \
    -e INIT_BASE_STRUCTURE=$INIT_BASE_STRUCTURE \
    -e INIT_PERMISSIONS=$INIT_PERMISSIONS \
    -e INIT_DEPARTMENT_DATA=$INIT_DEPARTMENT_DATA \
    -e INIT_SERVICE_DATA=$INIT_SERVICE_DATA \
    -e INIT_EMAIL_TEMPLATES=$INIT_EMAIL_TEMPLATES \
    -e INTERACTIVE_ADMIN=$INTERACTIVE_ADMIN \
    -e START_SERVER=false \
    backend

echo
echo "Configuración interactiva completada."
echo "Para continuar con el funcionamiento normal, ejecuta:"
echo "docker-compose up -d"