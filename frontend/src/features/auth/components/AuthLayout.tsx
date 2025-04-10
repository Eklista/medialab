// src/features/auth/components/AuthLayout.tsx

import React from 'react';
import heroImage from '../../../assets/images/medialab-hero.jpg';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  title, 
  subtitle, 
  children 
}) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Imagen lateral (izquierda en desktop, arriba en móvil) */}
      <div className="relative md:w-1/2 h-64 md:h-auto">
        <img 
          src={heroImage}
          alt="MediaLab"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40 flex flex-col justify-center px-8 md:px-12">
          <div className="text-white space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold">
              Bienvenido a <span className="text-(--color-accent-1)">MediaLab</span>
            </h1>
            <p className="text-lg opacity-90">
              Departamento de producción audiovisual de Universidad Galileo
            </p>
          </div>
        </div>
      </div>
      
      {/* Contenido del formulario (derecha en desktop, abajo en móvil) */}
      <div className="md:w-1/2 flex flex-col">
        <div className="flex-grow flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-(--color-text-main)">{title}</h2>
              {subtitle && (
                <p className="mt-2 text-sm text-(--color-text-secondary)">{subtitle}</p>
              )}
            </div>
            
            {children}
          </div>
        </div>
        <div className="py-4 px-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} MediaLab - Universidad Galileo
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;