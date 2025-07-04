# Medialab Dashboard

Sistema de gestión para producción audiovisual universitaria

## 🏗️ Estructura del Proyecto

```
medialab/
├── backend-api/          # API REST (FastAPI)
├── cms-wordpress/        # CMS contenido público
├── documentation/        # Docs técnica (Astro Starlight)
├── frontend-dashboard/   # Dashboard colaboradores/admin (React)
├── frontend-godmode/     # Panel superadmin (React)
├── frontend-portal/      # Portal clientes (React)
└── nginx/               # Proxy reverso
```

## 🚀 Inicio Rápido

### Prerrequisitos
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### Instalación
```bash
git clone https://github.com/eklista/medialab.git
cd medialab

# Configurar variables de entorno
cp .env.example .env

# Levantar con Docker
docker-compose up -d
```

## 📚 Solo Documentación

```bash
# Clonar solo documentación
git clone --filter=blob:none --sparse https://github.com/eklista/medialab.git
cd medialab
git sparse-checkout set documentation

cd documentation
npm install
npm run dev
# Acceso: http://localhost:4321
```

## 🔑 Tipos de Usuario

- **Clientes**: `/portal/`
- **Colaboradores**: `/dashboard/`
- **Administradores**: `/dashboard/`
- **SuperAdmin**: `/godmode/`

## 📖 Documentación

- **Local**: http://localhost:4321
- **Técnica**: Ver carpeta `documentation/`

## 🤝 Contribuir

1. Fork del proyecto
2. Crear rama feature
3. Commit y push
4. Crear Pull Request