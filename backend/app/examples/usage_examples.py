"""
Este archivo proporciona ejemplos de cómo usar las APIs de la aplicación
con la nueva estructura arquitectónica.
"""

import asyncio
import httpx
import json
from typing import Dict, List, Any

# Definimos la URL base de la API
BASE_URL = "http://localhost:8000/api/v1"

# Función para manejar errores de respuesta
def handle_response_error(response: httpx.Response) -> None:
    """Muestra información detallada sobre errores en respuestas HTTP"""
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {response.headers}")
    try:
        print(f"Error Detail: {response.json()}")
    except:
        print(f"Error Content: {response.text}")
    response.raise_for_status()

# Ejemplos de uso de la API de Auth
async def auth_examples() -> Dict[str, str]:
    """Ejemplos de autenticación y gestión de contraseñas"""
    async with httpx.AsyncClient() as client:
        # Login
        print("\n--- Ejemplo: Login ---")
        login_data = {
            "username": "pablo@prueba.com",  # Username es realmente el email en la API
            "password": "Admin123"
        }
        
        response = await client.post(
            f"{BASE_URL}/auth/login",
            data=login_data  # Usar data en lugar de json debido a OAuth2 form
        )
        
        if response.status_code != 200:
            handle_response_error(response)
            
        token_data = response.json()
        print(f"Token obtenido: {token_data['access_token'][:20]}...")
        
        # Guardar tokens para otras solicitudes
        access_token = token_data["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Verificar contraseña
        print("\n--- Ejemplo: Verificar contraseña ---")
        verify_data = {"password": "Admin123"}
        
        response = await client.post(
            f"{BASE_URL}/auth/verify-password",
            json=verify_data,
            headers=headers
        )
        
        if response.status_code != 200:
            handle_response_error(response)
            
        print(f"Verificación de contraseña: {response.json()}")
        
        # Solicitar recuperación de contraseña
        print("\n--- Ejemplo: Solicitar recuperación de contraseña ---")
        response = await client.post(
            f"{BASE_URL}/auth/forgot-password",
            params={"email": "pablo@prueba.com"}
        )
        
        if response.status_code != 200:
            handle_response_error(response)
            
        print(f"Respuesta: {response.json()}")
        
        return {
            "access_token": access_token,
            "headers": headers
        }

# Ejemplos de uso de la API de Usuarios
async def user_examples(auth: Dict[str, Any]) -> None:
    """Ejemplos de operaciones con usuarios"""
    headers = auth["headers"]
    
    async with httpx.AsyncClient() as client:
        # Obtener información del usuario actual
        print("\n--- Ejemplo: Obtener usuario actual ---")
        response = await client.get(
            f"{BASE_URL}/users/me",
            headers=headers
        )
        
        if response.status_code != 200:
            handle_response_error(response)
            
        current_user = response.json()
        print(f"Usuario actual: {current_user['email']}")
        
        # Listar todos los usuarios
        print("\n--- Ejemplo: Listar todos los usuarios ---")
        response = await client.get(
            f"{BASE_URL}/users",
            headers=headers
        )
        
        if response.status_code != 200:
            handle_response_error(response)
            
        users = response.json()
        print(f"Total de usuarios: {len(users)}")
        for user in users:
            print(f"  - {user['email']} (Roles: {', '.join(user['roles'])})")
        
        # Crear un nuevo usuario
        print("\n--- Ejemplo: Crear un nuevo usuario ---")
        new_user_data = {
            "email": "nuevo.usuario@example.com",
            "username": "nuevousuario",
            "password": "Password123",
            "firstName": "Nuevo",
            "lastName": "Usuario",
            "join_date": "2025-04-21",
            "roleId": "2", # Debería ser un ID válido de rol
            "areaId": "1"  # Debería ser un ID válido de área
        }
        
        # Nota: Este endpoint probablemente devuelva error 409 si el email ya existe
        try:
            response = await client.post(
                f"{BASE_URL}/users",
                json=new_user_data,
                headers=headers
            )
            
            if response.status_code == 201:
                created_user = response.json()
                print(f"Usuario creado: {created_user['email']}")
            else:
                handle_response_error(response)
        except httpx.HTTPStatusError as e:
            print(f"Error esperado si el usuario ya existe: {e}")

# Ejemplos de uso de la API de Roles
async def role_examples(auth: Dict[str, Any]) -> None:
    """Ejemplos de operaciones con roles"""
    headers = auth["headers"]
    
    async with httpx.AsyncClient() as client:
        # Listar todos los roles
        print("\n--- Ejemplo: Listar todos los roles ---")
        response = await client.get(
            f"{BASE_URL}/roles",
            headers=headers
        )
        
        if response.status_code != 200:
            handle_response_error(response)
            
        roles = response.json()
        print(f"Total de roles: {len(roles)}")
        for role in roles:
            print(f"  - {role['name']}: {role['description']}")
        
        # Obtener un rol específico con sus permisos
        if roles:
            role_id = roles[0]["id"]
            print(f"\n--- Ejemplo: Obtener rol con ID {role_id} ---")
            response = await client.get(
                f"{BASE_URL}/roles/{role_id}",
                headers=headers
            )
            
            if response.status_code != 200:
                handle_response_error(response)
                
            role = response.json()
            print(f"Rol: {role['name']}")
            print(f"Permisos: {role.get('permissions', [])}")

# Ejemplos de uso de la API de Áreas
async def area_examples(auth: Dict[str, Any]) -> None:
    """Ejemplos de operaciones con áreas"""
    headers = auth["headers"]
    
    async with httpx.AsyncClient() as client:
        # Listar todas las áreas
        print("\n--- Ejemplo: Listar todas las áreas ---")
        response = await client.get(
            f"{BASE_URL}/areas",
            headers=headers
        )
        
        if response.status_code != 200:
            handle_response_error(response)
            
        areas = response.json()
        print(f"Total de áreas: {len(areas)}")
        for area in areas:
            print(f"  - {area['name']}: {area['description']}")
        
        # Crear una nueva área
        print("\n--- Ejemplo: Crear una nueva área ---")
        new_area_data = {
            "name": "Área de Prueba",
            "description": "Esta es un área creada para pruebas"
        }
        
        # Nota: Este endpoint probablemente devuelva error 409 si el nombre ya existe
        try:
            response = await client.post(
                f"{BASE_URL}/areas",
                json=new_area_data,
                headers=headers
            )
            
            if response.status_code == 200:
                created_area = response.json()
                print(f"Área creada: {created_area['name']}")
            else:
                handle_response_error(response)
        except httpx.HTTPStatusError as e:
            print(f"Error esperado si el área ya existe: {e}")

# Función principal
async def main():
    print("=== Ejemplos de uso de la API ===")
    
    # Obtener tokens de autenticación
    auth = await auth_examples()
    
    # Ejemplos de operaciones con usuarios
    await user_examples(auth)
    
    # Ejemplos de operaciones con roles
    await role_examples(auth)
    
    # Ejemplos de operaciones con áreas
    await area_examples(auth)
    
    print("\n=== Fin de los ejemplos ===")

# Ejecutar los ejemplos
if __name__ == "__main__":
    asyncio.run(main())