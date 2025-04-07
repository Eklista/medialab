// src/features/service-request/activityDetails/SingleActivityDetails.tsx
import React from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';

const SingleActivityDetails: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <div className="text-center mb-6">
        <CalendarIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-bold mb-2">Actividad Única</h2>
        <p className="text-gray-600 mb-6">
          Configure los detalles para una actividad que se realizará en una fecha específica.
        </p>
      </div>
      
      <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 mx-auto max-w-2xl">
        <div className="flex items-center justify-center">
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 w-full">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <span className="font-medium">Próximamente:</span> La configuración detallada para actividades únicas estará disponible en futuras actualizaciones. Por el momento, puede continuar con el proceso para solicitar los servicios básicos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleActivityDetails;