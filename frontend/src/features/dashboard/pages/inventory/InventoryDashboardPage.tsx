// frontend/src/features/dashboard/pages/inventory/InventoryDashboardPage.tsx - CON INVENTORY LAYOUT

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import InventoryLayout from '../../components/layout/InventoryLayout';
import DashboardCard from '../../components/ui/DashboardCard';
import Badge from '../../components/ui/Badge';
import ApiErrorHandler from '../../../../components/common/ApiErrorHandler';

// Icons
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  DevicePhoneMobileIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MapPinIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';

// Hooks
import { useInventoryDashboard } from '../../../../services/inventory';
import { useInventorySearch } from '../../../../services/inventory';

const InventoryDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Estados locales
  const [searchValue, setSearchValue] = useState('');

  // Hooks de datos
  const { dashboardData, isLoading, error, refresh } = useInventoryDashboard();
  const { search, isSearching } = useInventorySearch();

  // ===== HANDLERS DE NAVEGACIÓN =====
  const handleMetricClick = useCallback((metricId: string) => {
    const metricRoutes: Record<string, string> = {
      'equipment': '/dashboard/inventory/equipment',
      'supplies': '/dashboard/inventory/supplies',
      'low_stock': '/dashboard/inventory/supplies?tab=alerts',
      'damaged': '/dashboard/inventory/equipment?filter=damaged',
      'utilization': '/dashboard/inventory/equipment?filter=assigned',
      'locations': '/dashboard/inventory/settings?tab=locations'
    };
    
    const route = metricRoutes[metricId];
    if (route) {
      navigate(route);
    }
  }, [navigate]);

  // ===== BÚSQUEDA =====
  const handleSearch = useCallback(async (value: string) => {
    setSearchValue(value);
    
    if (value.trim().length >= 2) {
      try {
        await search(value.trim(), 'all', 10);
        navigate(`/dashboard/inventory/search?q=${encodeURIComponent(value.trim())}`);
      } catch (error) {
        console.error('Error en búsqueda:', error);
      }
    }
  }, [search, navigate]);

  const handleSearchSubmit = useCallback(() => {
    if (searchValue.trim()) {
      handleSearch(searchValue);
    }
  }, [searchValue, handleSearch]);

  // ===== MANEJO DE ERRORES =====
  if (error) {
    return (
      <DashboardLayout>
        <InventoryLayout>
          <ApiErrorHandler 
            error={error} 
            onRetry={refresh} 
            resourceName="el dashboard de inventario"
          />
        </InventoryLayout>
      </DashboardLayout>
    );
  }

  // ===== MÉTRICAS PRINCIPALES =====
  const metrics = dashboardData?.metrics;
  const metricsData = [
    {
      id: 'equipment',
      title: 'Total Equipos',
      value: metrics?.total_equipment || 0,
      subtitle: 'equipos registrados',
      icon: <DevicePhoneMobileIcon className="h-5 w-5" />,
      bgColor: 'from-blue-50 to-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      id: 'supplies',
      title: 'Total Suministros',
      value: metrics?.total_supplies || 0,
      subtitle: 'suministros en stock',
      icon: <ArchiveBoxIcon className="h-5 w-5" />,
      bgColor: 'from-green-50 to-green-100',
      iconColor: 'text-green-600'
    },
    {
      id: 'low_stock',
      title: 'Stock Bajo',
      value: metrics?.low_stock_supplies || 0,
      subtitle: 'requieren reabastecimiento',
      icon: <ExclamationTriangleIcon className="h-5 w-5" />,
      bgColor: 'from-amber-50 to-amber-100',
      iconColor: 'text-amber-600',
      badge: (metrics?.low_stock_supplies || 0) > 0 ? (
        <Badge variant="warning" size="sm">Atención</Badge>
      ) : null
    },
    {
      id: 'damaged',
      title: 'Equipos Dañados',
      value: metrics?.damaged_equipment || 0,
      subtitle: 'necesitan mantenimiento',
      icon: <ExclamationTriangleIcon className="h-5 w-5" />,
      bgColor: 'from-red-50 to-red-100',
      iconColor: 'text-red-600',
      badge: (metrics?.damaged_equipment || 0) > 0 ? (
        <Badge variant="danger" size="sm">Crítico</Badge>
      ) : null
    },
    {
      id: 'utilization',
      title: 'Equipos Asignados',
      value: metrics?.assigned_equipment || 0,
      subtitle: 'equipos en uso',
      icon: <ChartPieIcon className="h-5 w-5" />,
      bgColor: 'from-purple-50 to-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      id: 'locations',
      title: 'Ubicaciones',
      value: dashboardData?.locations_summary?.length || 0,
      subtitle: 'ubicaciones activas',
      icon: <MapPinIcon className="h-5 w-5" />,
      bgColor: 'from-gray-50 to-gray-100',
      iconColor: 'text-gray-600'
    }
  ];

  return (
    <DashboardLayout>
      <InventoryLayout 
        title="Dashboard de Inventario" 
        subtitle="Vista general y métricas del sistema"
      >
        <div className="space-y-8">
          {/* Controles de búsqueda */}
          <DashboardCard>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Búsqueda Rápida</h2>
                <p className="text-sm text-gray-600">Encuentra equipos y suministros en todo el inventario</p>
              </div>

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
                        handleSearchSubmit();
                      }
                    }}
                    disabled={isSearching}
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleSearchSubmit}
                  disabled={!searchValue.trim() || isSearching}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSearching ? 'Buscando...' : 'Buscar'}
                </button>

                <button
                  onClick={refresh}
                  disabled={isLoading}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Actualizar datos"
                >
                  <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </DashboardCard>

          {/* Grid de Métricas Principales */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Métricas Principales</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {metricsData.map((metric) => (
                <div
                  key={metric.id}
                  onClick={() => handleMetricClick(metric.id)}
                  className={`
                    bg-gradient-to-br ${metric.bgColor} rounded-xl p-6 
                    cursor-pointer transition-all duration-200 
                    hover:shadow-lg hover:scale-105 border border-gray-200
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`${metric.iconColor} p-2 bg-white rounded-lg shadow-sm`}>
                          {metric.icon}
                        </div>
                        {metric.badge}
                      </div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">
                        {metric.title}
                      </h3>
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {metric.value}
                      </div>
                      <p className="text-xs text-gray-600">
                        {metric.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alertas Importantes - Solo si hay problemas */}
          {((metrics?.low_stock_supplies || 0) > 0 || (metrics?.damaged_equipment || 0) > 0) && (
            <DashboardCard
              title="Alertas Importantes"
              icon={<ExclamationTriangleIcon className="h-5 w-5" />}
              variant="bordered"
              className="border-amber-200 bg-amber-50"
            >
              <div className="space-y-3">
                {(metrics?.low_stock_supplies || 0) > 0 && (
                  <div 
                    className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
                    onClick={() => handleMetricClick('low_stock')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <ArchiveBoxIcon className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-yellow-900">
                          {metrics?.low_stock_supplies} Suministros con Stock Bajo
                        </p>
                        <p className="text-sm text-yellow-700">Requieren reabastecimiento pronto</p>
                      </div>
                    </div>
                    <Badge variant="warning" size="sm">Ver detalles</Badge>
                  </div>
                )}
                
                {(metrics?.damaged_equipment || 0) > 0 && (
                  <div 
                    className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                    onClick={() => handleMetricClick('damaged')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <DevicePhoneMobileIcon className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-red-900">
                          {metrics?.damaged_equipment} Equipos Dañados
                        </p>
                        <p className="text-sm text-red-700">Necesitan mantenimiento urgente</p>
                      </div>
                    </div>
                    <Badge variant="danger" size="sm">Ver detalles</Badge>
                  </div>
                )}
              </div>
            </DashboardCard>
          )}

          {/* Actividad Reciente del Inventario */}
          <DashboardCard
            title="Actividad Reciente"
            icon={<ArrowPathIcon className="h-5 w-5" />}
            variant="default"
          >
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3 p-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : dashboardData?.recent_activity && dashboardData.recent_activity.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recent_activity.slice(0, 5).map((activity, index) => {
                  const getActivityIcon = () => {
                    if (activity.type === 'equipment') {
                      return <DevicePhoneMobileIcon className="h-4 w-4 text-blue-600" />;
                    } else if (activity.type === 'supply') {
                      return <ArchiveBoxIcon className="h-4 w-4 text-green-600" />;
                    }
                    return <ArrowPathIcon className="h-4 w-4 text-gray-600" />;
                  };

                  const getActivityBg = () => {
                    if (activity.type === 'equipment') {
                      return 'bg-blue-50 border-blue-200';
                    } else if (activity.type === 'supply') {
                      return 'bg-green-50 border-green-200';
                    }
                    return 'bg-gray-50 border-gray-200';
                  };

                  return (
                    <div 
                      key={`activity-${index}`}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${getActivityBg()} hover:shadow-sm transition-shadow`}
                    >
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        {getActivityIcon()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleDateString('es', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {activity.equipment_code && (
                            <Badge variant="secondary" size="xs">
                              {activity.equipment_code}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {dashboardData.recent_activity.length > 5 && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => navigate('/dashboard/inventory/activity')}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Ver todas las actividades →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <ArrowPathIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-2">No hay actividad reciente</p>
                <p className="text-xs text-gray-400">Las nuevas actividades aparecerán aquí</p>
              </div>
            )}
          </DashboardCard>

          {/* Estado del Sistema - Solo si no hay alertas */}
          {(metrics?.low_stock_supplies || 0) === 0 && (metrics?.damaged_equipment || 0) === 0 && (
            <DashboardCard
              title="Estado del Inventario"
              icon={<CheckCircleIcon className="h-5 w-5" />}
              variant="bordered"
              className="border-green-200 bg-green-50"
            >
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-900">Todo en orden</p>
                  <p className="text-sm text-green-700">No hay alertas críticas en el inventario</p>
                </div>
              </div>
            </DashboardCard>
          )}
        </div>
      </InventoryLayout>
    </DashboardLayout>
  );
};

export default InventoryDashboardPage;