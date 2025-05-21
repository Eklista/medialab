// src/features/dashboard/pages/AppSettingsPage.tsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardCard from '../components/ui/DashboardCard';
import ConfigSidebar, { ConfigMenuItem } from '../components/config/ConfigSidebar';
import RolesAreasSettings from './settings/RolesAreasSettings';
import ServicesSettings from './settings/ServicesSettings';
import AcademicUnitsSettings from './settings/AcademicUnitsSettings';
import SmtpSettings from './settings/SmtpSettings';
import { 
  UserGroupIcon, 
  WrenchScrewdriverIcon, 
  BuildingLibraryIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const AppSettingsPage: React.FC = () => {
  const location = useLocation();
  
  // Configuración del menú lateral
  const configMenuItems: ConfigMenuItem[] = [
    {
      id: 'roles-areas',
      name: 'Roles y Áreas',
      path: '/dashboard/app-settings/roles-areas',
      icon: <UserGroupIcon className="h-5 w-5" />
    },
    {
      id: 'services',
      name: 'Servicios',
      path: '/dashboard/app-settings/services',
      icon: <WrenchScrewdriverIcon className="h-5 w-5" />
    },
    {
      id: 'faculties',
      name: 'Facultades y Departamentos',
      path: '/dashboard/app-settings/faculties',
      icon: <BuildingLibraryIcon className="h-5 w-5" />
    },
    {
      id: 'smtp',
      name: 'Configuración SMTP',
      path: '/dashboard/app-settings/smtp',
      icon: <EnvelopeIcon className="h-5 w-5" />
    }
  ];
  
  // Determinar el ítem activo basado en la ruta actual
  const getActiveItemId = () => {
    const path = location.pathname;
    const item = configMenuItems.find(item => path.includes(item.id));
    return item ? item.id : configMenuItems[0].id;
  };
  
  const activeItemId = getActiveItemId();
  
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Configuración de Aplicación</h1>
        <p className="text-gray-600">Administra configuraciones avanzadas de la aplicación</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de configuración */}
        <div className="lg:col-span-1">
          <ConfigSidebar 
            items={configMenuItems}
            activeItemId={activeItemId}
          />
        </div>
        
        {/* Contenido de configuración */}
        <div className="lg:col-span-3">
          <DashboardCard noPadding>
            <Routes>
              <Route path="roles-areas" element={<RolesAreasSettings />} />
              <Route path="services" element={<ServicesSettings />} />
              <Route path="faculties" element={<AcademicUnitsSettings />} />
              <Route path="smtp" element={<SmtpSettings />} />
              <Route path="/" element={<Navigate to="roles-areas" replace />} />
            </Routes>
          </DashboardCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AppSettingsPage;