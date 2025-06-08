// Estados locales
  const [searchValue, setSearchValue] = useState('');// frontend/src/features/dashboard/pages/inventory/InventoryDashboardPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ApiErrorHandler from '../../../../components/common/ApiErrorHandler';

// Importar los nuevos componentes de inventario
import InventoryOverview from '../../inventory/dashboard/InventoryOverview';
import MetricsGrid from '../../inventory/dashboard/MetricsGrid';
import ActivityFeed from '../../inventory/dashboard/ActivityFeed';
import QuickActions from '../../inventory/common/QuickActions';
import { useSearchFilters } from '../../inventory/common/SearchFilters';

// Icons
import { 
  ChartBarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

// Hooks
import { useInventoryDashboard } from '../../../../services/inventory';

const InventoryDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Estados locales
  const [searchValue, setSearchValue] = useState('');

  // Datos reales del backend
  const { dashboardData, isLoading, error, refresh } = useInventoryDashboard();

  // Handlers de navegación
  const handleNavigate = (section: string, id?: string) => {
    const routes = {
      'equipment': '/dashboard/inventory/equipment',
      'supplies': '/dashboard/inventory/supplies',
      'activity': '/dashboard/inventory/activity',
      'alerts': '/dashboard/inventory/alerts',
      'category': `/dashboard/inventory/categories/${id}`,
      'location': `/dashboard/inventory/locations/${id}`,
      'add_equipment': '/dashboard/inventory/equipment/new',
      'add_supply': '/dashboard/inventory/supplies/new',
      'reports': '/dashboard/inventory/reports',
      'settings': '/dashboard/inventory/settings'
    };
    
    const route = routes[section as keyof typeof routes];
    if (route) {
      navigate(route);
    }
  };

  const handleQuickAction = (actionId: string) => {
    console.log(`Ejecutando acción: ${actionId}`);
    handleNavigate(actionId);
  };

  const handleActivityClick = (activity: any) => {
    console.log('Ver detalle de actividad:', activity);
    // Navegar al detalle específico según el tipo
    if (activity.type === 'equipment') {
      navigate(`/dashboard/inventory/equipment/${activity.entity?.id}`);
    } else if (activity.type === 'supply') {
      navigate(`/dashboard/inventory/supplies/${activity.entity?.id}`);
    }
  };

  const handleMetricClick = (metricId: string) => {
    console.log(`Ver métrica: ${metricId}`);
    
    // Navegar a la vista filtrada según la métrica
    const metricRoutes = {
      'equipment': '/dashboard/inventory/equipment',
      'supplies': '/dashboard/inventory/supplies',
      'alerts': '/dashboard/inventory/alerts',
      'utilization': '/dashboard/inventory/equipment?filter=assigned',
      'categories': '/dashboard/inventory/settings?tab=categories',
      'locations': '/dashboard/inventory/settings?tab=locations'
    };
    
    const route = metricRoutes[metricId as keyof typeof metricRoutes];
    if (route) {
      navigate(route);
    }
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    if (value.trim()) {
      // Redirigir a búsqueda global con el término
      navigate(`/dashboard/inventory/search?q=${encodeURIComponent(value.trim())}`);
    }
  };

  // Manejo de errores
  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Dashboard de Inventario</h1>
            </div>
            <p className="text-gray-600">Vista general del sistema de inventario y activos</p>
          </div>
          
          <ApiErrorHandler 
            error={error} 
            onRetry={refresh} 
            resourceName="el dashboard de inventario"
          />
        </div>
      </DashboardLayout>
    );
  }

  // Transformar datos para los componentes
  const overviewData = {
    metrics: dashboardData?.metrics,
    recentActivity: dashboardData?.recent_activity?.map((activity, index) => ({
      id: `activity-${index}`,
      type: activity.type as 'equipment' | 'supply' | 'assignment' | 'movement',
      title: activity.description,
      description: activity.description,
      timestamp: activity.timestamp,
      user: undefined,
      status: undefined
    })),
    topCategories: dashboardData?.categories_summary,
    topLocations: dashboardData?.locations_summary?.map(location => ({
      ...location,
      is_external: false // Agregar campo faltante con valor por defecto
    })),
    alerts: dashboardData?.alerts?.map((alert, index) => ({
      id: `alert-${index}`,
      type: 'system' as const,
      title: 'Alerta del Sistema',
      description: alert,
      severity: 'medium' as const,
      count: 1
    }))
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header con búsqueda integrada */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Dashboard de Inventario</h1>
            </div>
            <p className="text-gray-600">Vista general del sistema de inventario y activos</p>
          </div>

          {/* Búsqueda rápida */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar en inventario..."
                className="w-full sm:w-80 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchValue);
                  }
                }}
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            <button
              onClick={() => handleSearch(searchValue)}
              disabled={!searchValue.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Componente principal de overview */}
        <InventoryOverview
          data={overviewData}
          isLoading={isLoading}
          onRefresh={refresh}
          onNavigate={handleNavigate}
        />

        {/* Grid de métricas detalladas */}
        <MetricsGrid
          metrics={dashboardData?.metrics}
          categories={dashboardData?.categories_summary}
          locations={dashboardData?.locations_summary}
          showTrends={true}
          showBreakdown={true}
          isLoading={isLoading}
          onMetricClick={handleMetricClick}
        />

        {/* Sección de dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Feed de actividad */}
          <ActivityFeed
            maxItems={10}
            showFilters={false}
            onActivityClick={handleActivityClick}
            refreshInterval={300000} // 5 minutos
          />

          {/* Acciones rápidas del dashboard */}
          <QuickActions
            type="dashboard"
            layout="list"
            showTitle={true}
            alertCounts={{
              lowStock: dashboardData?.metrics?.low_stock_supplies || 0,
              damaged: dashboardData?.metrics?.damaged_equipment || 0,
              unassigned: (dashboardData?.metrics?.total_equipment || 0) - (dashboardData?.metrics?.assigned_equipment || 0)
            }}
            onCustomAction={handleQuickAction}
          />
        </div>

        {/* Vista compacta adicional si hay espacio */}
        {dashboardData?.locations_summary && dashboardData.locations_summary.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Distribución por Ubicaciones
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {dashboardData.locations_summary.map((location) => (
                  <div 
                    key={location.id}
                    className="cursor-pointer hover:shadow-md transition-shadow p-4 bg-gray-50 rounded-lg"
                    onClick={() => handleNavigate('location', location.id.toString())}
                  >
                    <h4 className="font-medium text-gray-900">{location.name}</h4>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{location.count}</p>
                    <p className="text-sm text-gray-500">
                      {location.percentage?.toFixed(1)}% del total
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InventoryDashboardPage;