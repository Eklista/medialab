#!/usr/bin/env python3
"""
Script para generar claves de seguridad y configurar el entorno de forma segura
"""

import secrets
import os
from cryptography.fernet import Fernet
from pathlib import Path

def generate_secret_key(length: int = 32) -> str:
    """Genera una clave secreta segura"""
    return secrets.token_urlsafe(length)

def generate_encryption_key() -> str:
    """Genera una clave de encriptación Fernet"""
    return Fernet.generate_key().decode()

def generate_password_salt() -> str:
    """Genera un salt para contraseñas"""
    return f"MediaLab2025${secrets.token_hex(8)}$Secure"

def update_env_file(file_path: str, updates: dict):
    """Actualiza un archivo .env con nuevos valores"""
    if not os.path.exists(file_path):
        print(f"⚠️  Archivo {file_path} no encontrado")
        return False
    
    # Leer archivo actual
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    # Actualizar líneas
    updated_lines = []
    for line in lines:
        line_updated = False
        for key, new_value in updates.items():
            if line.startswith(f"{key}="):
                updated_lines.append(f"{key}={new_value}\n")
                line_updated = True
                break
        
        if not line_updated:
            updated_lines.append(line)
    
    # Escribir archivo actualizado
    with open(file_path, 'w') as f:
        f.writelines(updated_lines)
    
    print(f"✅ Archivo {file_path} actualizado")
    return True

def main():
    print("🔐 CONFIGURACIÓN DE SEGURIDAD MEDIALAB")
    print("=" * 50)
    
    # Generar claves seguras
    secret_key = generate_secret_key()
    encryption_key = generate_encryption_key()
    password_salt = generate_password_salt()
    
    print("🔑 Claves generadas:")
    print(f"SECRET_KEY: {secret_key[:20]}...")
    print(f"ENCRYPTION_KEY: {encryption_key[:20]}...")
    print(f"PASSWORD_SALT: {password_salt}")
    print()
    
    # Rutas de archivos .env
    backend_env = ".env.dev"
    docker_env = ".env.dev"
    
    # Actualizaciones para desarrollo (.env.dev)
    dev_updates = {
        "SECRET_KEY": f"dev-{secret_key}",
        "ENCRYPTION_KEY": f"dev-{encryption_key}",
        "PASSWORD_SALT": f"Dev-{password_salt}",
        "ACCESS_TOKEN_EXPIRE_MINUTES": "30",
        "RATE_LIMIT_LOGIN_ATTEMPTS": "10",
        "TOKEN_BLACKLIST_ENABLED": "true",
        "SECURITY_HEADERS_ENABLED": "true"
    }

    prod_updates = dev_updates
    
    # Actualizar archivos
    if update_env_file(backend_env, dev_updates):
        print(f"✅ Configuración actualizada: {backend_env}")
    
    print()
    print("🚨 INSTRUCCIONES IMPORTANTES:")
    print("1. Las claves han sido generadas automáticamente")
    print("2. NUNCA subas archivos .env a Git")
    print("3. Reinicia los contenedores Docker:")
    print("   docker-compose down && docker-compose up --build")
    print("4. En producción, guarda las claves en un gestor seguro")
    print("5. Rota las claves cada 90 días")
    
    # Crear archivo de backup de claves
    backup_file = f"security_keys_backup_{secrets.token_hex(4)}.txt"
    with open(backup_file, 'w') as f:
        f.write("MEDIALAB SECURITY KEYS BACKUP\n")
        f.write("=" * 40 + "\n\n")
        f.write(f"SECRET_KEY={secret_key}\n")
        f.write(f"ENCRYPTION_KEY={encryption_key}\n")
        f.write(f"PASSWORD_SALT={password_salt}\n")
        f.write(f"\nFecha de generación: {os.system('date')}\n")
        f.write("\n⚠️  MANTENER ESTE ARCHIVO SEGURO Y PRIVADO\n")
    
    print(f"\n💾 Backup de claves guardado en: {backup_file}")
    print("   (Muévelo a un lugar seguro y elimínalo del proyecto)")

if __name__ == "__main__":
    main()