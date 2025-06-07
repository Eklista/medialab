// src/features/dashboard/pages/CalendarPage.tsx
import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Calendar from '../components/ui/Calendar';
import {
  CalendarDaysIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const CalendarPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header de la página */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-main)] flex items-center gap-3">
              <CalendarDaysIcon className="h-8 w-8 text-[var(--color-accent-1)]" />
              Calendario MediaLab
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-1">
              Gestiona eventos, grabaciones y actividades del laboratorio
            </p>
          </div>
          
          {/* Acciones del header */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <MagnifyingGlassIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Buscar</span>
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <FunnelIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Filtrar</span>
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-1)] text-white rounded-lg hover:bg-[var(--color-accent-2)] transition-colors duration-200">
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Evento</span>
            </button>
          </div>
        </div>

        {/* Estadísticas rápidas del calendario */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Eventos Hoy</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Esta Semana</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CalendarDaysIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Este Mes</p>
                <p className="text-2xl font-bold text-gray-900">45</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <CalendarDaysIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <CalendarDaysIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Calendario principal */}
        <Calendar className="w-full" />

        {/* Leyenda extendida y consejos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leyenda de tipos de eventos */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipos de Eventos</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500"></div>
                <span className="text-sm text-gray-700">Grabaciones</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-purple-500"></div>
                <span className="text-sm text-gray-700">Podcasts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span className="text-sm text-gray-700">Transmisiones</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span className="text-sm text-gray-700">Edición</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500"></div>
                <span className="text-sm text-gray-700">Reuniones</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-indigo-500"></div>
                <span className="text-sm text-gray-700">Talleres</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-teal-500"></div>
                <span className="text-sm text-gray-700">Entregas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-pink-500"></div>
                <span className="text-sm text-gray-700">Fotografía</span>
              </div>
            </div>
          </div>

          {/* Consejos y atajos */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Consejos de Uso</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Vista Mensual</p>
                  <p className="text-xs text-gray-600">Perfecta para planificación general</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Vista Semanal</p>
                  <p className="text-xs text-gray-600">Ideal para ver horarios detallados</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Vista Diaria</p>
                  <p className="text-xs text-gray-600">Enfoque en actividades específicas</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Clic en Eventos</p>
                  <p className="text-xs text-gray-600">Ver detalles completos del evento</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CalendarPage;