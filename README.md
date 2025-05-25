# 🎬 MediaLab — Universidad Galileo

Bienvenido al proyecto del **Laboratorio de Multimedia (MediaLab)** de **Universidad Galileo**, un sistema de gestión web completo hecho con cariño y altas dosis de cafeína ☕.  

Este proyecto busca centralizar los servicios audiovisuales, producción de contenido y apoyo académico de MediaLab, con una interfaz moderna, modular y funcional, respaldado por un potente backend para la gestión de usuarios, servicios y solicitudes.

## 🧰 Tech Stack

### Frontend
- ⚛️ **React + Vite** — Para un frontend veloz y modular.  
- 🎨 **Tailwind CSS** — Para estilos elegantes sin dolor.  
- 🧠 **TypeScript** — Porque nos gusta que el código nos diga si la estamos cagando.  
- 🌐 **React Router DOM** — Navegación bonita y sin recarga.  
- 🖼️ **Assets personalizados** — Imágenes propias del equipo.

### Backend
- 🐍 **Python + FastAPI** — Framework de alto rendimiento para APIs.
- 🗄️ **SQLAlchemy** — ORM potente para interactuar con la base de datos.
- 🔄 **Alembic** — Migraciones de base de datos sin dolor de cabeza.
- 🛡️ **JWT Authentication** — Seguridad y gestión de sesiones.
- 📧 **SMTP Email** — Notificaciones por correo electrónico.

### Base de datos y despliegue
- 🐬 **MySQL** — Base de datos relacional potente y confiable.
- 🐳 **Docker** — Contenedores para facilitar el desarrollo y despliegue.
- 🌐 **Nginx** — Servidor web de alto rendimiento como proxy inverso.
- 🔄 **Docker Compose** — Orquestación sencilla de servicioss.

## 🚀 ¿Cómo levantar el proyecto?

### Opción 1: Usando Docker (recomendado)

1. **Clona el repositorio**
```bash
git clone https://github.com/Eklista/medialab.git
cd medialab
```

2. **Crea un archivo .env.dev** con las variables de entorno necesarias o usa el ejemplo proporcionado
```bash
cp .env.example .env.dev
```

3. **Levanta los contenedores con Docker Compose**
```bash
docker compose up
```

4. **Accede a la aplicación**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/v1
- Documentación API: http://localhost:8000/docs

### Opción 2: Desarrollo local sin Docker

#### Backend
1. **Navega al directorio del backend**
```bash
cd backend
```

2. **Crea un entorno virtual**
```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

3. **Instala dependencias**
```bash
pip install -r requirements.txt
```

4. **Configura las variables de entorno**
```bash
# Crea un archivo .env con las variables necesarias
```

5. **Ejecuta las migraciones**
```bash
alembic upgrade head
```

6. **Inicia el servidor de desarrollo**
```bash
uvicorn app.main:app --reload
```

#### Frontend
1. **Navega al directorio del frontend**
```bash
cd frontend
```

2. **Instala las dependencias**
```bash
npm install
# o si prefieres Yarn:
yarn
```

3. **Ejecuta el servidor de desarrollo**
```bash
npm run dev
# o
yarn dev
```

## 🏭 Despliegue en producción

Para desplegar el proyecto en producción, utiliza el script `deploy.sh`:

```bash
# Haz el script ejecutable
chmod +x deploy.sh

# Ejecuta el script de despliegue
./deploy.sh
```

El script realizará las siguientes acciones:
1. Verificar la estructura de directorios
2. Comprobar certificados SSL
3. Construir las imágenes de Docker
4. Iniciar los servicios
5. Verificar que todo esté funcionando correctamente

## 🧩 Estructura del proyecto

### Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── assets/           # Imágenes, iconos y recursos estáticos
│   ├── components/       # Componentes reutilizables
│   ├── features/         # Características organizadas por dominio
│   │   ├── auth/         # Autenticación y autorización
│   │   ├── dashboard/    # Panel de administración
│   │   ├── clients-portal/ # Portal para clientes
│   │   └── ...
│   ├── hooks/            # Custom hooks de React
│   ├── routes/           # Configuración de rutas
│   ├── services/         # Servicios API y lógica de negocio
│   ├── styles/           # Estilos globales
│   ├── types/            # Definiciones de TypeScript
│   └── utils/            # Utilidades y funciones auxiliares
├── public/               # Archivos públicos estáticos
├── Dockerfile            # Configuración para producción
├── Dockerfile.dev        # Configuración para desarrollo
└── package.json          # Dependencias y scripts
```

### Backend (`backend/`)

```
backend/
├── app/
│   ├── api/              # Endpoints de la API
│   ├── config/           # Configuración de la aplicación
│   ├── crud/             # Operaciones CRUD básicas
│   ├── database/         # Configuración de base de datos
│   ├── models/           # Modelos SQLAlchemy
│   ├── repositories/     # Lógica de acceso a datos
│   ├── schemas/          # Esquemas Pydantic
│   ├── services/         # Lógica de negocio
│   └── utils/            # Utilidades y funciones auxiliares
├── alembic/              # Migraciones de base de datos
├── scripts/              # Scripts de inicialización y utilidades
├── static/               # Archivos estáticos
├── requirements.txt      # Dependencias Python
└── dockerfile            # Configuración Docker
```

## 👥 Roles y permisos

El sistema incluye varios roles predefinidos:

- **ADMIN**: Acceso completo a todas las funcionalidades
- **USER**: Acceso básico para solicitudes y gestión de perfil

Los permisos incluyen:
- Gestión de usuarios
- Gestión de áreas y departamentos
- Gestión de servicios y solicitudes
- Administración de roles

## 📚 Documentación

Para más información sobre la API, accede a la documentación interactiva:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🔧 Scripts útiles

- `run-interactive.sh`: Configuración interactiva del sistema (crear administrador)
- `deploy.sh`: Despliegue en producción

---

Made with ❤️ por el equipo de MediaLab — Universidad Galileo.

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Eklista/medialab)