#!/bin/bash
# create-admin.sh - Script simple para crear usuario administrador
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}    CREAR ADMINISTRADOR MEDIALAB    ${NC}"
echo -e "${BLUE}====================================${NC}"

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: docker-compose.yml no encontrado${NC}"
    exit 1
fi

# Determinar entorno
if [ -f ".env.prod" ]; then
    ENV_FILE=".env.prod"
    echo -e "${YELLOW}🚀 Modo: PRODUCCIÓN${NC}"
elif [ -f ".env.dev" ]; then
    ENV_FILE=".env.dev"
    echo -e "${YELLOW}🛠️ Modo: DESARROLLO${NC}"
else
    echo -e "${RED}No se encontró .env.prod o .env.dev${NC}"
    exit 1
fi

# Verificar que la aplicación esté corriendo - CORREGIDO
echo -e "${YELLOW}📋 Verificando servicios...${NC}"

# Verificar backend de manera más robusta
if ! docker compose ps --format=table | grep -q "backend.*Up"; then
    echo -e "${RED}❌ El backend no está corriendo${NC}"
    echo -e "${YELLOW}Estado actual de los contenedores:${NC}"
    docker compose ps
    echo -e "${YELLOW}Inicia la aplicación primero:${NC}"
    echo -e "${BLUE}  ENV_FILE=$ENV_FILE docker compose up -d${NC}"
    exit 1
fi

# Verificar base de datos
if ! docker compose ps --format=table | grep -q "db.*Up"; then
    echo -e "${RED}❌ La base de datos no está corriendo${NC}"
    echo -e "${YELLOW}Inicia la aplicación primero${NC}"
    exit 1
fi

# Verificar que el backend responda
echo -e "${YELLOW}🔍 Verificando conectividad del backend...${NC}"
if ! curl -s --max-time 5 "http://localhost:8000/api/v1/health" > /dev/null; then
    echo -e "${RED}❌ El backend no responde en http://localhost:8000${NC}"
    echo -e "${YELLOW}Revisando logs del backend:${NC}"
    docker compose logs backend --tail=10
    exit 1
fi

echo -e "${GREEN}✅ Servicios verificados${NC}"

# Crear usuario admin
echo -e "${YELLOW}👤 Creando usuario administrador...${NC}"
echo -e "${YELLOW}Este script solo creará el usuario, la estructura ya debe existir${NC}"

# Ejecutar script de creación de admin - SIN PERFIL
ENV_FILE="$ENV_FILE" docker compose exec -T backend python -c "
import sys
sys.path.append('/app')

from app.database import SessionLocal
from app.models import User, Role
from app.core.security import get_password_hash
import os

def main():
    print('\\n🔧 Configuración de usuario administrador')
    print('=' * 50)
    
    # Conectar a la base de datos
    db = SessionLocal()
    
    try:
        # Verificar que exista el rol admin
        admin_role = db.query(Role).filter(Role.name == 'admin').first()
        if not admin_role:
            print('❌ Error: No existe el rol admin en la base de datos')
            print('La estructura base debe crearse primero')
            
            # Intentar crear el rol admin básico
            print('🔧 Creando rol admin...')
            from app.core.init_db import init_roles
            init_roles(db)
            admin_role = db.query(Role).filter(Role.name == 'admin').first()
            
            if not admin_role:
                print('❌ No se pudo crear el rol admin')
                return False
        
        print(f'✅ Rol admin encontrado (ID: {admin_role.id})')
        
        # Datos predeterminados para modo no interactivo
        email = os.getenv('ADMIN_EMAIL', 'admin@medialab.com')
        full_name = os.getenv('ADMIN_NAME', 'Administrador MediaLab')
        password = os.getenv('ADMIN_PASSWORD', 'MediaLab2025!')
        
        print(f'📧 Email: {email}')
        print(f'👤 Nombre: {full_name}')
        print('🔐 Contraseña: [configurada]')
        
        # Verificar si ya existe
        existing_user = db.query(User).filter(User.email == email).first()
        
        if existing_user:
            # Actualizar usuario existente
            existing_user.full_name = full_name
            existing_user.hashed_password = get_password_hash(password)
            existing_user.is_active = True
            existing_user.role_id = admin_role.id
            
            db.commit()
            print(f'\\n✅ Usuario ACTUALIZADO exitosamente:')
            
        else:
            # Crear nuevo usuario
            new_user = User(
                email=email,
                full_name=full_name,
                hashed_password=get_password_hash(password),
                is_active=True,
                role_id=admin_role.id
            )
            
            db.add(new_user)
            db.commit()
            
            print(f'\\n✅ Usuario CREADO exitosamente:')
        
        print(f'   📧 Email: {email}')
        print(f'   👤 Nombre: {full_name}')
        print(f'   🔐 Rol: admin')
        print(f'   ✅ Estado: activo')
        
        return True
        
    except Exception as e:
        print(f'❌ Error: {e}')
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == '__main__':
    if main():
        print('\\n🎉 ¡Administrador configurado correctamente!')
        print('\\nCredenciales por defecto:')
        print('   📧 Email: admin@medialab.com')
        print('   🔐 Password: MediaLab2025!')
        print('\\nPuedes cambiar estas credenciales desde el panel admin')
    else:
        print('\\n❌ Error al configurar el administrador')
        sys.exit(1)
"

echo -e "\n${GREEN}✅ Script completado${NC}"

# Mostrar información útil
echo -e "\n${YELLOW}📝 Información útil:${NC}"
echo -e "${YELLOW}   🌐 Frontend: http://medialab.eklista.com/${NC}"
echo -e "${YELLOW}   📊 API Docs: http://medialab.eklista.com/api/v1/docs${NC}"
echo -e "${YELLOW}   🔍 Health: http://medialab.eklista.com/api/v1/health${NC}"

echo -e "\n${YELLOW}🔑 Credenciales por defecto:${NC}"
echo -e "${YELLOW}   📧 Email: admin@medialab.com${NC}"
echo -e "${YELLOW}   🔐 Password: MediaLab2025!${NC}"

echo -e "\n${YELLOW}🛠️ Comandos útiles:${NC}"
echo -e "${YELLOW}   Ver logs: docker compose logs -f backend${NC}"
echo -e "${YELLOW}   Estado: docker compose ps${NC}"
echo -e "${YELLOW}   Reiniciar: docker compose restart backend${NC}"