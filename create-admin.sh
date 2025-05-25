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

# Verificar que la aplicación esté corriendo
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
if ! curl -s --max-time 5 "https://localhost/api/v1/health" > /dev/null; then
    echo -e "${RED}❌ El backend no responde en https://localhost${NC}"
    echo -e "${YELLOW}Revisando logs del backend:${NC}"
    docker compose logs backend --tail=10
    exit 1
fi

echo -e "${GREEN}✅ Servicios verificados${NC}"

# Crear usuario admin
echo -e "${YELLOW}👤 Creando usuario administrador...${NC}"

# Ejecutar script de creación de admin - CORREGIDO con asignación de rol
ENV_FILE=.env.prod docker compose exec backend python -c "
import sys
sys.path.append('/app')

from app.database import SessionLocal
from app.models.auth.users import User
from app.models.auth.roles import Role
from app.models.associations import user_roles
from app.config.security import get_password_hash
from app.models.organization.areas import Area
from sqlalchemy import insert
from datetime import date, datetime

db = SessionLocal()
try:
    # Buscar o crear rol admin
    admin_role = db.query(Role).filter(Role.name == 'ADMIN').first()
    if not admin_role:
        admin_role = Role(name='ADMIN', description='Administrador del sistema')
        db.add(admin_role)
        db.commit()
        db.refresh(admin_role)
        print('✅ Rol admin creado')
    else:
        print('✅ Rol admin encontrado')
    
    # Buscar o crear área por defecto (Dirección para admin)
    admin_area = db.query(Area).filter(Area.name == 'Dirección').first()
    if not admin_area:
        admin_area = Area(name='Dirección', description='Área de dirección administrativa')
        db.add(admin_area)
        db.commit()
        db.refresh(admin_area)
        print('✅ Área de Dirección creada')
    else:
        print('✅ Área de Dirección encontrada')
    
    # Datos del admin
    email = 'admin@medialab.com'
    username = 'admin'
    password = 'MediaLab2025!'
    
    # Verificar si ya existe
    existing_user = db.query(User).filter(User.email == email).first()
    
    if existing_user:
        existing_user.password_hash = get_password_hash(password)
        existing_user.is_active = True
        db.commit()
        db.refresh(existing_user)
        user_id = existing_user.id
        print('✅ Usuario admin actualizado')
    else:
        new_user = User(
            email=email,
            username=username,
            password_hash=get_password_hash(password),
            first_name='Administrador',
            last_name='MediaLab',
            is_active=True,
            join_date=date.today()
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user_id = new_user.id
        print('✅ Usuario admin creado')
    
    # IMPORTANTE: Asignar rol admin al usuario
    # Eliminar roles anteriores si existen
    db.execute(
        'DELETE FROM user_roles WHERE user_id = :user_id',
        {'user_id': user_id}
    )
    
    # Insertar nueva asignación de rol
    db.execute(
        insert(user_roles).values(
            user_id=user_id,
            role_id=admin_role.id,
            area_id=admin_area.id,
            assigned_at=datetime.utcnow()
        )
    )
    
    db.commit()
    print('✅ Rol admin asignado al usuario')
    
    print(f'📧 Email: {email}')
    print(f'👤 Username: {username}')
    print(f'🔐 Password: {password}')
    print(f'🎭 Rol: {admin_role.name} (ADMIN)')
    print(f'🏢 Área: {admin_area.name}')
    
finally:
    db.close()
"

echo -e "\n${GREEN}✅ Script completado${NC}"

# Mostrar información útil
echo -e "\n${YELLOW}📝 Información útil:${NC}"
echo -e "${YELLOW}   🌐 Frontend: https://medialab.eklista.com/${NC}"
echo -e "${YELLOW}   📊 API Docs: https://medialab.eklista.com/api/v1/docs${NC}"
echo -e "${YELLOW}   🔍 Health: https://medialab.eklista.com/api/v1/health${NC}"

echo -e "\n${YELLOW}🔑 Credenciales de administrador:${NC}"
echo -e "${YELLOW}   📧 Email: admin@medialab.com${NC}"
echo -e "${YELLOW}   🔐 Password: MediaLab2025!${NC}"
echo -e "${YELLOW}   🎭 Rol: ADMIN${NC}"

echo -e "\n${YELLOW}🛠️ Comandos útiles:${NC}"
echo -e "${YELLOW}   Ver logs: docker compose logs -f backend${NC}"
echo -e "${YELLOW}   Estado: docker compose ps${NC}"
echo -e "${YELLOW}   Reiniciar: docker compose restart backend${NC}"