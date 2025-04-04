# 🎬 MediaLab — Universidad Galileo

Bienvenido al proyecto del **Laboratorio de Multimedia (MediaLab)** de **Universidad Galileo**, un dashboard web hecho con cariño y altas dosis de cafeína ☕.  
Este proyecto busca centralizar los servicios audiovisuales, producción de contenido y apoyo académico de MediaLab, con una interfaz moderna, modular y funcional.

## 🧰 Tech Stack

- ⚛️ React + Vite — Para un frontend veloz y modular.  
- 🎨 Tailwind CSS — Para estilos elegantes sin dolor.  
- 🧠 TypeScript — Porque nos gusta que el código nos diga si la estamos cagando.  
- 🌐 React Router DOM — Navegación bonita y sin recarga.  
- 🖼️ Assets personalizados — Imágenes propias del equipo.

## 🚀 ¿Cómo levantar el proyecto sin romper nada?

1. **Cloná el repo**

git clone https://github.com/Eklista/medialab.git  
cd medialab

2. **Instalá las dependencias**

npm install  
# o si sos del team Yarn:  
# yarn

3. **Corré el server de desarrollo**

npm run dev  
# o  
# yarn dev

4. **Abrilo en el navegador**

http://localhost:5173/

## 📁 Estructura del proyecto (`src/`)

src/  
├── App.tsx  
├── main.tsx  
├── vite-env.d.ts  
│  
├── assets/  
│   └── images/  
│       ├── gallery1.jpg  
│       ├── gallery2.jpg  
│       ├── gallery3.jpg  
│       ├── logo.png  
│       ├── medialab-hero.jpg  
│       ├── medialab-team.jpg  
│       ├── service-academic.jpg  
│       ├── service-audiovisual.jpg  
│       └── service-content.jpg  
│  
├── components/  
│   ├── common/  
│   ├── forms/  
│   ├── layout/  
│   │   ├── Footer.tsx  
│   │   ├── Navbar.tsx  
│   │   └── index.ts  
│   └── ui/  
│  
├── features/  
│  
├── pages/  
│   ├── index.ts  
│   ├── home/  
│   │   └── HomePage.tsx  
│   └── request-form/  
│       └── RequestFormPage.tsx  
│  
├── routes/  
│  
├── services/  
│  
├── styles/  
│   └── global.css  
│  
├── types/  
│  
└── utils/

---

Made with ❤️ por el equipo de MediaLab — Universidad Galileo.