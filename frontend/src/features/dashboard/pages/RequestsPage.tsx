// src/features/dashboard/pages/RequestsPage.tsx

import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ContentPlaceholder from '../components/placeholders/ContentPlaceholder';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const RequestsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Solicitudes</h1>
        <p className="text-gray-600">Gestiona todas las solicitudes de servicios</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <ContentPlaceholder 
          title="Solicitudes"
          subtitle="Aquí podrás gestionar todas las solicitudes de servicios recibidas"
          icon={
            <ClipboardDocumentListIcon className="h-16 w-16 text-gray-300 mb-4" />
          }
        />
      </div>
    </DashboardLayout>
  );
};

export default RequestsPage;