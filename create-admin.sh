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
    PROFILE="prod"
    echo -e "${YELLOW}🚀 Modo: PRODUCCIÓN${NC}"
elif [ -f ".env.dev" ]; then
    ENV_FILE=".env.dev"
    PROFILE="dev"
    echo -e "${YELLOW}🛠️ Modo: DESARROLLO${NC}"
else
    echo -e "${RED}No se encontró .env.prod o .env.dev${NC}"
    exit 1
fi

# Verificar que la aplicación esté corriendo
echo -e "${YELLOW}📋 Verificando servicios...${NC}"
if ! docker compose ps | grep -q "Up.*backend"; then
    echo -e "${RED}❌ El backend no está corriendo${NC}"
    echo -e "${YELLOW}Inicia la aplicación primero:${NC}"
    echo -e "${BLUE}  ENV_FILE=$ENV_FILE docker compose --profile $PROFILE up -d${NC}"
    exit 1
fi

if ! docker compose ps | grep -q "Up.*db"; then
    echo -e "${RED}❌ La base de datos no está corriendo${NC}"
    echo -e "${YELLOW}Inicia la aplicación primero${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Servicios verificados${NC}"

# Crear usuario admin
echo -e "${YELLOW}👤 Creando usuario administrador...${NC}"
echo -e "${YELLOW}Este script solo creará el usuario, la estructura ya debe existir${NC}"

# Ejecutar script de creación de admin
ENV_FILE="$ENV_FILE" docker compose exec backend python -c "
import sys
sys.path.append('/app')

from app.database import SessionLocal
from app.models import User, Role
from app.core.security import get_password_hash
import getpass

# Función para input seguro
def secure_input(prompt):
    try:
        return input(prompt)
    except KeyboardInterrupt:
        print('\n❌ Operación cancelada')
        sys.exit(1)

def secure_password(prompt):
    try:
        return getpass.getpass(prompt)
    except KeyboardInterrupt:
        print('\n❌ Operación cancelada')
        sys.exit(1)

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
            return False
        
        print(f'✅ Rol admin encontrado (ID: {admin_role.id})')
        
        # Solicitar datos del usuario
        print('\\n📝 Ingresa los datos del administrador:')
        
        # Email
        while True:
            email = secure_input('📧 Email: ').strip()
            if not email:
                print('❌ El email es obligatorio')
                continue
            if '@' not in email:
                print('❌ Email inválido')
                continue
            
            # Verificar si ya existe
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                print(f'⚠️ Ya existe un usuario con email: {email}')
                response = secure_input('¿Continuar? (s/N): ').lower()
                if response != 's':
                    continue
                else:
                    print('✅ Actualizando usuario existente')
                    break
            break
        
        # Nombre completo
        full_name = secure_input('👤 Nombre completo: ').strip()
        if not full_name:
            full_name = 'Administrador'
        
        # Contraseña
        while True:
            password = secure_password('🔐 Contraseña: ')
            if len(password) < 6:
                print('❌ La contraseña debe tener al menos 6 caracteres')
                continue
            
            password_confirm = secure_password('🔐 Confirmar contraseña: ')
            if password != password_confirm:
                print('❌ Las contraseñas no coinciden')
                continue
            break
        
        # Crear o actualizar usuario
        existing_user = db.query(User).filter(User.email == email).first()
        
        if existing_user:
            # Actualizar usuario existente
            existing_user.full_name = full_name
            existing_user.hashed_password = get_password_hash(password)
            existing_user.is_active = True
            existing_user.role_id = admin_role.id
            
            db.commit()
            print(f'\\n✅ Usuario actualizado exitosamente:')
            print(f'   📧 Email: {email}')
            print(f'   👤 Nombre: {full_name}')
            print(f'   🔐 Rol: admin')
            print(f'   ✅ Estado: activo')
            
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
            
            print(f'\\n✅ Usuario creado exitosamente:')
            print(f'   📧 Email: {email}')
            print(f'   👤 Nombre: {full_name}')
            print(f'   🔐 Rol: admin')
            print(f'   ✅ Estado: activo')
        
        return True
        
    except Exception as e:
        print(f'❌ Error: {e}')
        return False
    finally:
        db.close()

if __name__ == '__main__':
    if main():
        print('\\n🎉 ¡Administrador configurado correctamente!')
        print('\\nPuedes acceder con estas credenciales a:')
        if '$PROFILE' == 'prod':
            print('   🌐 https://medialab.eklista.com/ml-admin/login')
        else:
            print('   🌐 http://localhost:5173/ml-admin/login')
    else:
        print('\\n❌ Error al configurar el administrador')
        sys.exit(1)
"

echo -e "\n${GREEN}✅ Script completado${NC}"

# Mostrar información útil
echo -e "\n${YELLOW}📝 Información útil:${NC}"
if [ "$PROFILE" = "prod" ]; then
    echo -e "${YELLOW}   🌐 Login: https://medialab.eklista.com/ml-admin/login${NC}"
    echo -e "${YELLOW}   📊 API: https://medialab.eklista.com/api/v1/docs${NC}"
else
    echo -e "${YELLOW}   🌐 Login: http://localhost:5173/ml-admin/login${NC}"
    echo -e "${YELLOW}   📊 API: http://localhost:8000/api/v1/docs${NC}"
fi

echo -e "\n${YELLOW}🛠️ Comandos útiles:${NC}"
echo -e "${YELLOW}   Ver logs: docker compose logs -f backend${NC}"
echo -e "${YELLOW}   Estado: docker compose ps${NC}"