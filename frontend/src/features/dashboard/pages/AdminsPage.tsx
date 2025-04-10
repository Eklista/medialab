// src/features/dashboard/pages/AdminsPage.tsx

import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ContentPlaceholder from '../components/placeholders/ContentPlaceholder';
import { UserGroupIcon } from '@heroicons/react/24/outline';

const AdminsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Administradores</h1>
        <p className="text-gray-600">Gestiona los usuarios administradores del sistema</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <ContentPlaceholder 
          title="Administradores"
          subtitle="Aquí podrás gestionar todos los usuarios administradores del sistema"
          icon={
            <UserGroupIcon className="h-16 w-16 text-gray-300 mb-4" />
          }
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminsPage;