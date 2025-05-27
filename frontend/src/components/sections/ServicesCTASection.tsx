// src/components/sections/ServicesCTASection.tsx
import React from 'react';
import { Button } from '../ui/Button';
import { 
  VideoCameraIcon, 
  MicrophoneIcon, 
  CameraIcon, 
  PlayIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline';

interface ServicesCTASectionProps {
  onRequestService?: () => void;
  className?: string;
}

export const ServicesCTASection: React.FC<ServicesCTASectionProps> = ({
  onRequestService,
  className = ''
}) => {
  const services = [
    {
      icon: <VideoCameraIcon className="h-5 w-5" />,
      title: 'Producción Audiovisual'
    },
    {
      icon: <MicrophoneIcon className="h-5 w-5" />,
      title: 'Grabación de Audio'
    },
    {
      icon: <CameraIcon className="h-5 w-5" />,
      title: 'Fotografía de Eventos'
    },
    {
      icon: <PlayIcon className="h-5 w-5" />,
      title: 'Transmisiones en Vivo'
    }
  ];

  return (
    <section className={`py-8 lg:py-12 bg-gradient-to-br from-gray-50 to-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Columna Izquierda: Texto */}
          <div>
            <div className="inline-flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 rounded-full text-sm font-medium mb-4">
              <VideoCameraIcon className="h-4 w-4" />
              <span>Servicios MediaLab</span>
            </div>
            
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              Servicios Multimedia para Universidad Galileo
            </h2>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              MediaLab es el laboratorio multimedia oficial de Universidad Galileo. 
              Creamos contenido audiovisual de alta calidad para documentar y difundir 
              las actividades académicas y eventos institucionales.
            </p>

            {/* CTA Button */}
            <Button
              variant="primary"
              size="lg"
              onClick={onRequestService}
              rightIcon={<ArrowRightIcon className="h-5 w-5" />}
              className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold shadow-sm hover:shadow-md transition-all duration-200"
            >
              Solicitar Servicio MediaLab
            </Button>
            
            <p className="text-sm text-gray-500 mt-3">
              Exclusivo para Universidad Galileo y sus facultades
            </p>
          </div>

          {/* Columna Derecha: Servicios y Stats */}
          <div className="space-y-6">
            
            {/* Services Grid - Más compacto */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nuestros Servicios</h3>
              <div className="grid grid-cols-2 gap-4">
                {services.map((service, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors group">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center group-hover:border-gray-900 group-hover:bg-gray-100 transition-all">
                      <div className="text-gray-700 group-hover:text-gray-900">
                        {service.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm leading-tight">
                        {service.title}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats - Horizontal compacto */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">En Números</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xl lg:text-2xl font-bold text-gray-900">1,500+</div>
                  <div className="text-xs text-gray-600">Videos Producidos</div>
                </div>
                <div className="text-center">
                  <div className="text-xl lg:text-2xl font-bold text-gray-900">300+</div>
                  <div className="text-xs text-gray-600">Graduaciones</div>
                </div>
                <div className="text-center">
                  <div className="text-xl lg:text-2xl font-bold text-gray-900">150+</div>
                  <div className="text-xs text-gray-600">Conferencias</div>
                </div>
                <div className="text-center">
                  <div className="text-xl lg:text-2xl font-bold text-gray-900">25</div>
                  <div className="text-xs text-gray-600">Facultades</div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
};