// src/features/dashboard/pages/SettingsPage.tsx

import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ContentPlaceholder from '../components/placeholders/ContentPlaceholder';

const SettingsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
        <p className="text-gray-600">Gestiona las configuraciones del sistema</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <ContentPlaceholder 
          title="Configuración"
          subtitle="Aquí podrás gestionar todas las configuraciones del sistema"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;