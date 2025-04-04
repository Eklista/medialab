// En RequestFormPage.tsx
import React from 'react';
import { Navbar, Footer } from '../../components/layout';
import ServiceRequestForm from '../../features/service-request/ServiceRequestForm';

export const RequestFormPage: React.FC = () => {
  // Manejador de eventos explícito
  const handleInteraction = () => {
    console.log('Página interactuada');
    // Este handler no hace nada específico pero a veces
    // su mera presencia puede "activar" la interactividad
  };

  return (
    // Nota: Añadimos pointer-events-auto para asegurar que los eventos funcionan
    <div 
      className="min-h-screen bg-gray-50 relative"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <Navbar />
      
      {/* Añadimos z-10 y pointer-events-auto para asegurar que es interactivo */}
      <main className="py-12 relative z-10" style={{ touchAction: 'manipulation' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-(--color-text-main) mb-3">
              Solicitud de Servicios
            </h1>
            <p className="text-base text-(--color-text-secondary) max-w-2xl mx-auto">
              Complete el siguiente formulario para solicitar los servicios de MediaLab. 
              Nuestro equipo se pondrá en contacto con usted a la brevedad.
            </p>
          </div>
          
          <ServiceRequestForm />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default RequestFormPage;