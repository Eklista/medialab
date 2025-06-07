import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DashboardCard from '../../components/ui/DashboardCard';
import DashboardButton from '../../components/ui/DashboardButton';
import Badge from '../../components/ui/Badge';
import ApiErrorHandler from '../../../../components/common/ApiErrorHandler';
import { 
  ComputerDesktopIcon, 
  CubeIcon, 
  ChartBarIcon,
  Cog6ToothIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

// 🎯 USAR LOS SERVICIOS REALES
import { useInventoryDashboard } from '../../../../services/inventory';

const InventoryDashboardPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // 🚀 DATOS REALES del backend
  const { dashboardData, isLoading, error, refresh } = useInventoryDashboard();

  // Navegación simulada (en la implementación real usarías useNavigate)
  const handleNavigateToModule = (module: string) => {
    console.log(`Navegando a: /dashboard/inventory/${module}`);
    // navigate(`/dashboard/inventory/${module}`);
  };

  const handleQuickAdd = (type: 'equipment' | 'supply') => {
    console.log(`Agregar nuevo ${type}`);
    // navigate(`/dashboard/inventory/${type === 'equipment' ? 'equipment' : 'supplies'}?action=add`);
  };

  const handleQuickSearch = () => {
    if (searchTerm.trim()) {
      console.log(`Buscando: ${searchTerm}`);
      // navigate(`/dashboard/inventory/equipment?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Formatear fecha para actividad reciente
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-GT', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  // Módulos de navegación con datos reales
  const navigationModules = [
    {
      id: 'equipment',
      title: 'Equipos',
      description: 'Gestión de equipos tecnológicos',
      icon: ComputerDesktopIcon,
      color: 'blue',
      count: dashboardData?.metrics?.total_equipment || 0,
      alerts: dashboardData?.metrics?.damaged_equipment || 0
    },
    {
      id: 'supplies',
      title: 'Suministros',
      description: 'Control de stock y materiales',
      icon: CubeIcon,
      color: 'green',
      count: dashboardData?.metrics?.total_supplies || 0,
      alerts: dashboardData?.metrics?.low_stock_supplies || 0
    },
    {
      id: 'reports',
      title: 'Reportes',
      description: 'Informes y análisis detallados',
      icon: ClipboardDocumentListIcon,
      color: 'purple',
      count: 0,
      alerts: 0
    },
    {
      id: 'settings',
      title: 'Configuración',
      description: 'Categorías, ubicaciones y proveedores',
      icon: Cog6ToothIcon,
      color: 'gray',
      count: 0,
      alerts: 0
    }
  ];

  // 🎯 MANEJO DE ERRORES REAL
  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
            </div>
            <p className="text-gray-600">Sistema de gestión de inventario y activos</p>
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
            </div>
            <p className="text-gray-600">Sistema de gestión de inventario y activos</p>
          </div>

          {/* Acciones rápidas */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar equipos o suministros..."
                className="w-full sm:w-80 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleQuickSearch();
                  }
                }}
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            <DashboardButton
              onClick={handleQuickSearch}
              disabled={!searchTerm.trim()}
              className="sm:px-4"
            >
              Buscar
            </DashboardButton>
          </div>
        </div>

        {/* 🚀 ALERTAS REALES */}
        {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
          <DashboardCard>
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-amber-800 mb-2">
                  Alertas del Sistema
                </h3>
                <div className="space-y-1">
                  {dashboardData.alerts.map((alert, index) => (
                    <p key={index} className="text-sm text-amber-700">
                      • {alert}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </DashboardCard>
        )}

        {/* 🚀 MÉTRICAS REALES con loading states */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Equipos</p>
                {isLoading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData?.metrics?.total_equipment || 0}
                  </p>
                )}
                {isLoading ? (
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20 mt-1"></div>
                ) : (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircleIcon className="h-3 w-3" />
                    {dashboardData?.metrics?.active_equipment || 0} operativos
                  </p>
                )}
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <ComputerDesktopIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </DashboardCard>

          <DashboardCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Suministros</p>
                {isLoading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData?.metrics?.total_supplies || 0}
                  </p>
                )}
                {isLoading ? (
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20 mt-1"></div>
                ) : (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <ExclamationTriangleIcon className="h-3 w-3" />
                    {dashboardData?.metrics?.low_stock_supplies || 0} stock bajo
                  </p>
                )}
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CubeIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </DashboardCard>

          <DashboardCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Equipos Asignados</p>
                {isLoading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData?.metrics?.assigned_equipment || 0}
                  </p>
                )}
                {isLoading ? (
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20 mt-1"></div>
                ) : (
                  <p className="text-xs text-blue-600 flex items-center gap-1">
                    <ArrowTrendingUpIcon className="h-3 w-3" />
                    {dashboardData?.metrics ? 
                      ((dashboardData.metrics.assigned_equipment / dashboardData.metrics.total_equipment) * 100).toFixed(1) 
                      : 0}% tasa
                  </p>
                )}
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <CheckCircleIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </DashboardCard>

          <DashboardCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Requieren Atención</p>
                {isLoading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {(dashboardData?.metrics?.damaged_equipment || 0) + (dashboardData?.metrics?.low_stock_supplies || 0)}
                  </p>
                )}
                {isLoading ? (
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20 mt-1"></div>
                ) : (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <WrenchScrewdriverIcon className="h-3 w-3" />
                    Acción requerida
                  </p>
                )}
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </DashboardCard>
        </div>

        {/* Módulos de navegación */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Módulos del Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {navigationModules.map((module) => {
              const IconComponent = module.icon;
              return (
                <div
                key={module.id}
                className="cursor-pointer hover:shadow-lg transition-shadow group"
                onClick={() => handleNavigateToModule(module.id)}
                >
                <DashboardCard>
                  <div className="text-center space-y-3">
                    <div className={`mx-auto w-12 h-12 rounded-full bg-${module.color}-100 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <IconComponent className={`h-6 w-6 text-${module.color}-600`} />
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {module.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {module.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-4 text-sm">
                      {isLoading ? (
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                      ) : (
                        <span className="text-gray-600">
                          {module.count} items
                        </span>
                      )}
                      {!isLoading && module.alerts > 0 && (
                        <Badge variant="danger" className="text-xs">
                          {module.alerts} alertas
                        </Badge>
                      )}
                    </div>
                  </div>
                </DashboardCard>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sección de dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 🚀 ACTIVIDAD RECIENTE REAL */}
          <DashboardCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Actividad Reciente
              </h3>
              <DashboardButton
                variant="text"
                size="sm"
                onClick={() => console.log('Ver todo')}
              >
                Ver todo
              </DashboardButton>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mt-1"></div>
                    </div>
                  ))}
                </div>
              ) : dashboardData?.recent_activity && dashboardData.recent_activity.length > 0 ? (
                dashboardData.recent_activity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 font-medium">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <ChartBarIcon className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-sm">No hay actividad reciente</p>
                </div>
              )}
            </div>
          </DashboardCard>

          {/* Acciones rápidas */}
          <DashboardCard>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Acciones Rápidas
            </h3>

            <div className="space-y-3">
              <DashboardButton
                onClick={() => handleQuickAdd('equipment')}
                leftIcon={<PlusIcon className="h-4 w-4" />}
                variant="outline"
                fullWidth
                className="justify-start"
              >
                Agregar Nuevo Equipo
              </DashboardButton>

              <DashboardButton
                onClick={() => handleQuickAdd('supply')}
                leftIcon={<PlusIcon className="h-4 w-4" />}
                variant="outline"
                fullWidth
                className="justify-start"
              >
                Agregar Nuevo Suministro
              </DashboardButton>

              <DashboardButton
                onClick={() => console.log('Ver stock bajo')}
                leftIcon={<ExclamationTriangleIcon className="h-4 w-4" />}
                variant="outline"
                fullWidth
                className="justify-start"
                disabled={isLoading}
              >
                Ver Stock Bajo {!isLoading && dashboardData?.metrics?.low_stock_supplies ? `(${dashboardData.metrics.low_stock_supplies})` : ''}
              </DashboardButton>

              <DashboardButton
                onClick={() => console.log('Equipos disponibles')}
                leftIcon={<ComputerDesktopIcon className="h-4 w-4" />}
                variant="outline"
                fullWidth
                className="justify-start"
                disabled={isLoading}
              >
                Equipos Disponibles
              </DashboardButton>

              <DashboardButton
                onClick={() => console.log('Generar reporte')}
                leftIcon={<ClipboardDocumentListIcon className="h-4 w-4" />}
                variant="outline"
                fullWidth
                className="justify-start"
              >
                Generar Reporte
              </DashboardButton>
            </div>
          </DashboardCard>
        </div>

        {/* 🚀 RESUMEN POR CATEGORÍAS REAL */}
        {!isLoading && dashboardData?.categories_summary && dashboardData.categories_summary.length > 0 && (
          <DashboardCard>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Distribución por Categorías
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboardData.categories_summary.map((category) => (
                <div key={category.id} className="text-center p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">{category.name}</h4>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{category.count}</p>
                  <p className="text-sm text-gray-500">
                    {category.operational_count} operativos ({category.percentage}%)
                  </p>
                </div>
              ))}
            </div>
          </DashboardCard>
        )}

        {/* Loading state para categorías */}
        {isLoading && (
          <DashboardCard>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Distribución por Categorías
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="text-center p-4 bg-gray-50 rounded-lg animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                  <div className="h-8 bg-gray-200 rounded w-12 mx-auto mt-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 mx-auto mt-1"></div>
                </div>
              ))}
            </div>
          </DashboardCard>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InventoryDashboardPage;