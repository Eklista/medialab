import React from 'react';
import { ActivityType } from './ActivityTypeStep';

// Paso 2: Detalles de la actividad
export const ActivityDetailsStep: React.FC<{ activityType: ActivityType }> = ({ activityType }) => {
  const getActivityTitle = () => {
    switch (activityType) {
      case 'single':
        return 'ACTIVIDAD ÚNICA';
      case 'recurrent':
        return 'ACTIVIDAD RECURRENTE';
      case 'podcast':
        return 'PODCAST';
      case 'course':
        return 'CURSOS';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-5">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-black mb-2">Paso 2: Detalles de la Actividad</h2>
        <div className="h-1 w-32 bg-black rounded-full mb-4"></div>
      </div>

      <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
        <h3 className="text-xl font-medium text-black mb-3">
          {getActivityTitle()}
        </h3>
        <p className="text-base text-(--color-text-secondary)">
          FUNCIÓN EN DESARROLLO - La configuración para este tipo de actividad estará disponible próximamente.
        </p>
      </div>
    </div>
  );
};

// Paso 3: Servicios requeridos
export const ServicesStep: React.FC = () => {
  return (
    <div className="space-y-5">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-black mb-2">Paso 3: Servicios Requeridos</h2>
        <div className="h-1 w-32 bg-black rounded-full mb-4"></div>
      </div>

      <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
        <h3 className="text-xl font-medium text-black mb-3">
          SERVICIOS
        </h3>
        <p className="text-base text-(--color-text-secondary)">
          FUNCIÓN EN DESARROLLO - La selección de servicios estará disponible próximamente.
        </p>
      </div>
    </div>
  );
};

// Paso 4: Información del solicitante
export const RequestorInfoStep: React.FC = () => {
  return (
    <div className="space-y-5">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-black mb-2">Paso 4: Información del Solicitante</h2>
        <div className="h-1 w-32 bg-black rounded-full mb-4"></div>
      </div>

      <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
        <h3 className="text-xl font-medium text-black mb-3">
          DATOS DEL SOLICITANTE
        </h3>
        <p className="text-base text-(--color-text-secondary)">
          FUNCIÓN EN DESARROLLO - El formulario para ingresar los datos del solicitante estará disponible próximamente.
        </p>
      </div>
    </div>
  );
};