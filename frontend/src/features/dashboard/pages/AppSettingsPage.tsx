// src/features/dashboard/pages/AppSettingsPage.tsx

import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ContentPlaceholder from '../components/placeholders/ContentPlaceholder';
import { WrenchIcon } from '@heroicons/react/24/outline';

const AppSettingsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Configuración de Aplicación</h1>
        <p className="text-gray-600">Administra configuraciones avanzadas de la aplicación</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <ContentPlaceholder 
          title="Configuración de Aplicación"
          subtitle="Aquí podrás gestionar todas las configuraciones avanzadas del sistema"
          icon={
            <WrenchIcon className="h-16 w-16 text-gray-300 mb-4" />
          }
        />
      </div>
    </DashboardLayout>
  );
};

export default AppSettingsPage;