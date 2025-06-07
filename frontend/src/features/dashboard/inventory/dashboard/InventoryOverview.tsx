// frontend/src/features/dashboard/inventory/dashboard/InventoryOverview.tsx

import React from 'react';
import DashboardCard from '../../components/ui/DashboardCard';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardTabs, { DashboardTabPanel, useDashboardTabs } from '../../components/ui/DashboardTabs';
import Badge from '../../components/ui/Badge';
import InventoryStats from '../common/InventoryStats';
import QuickActions from '../common/QuickActions';
import { 
  ComputerDesktopIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

// ===== TIPOS =====
interface OverviewData {
  metrics?: {
    total_equipment?: number;
    active_equipment?: number;
    damaged_equipment?: number;
    assigned_equipment?: number;
    total_supplies?: number;
    low_stock_supplies?: number;
    out_of_stock_supplies?: number;
    recent_movements?: number;
  };
  recentActivity?: Array<{
    id: string;
    type: 'equipment' | 'supply' | 'assignment' | 'movement';
    title: string;
    description: string;
    timestamp: string;
    user?: string;
    status?: 'success' | 'warning' | 'error';
  }>;
  topCategories?: Array<{
    id: number;
    name: string;
    count: number;
    percentage: number;
  }>;
  topLocations?: Array<{
    id: number;
    name: string;
    count: number;
    is_external: boolean;
  }>;
  alerts?: Array<{
    id: string;
    type: 'low_stock' | 'damaged' | 'unassigned' | 'expired';
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    count: number;
  }>;
}

interface InventoryOverviewProps {
  data: OverviewData;
  isLoading?: boolean;
  onRefresh?: () => void;
  onNavigate?: (section: string, id?: string) => void;
  className?: string;
}

interface RecentActivityItemProps {
  activity: {
    id: string;
    type: 'equipment' | 'supply' | 'assignment' | 'movement';
    title: string;
    description: string;
    timestamp: string;
    user?: string;
    status?: 'success' | 'warning' | 'error';
  };
  onView?: () => void;
}

interface AlertItemProps {
  alert: {
    id: string;
    type: 'low_stock' | 'damaged' | 'unassigned' | 'expired';
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    count: number;
  };
  onResolve?: () => void;
  onView?: () => void;
}

// ===== COMPONENTE DE ACTIVIDAD RECIENTE =====
const RecentActivityItem: React.FC<RecentActivityItemProps> = ({ activity, onView }) => {
  const getIcon = () => {
    switch (activity.type) {
      case 'equipment':
        return <ComputerDesktopIcon className="h-5 w-5 text-blue-600" />;
      case 'supply':
        return <CubeIcon className="h-5 w-5 text-green-600" />;
      case 'assignment':
        return <UserIcon className="h-5 w-5 text-purple-600" />;
      case 'movement':
        return <ArrowPathIcon className="h-5 w-5 text-amber-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = () => {
    if (!activity.status) return null;
    
    const variants: Record<string, 'success' | 'warning' | 'danger'> = {
      success: 'success',
      warning: 'warning',
      error: 'danger'
    };

    return (
      <Badge variant={variants[activity.status]} size="xs">
        {activity.status}
      </Badge>
    );
  };

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex-shrink-0 mt-1">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {activity.title}
          </h4>
          {getStatusBadge()}
        </div>
        
        <p className="text-sm text-gray-600 mb-1">
          {activity.description}
        </p>
        
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {new Date(activity.timestamp).toLocaleString('es-GT', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
            {activity.user && ` • ${activity.user}`}
          </p>
          
          {onView && (
            <DashboardButton
              variant="text"
              size="sm"
              onClick={onView}
              leftIcon={<EyeIcon className="h-3 w-3" />}
              className="text-xs"
            >
              Ver
            </DashboardButton>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== COMPONENTE DE ALERTA =====
const AlertItem: React.FC<AlertItemProps> = ({ alert, onResolve, onView }) => {
  const getSeverityColor = () => {
    switch (alert.severity) {
      case 'critical':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const getIcon = () => {
    switch (alert.type) {
      case 'low_stock':
        return <CubeIcon className="h-5 w-5 text-amber-600" />;
      case 'damaged':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
      case 'unassigned':
        return <ComputerDesktopIcon className="h-5 w-5 text-blue-600" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className={`border-l-4 p-4 ${getSeverityColor()}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-gray-900">
              {alert.title}
            </h4>
            <Badge variant="neutral" size="xs">
              {alert.count}
            </Badge>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">
            {alert.description}
          </p>
          
          <div className="flex gap-2">
            {onView && (
              <DashboardButton
                variant="outline"
                size="sm"
                onClick={onView}
                leftIcon={<EyeIcon className="h-3 w-3" />}
              >
                Ver detalles
              </DashboardButton>
            )}
            {onResolve && (
              <DashboardButton
                variant="primary"
                size="sm"
                onClick={onResolve}
              >
                Resolver
              </DashboardButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== COMPONENTE PRINCIPAL =====
const InventoryOverview: React.FC<InventoryOverviewProps> = ({
  data,
  isLoading = false,
  onRefresh,
  onNavigate,
  className = ''
}) => {
  const { activeTabId, createTab } = useDashboardTabs('overview');

  // Crear tabs
  const tabs = [
    createTab('overview', 'Resumen General', {
      icon: <ChartBarIcon className="h-4 w-4" />
    }),
    createTab('activity', 'Actividad Reciente', {
      icon: <ClockIcon className="h-4 w-4" />,
      count: data.recentActivity?.length || 0
    }),
    createTab('alerts', 'Alertas', {
      icon: <ExclamationTriangleIcon className="h-4 w-4" />,
      count: data.alerts?.length || 0,
      badge: data.alerts && data.alerts.length > 0 ? (
        <Badge variant="danger" size="xs">
          {data.alerts.length}
        </Badge>
      ) : undefined
    }),
    createTab('distribution', 'Distribución', {
      icon: <MapPinIcon className="h-4 w-4" />
    })
  ];

  const handleQuickAction = (actionId: string) => {
    onNavigate?.(actionId);
  };

  const handleMetricClick = (metricType: string) => {
    onNavigate?.(metricType);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con acciones */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Vista General del Inventario
          </h2>
          <p className="text-gray-600 mt-1">
            Resumen completo del estado actual del inventario
          </p>
        </div>
        
        <div className="flex gap-3">
          {onRefresh && (
            <DashboardButton
              variant="outline"
              onClick={onRefresh}
              leftIcon={<ArrowPathIcon className="h-4 w-4" />}
              loading={isLoading}
            >
              Actualizar
            </DashboardButton>
          )}
        </div>
      </div>

      {/* Métricas principales */}
      <InventoryStats
        metrics={data.metrics}
        variant="dashboard"
        showTrends={true}
        isLoading={isLoading}
        onStatClick={handleMetricClick}
      />

      {/* Tabs de contenido */}
      <DashboardCard>
        <DashboardTabs
          tabs={tabs}
          variant="underline"
          size="md"
        />

        {/* Panel de Resumen General */}
        <DashboardTabPanel tabId="overview" isActive={activeTabId === 'overview'}>
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Acciones rápidas */}
            <div>
              <QuickActions
                type="dashboard"
                layout="list"
                showTitle={true}
                alertCounts={{
                  lowStock: data.metrics?.low_stock_supplies || 0,
                  damaged: data.metrics?.damaged_equipment || 0
                }}
                onCustomAction={handleQuickAction}
              />
            </div>

            {/* Resumen de categorías */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top Categorías
              </h3>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : data.topCategories && data.topCategories.length > 0 ? (
                <div className="space-y-4">
                  {data.topCategories.slice(0, 5).map((category) => (
                    <div 
                      key={category.id}
                      className="cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                      onClick={() => onNavigate?.('category', category.id.toString())}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {category.name}
                        </h4>
                        <span className="text-sm text-gray-600">
                          {category.count} items
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {category.percentage.toFixed(1)}% del total
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <ChartBarIcon className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-sm">No hay datos de categorías</p>
                </div>
              )}
            </div>
          </div>
        </DashboardTabPanel>

        {/* Panel de Actividad Reciente */}
        <DashboardTabPanel tabId="activity" isActive={activeTabId === 'activity'}>
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Actividad Reciente
              </h3>
              {data.recentActivity && data.recentActivity.length > 5 && (
                <DashboardButton
                  variant="text"
                  size="sm"
                  onClick={() => onNavigate?.('activity')}
                >
                  Ver todo
                </DashboardButton>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse flex items-start gap-3 p-3">
                    <div className="h-5 w-5 bg-gray-200 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : data.recentActivity && data.recentActivity.length > 0 ? (
              <div className="space-y-1">
                {data.recentActivity.slice(0, 10).map((activity) => (
                  <RecentActivityItem
                    key={activity.id}
                    activity={activity}
                    onView={() => onNavigate?.('activity', activity.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <p className="text-sm">No hay actividad reciente</p>
              </div>
            )}
          </div>
        </DashboardTabPanel>

        {/* Panel de Alertas */}
        <DashboardTabPanel tabId="alerts" isActive={activeTabId === 'alerts'}>
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Alertas del Sistema
              </h3>
              {data.alerts && data.alerts.length > 0 && (
                <Badge variant="danger" size="sm">
                  {data.alerts.length} alertas activas
                </Badge>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse border-l-4 border-gray-200 p-4 bg-gray-50">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="h-8 bg-gray-200 rounded w-24"></div>
                  </div>
                ))}
              </div>
            ) : data.alerts && data.alerts.length > 0 ? (
              <div className="space-y-4">
                {data.alerts.map((alert) => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    onView={() => onNavigate?.(alert.type, alert.id)}
                    onResolve={() => onNavigate?.('resolve_alert', alert.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <p className="text-sm">No hay alertas activas</p>
                <p className="text-xs mt-1">¡Todo está funcionando correctamente!</p>
              </div>
            )}
          </div>
        </DashboardTabPanel>

        {/* Panel de Distribución */}
        <DashboardTabPanel tabId="distribution" isActive={activeTabId === 'distribution'}>
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribución por ubicaciones */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Por Ubicaciones
              </h3>
              
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : data.topLocations && data.topLocations.length > 0 ? (
                <div className="space-y-3">
                  {data.topLocations.map((location) => (
                    <div 
                      key={location.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => onNavigate?.('location', location.id.toString())}
                    >
                      <div className="flex items-center gap-3">
                        <MapPinIcon className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {location.name}
                          </p>
                          {location.is_external && (
                            <Badge variant="info" size="xs">
                              Externa
                            </Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">
                        {location.count} items
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <MapPinIcon className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm">No hay datos de ubicaciones</p>
                </div>
              )}
            </div>

            {/* Estadísticas adicionales */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Estadísticas Adicionales
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ComputerDesktopIcon className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">
                        Tasa de Utilización
                      </p>
                      <p className="text-sm text-blue-700">
                        {data.metrics?.total_equipment ? 
                          ((data.metrics.assigned_equipment || 0) / data.metrics.total_equipment * 100).toFixed(1) 
                          : 0}% equipos asignados
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CubeIcon className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">
                        Estado del Stock
                      </p>
                      <p className="text-sm text-green-700">
                        {data.metrics?.total_supplies ? 
                          (((data.metrics.total_supplies - (data.metrics.low_stock_supplies || 0)) / data.metrics.total_supplies) * 100).toFixed(1)
                          : 0}% en buen estado
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ClockIcon className="h-6 w-6 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-900">
                        Movimientos Recientes
                      </p>
                      <p className="text-sm text-amber-700">
                        {data.metrics?.recent_movements || 0} en los últimos 7 días
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DashboardTabPanel>
      </DashboardCard>
    </div>
  );
};

// ===== COMPONENTE RESUMEN COMPACTO =====
export const CompactOverview: React.FC<{
  data: OverviewData;
  onNavigate?: (section: string) => void;
  className?: string;
}> = ({ data, onNavigate, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      <div 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onNavigate?.('equipment')}
      >
        <DashboardCard>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <ComputerDesktopIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {data.metrics?.total_equipment || 0}
              </p>
              <p className="text-sm text-gray-600">
                Equipos • {data.metrics?.active_equipment || 0} activos
              </p>
            </div>
          </div>
        </DashboardCard>
      </div>

      <div 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onNavigate?.('supplies')}
      >
        <DashboardCard>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-full">
              <CubeIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {data.metrics?.total_supplies || 0}
              </p>
              <p className="text-sm text-gray-600">
                Suministros • {data.metrics?.low_stock_supplies || 0} stock bajo
              </p>
            </div>
          </div>
        </DashboardCard>
      </div>

      <div 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onNavigate?.('alerts')}
      >
        <DashboardCard>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-full">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {(data.metrics?.damaged_equipment || 0) + (data.metrics?.low_stock_supplies || 0)}
              </p>
              <p className="text-sm text-gray-600">
                Alertas activas
              </p>
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
};

export default InventoryOverview;