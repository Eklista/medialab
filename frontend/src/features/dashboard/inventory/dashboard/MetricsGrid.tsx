// frontend/src/features/dashboard/inventory/dashboard/MetricsGrid.tsx

import React from 'react';
import DashboardCard from '../../components/ui/DashboardCard';
import Badge from '../../components/ui/Badge';
import { 
  ComputerDesktopIcon,
  CubeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  MapPinIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

// ===== TIPOS =====
interface MetricCard {
  id: string;
  title: string;
  value: number | string;
  subtitle?: string;
  description?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'gray' | 'indigo' | 'cyan';
  format?: 'number' | 'currency' | 'percentage' | 'text';
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
    period: string;
    isGood?: boolean;
  };
  status?: 'normal' | 'warning' | 'critical' | 'success';
  clickable?: boolean;
  onClick?: () => void;
}

interface CategoryMetric {
  id: number;
  name: string;
  count: number;
  operational_count: number;
  percentage: number;
  color?: string;
}

interface LocationMetric {
  id: number;
  name: string;
  count: number;
  percentage: number;
  is_external: boolean;
}

interface MetricsGridProps {
  metrics?: {
    total_equipment?: number;
    active_equipment?: number;
    damaged_equipment?: number;
    assigned_equipment?: number;
    total_supplies?: number;
    low_stock_supplies?: number;
    out_of_stock_supplies?: number;
    total_categories?: number;
    total_locations?: number;
    recent_movements?: number;
    total_value?: number;
    monthly_movements?: number;
  };
  categories?: CategoryMetric[];
  locations?: LocationMetric[];
  showTrends?: boolean;
  showBreakdown?: boolean;
  isLoading?: boolean;
  className?: string;
  onMetricClick?: (metricId: string) => void;
}

interface MetricCardComponentProps {
  metric: MetricCard;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// ===== HELPERS =====
const formatValue = (value: number | string, format?: string): string => {
  if (typeof value === 'string') return value;
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('es-GT', {
        style: 'currency',
        currency: 'GTQ'
      }).format(value);
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'number':
    default:
      return value.toLocaleString();
  }
};

const getTrendIcon = (direction: string) => {
  switch (direction) {
    case 'up':
      return <ArrowTrendingUpIcon className="h-4 w-4" />;
    case 'down':
      return <ArrowTrendingDownIcon className="h-4 w-4" />;
    default:
      return <MinusIcon className="h-4 w-4" />;
  }
};

const getTrendColor = (direction: string, isGood?: boolean) => {
  if (direction === 'stable') return 'text-gray-500';
  
  if (isGood !== undefined) {
    return (direction === 'up' && isGood) || (direction === 'down' && !isGood) 
      ? 'text-green-600' 
      : 'text-red-600';
  }
  
  return direction === 'up' ? 'text-green-600' : 'text-red-600';
};

// ===== COMPONENTE DE TARJETA MÉTRICA =====
const MetricCardComponent: React.FC<MetricCardComponentProps> = ({ 
  metric, 
  isLoading, 
  size = 'md' 
}) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
    gray: 'bg-gray-100 text-gray-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    cyan: 'bg-cyan-100 text-cyan-600'
  };

  const statusBadgeVariant = {
    normal: undefined,
    warning: 'warning' as const,
    critical: 'danger' as const,
    success: 'success' as const
  };

  const sizeClasses = {
    sm: { 
      padding: 'p-4', 
      icon: 'p-2', 
      text: 'text-lg',
      iconSize: 'h-5 w-5'
    },
    md: { 
      padding: 'p-5', 
      icon: 'p-3', 
      text: 'text-2xl',
      iconSize: 'h-6 w-6'
    },
    lg: { 
      padding: 'p-6', 
      icon: 'p-4', 
      text: 'text-3xl',
      iconSize: 'h-8 w-8'
    }
  };

  const currentSizeClasses = sizeClasses[size];

  if (isLoading) {
    return (
      <DashboardCard className="animate-pulse">
        <div className={`flex items-center justify-between ${currentSizeClasses.padding}`}>
          <div className="space-y-3 flex-1">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
          <div className={`${currentSizeClasses.icon} rounded-full bg-gray-200`}>
            <div className={`${currentSizeClasses.iconSize} bg-gray-300 rounded`}></div>
          </div>
        </div>
      </DashboardCard>
    );
  }

  return (
    <div 
      className={metric.clickable ? 'cursor-pointer' : ''}
      onClick={metric.onClick}
    >
      <DashboardCard 
        className={`${metric.clickable ? 'hover:shadow-md transition-shadow' : ''}`}
        hover={metric.clickable}
      >
        <div className={`flex items-center justify-between ${currentSizeClasses.padding}`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 truncate">
                {metric.title}
              </h3>
              {metric.status && statusBadgeVariant[metric.status] && (
                <Badge variant={statusBadgeVariant[metric.status]} size="xs">
                  {metric.status}
                </Badge>
              )}
            </div>
            
            <p className={`font-bold text-gray-900 mb-2 ${currentSizeClasses.text}`}>
              {formatValue(metric.value, metric.format)}
            </p>
            
            <div className="space-y-1">
              {metric.subtitle && (
                <p className="text-xs text-gray-500">
                  {metric.subtitle}
                </p>
              )}
              
              {metric.trend && (
                <div className="flex items-center gap-1">
                  {getTrendIcon(metric.trend.direction)}
                  <span className={`text-xs font-medium ${getTrendColor(metric.trend.direction, metric.trend.isGood)}`}>
                    {metric.trend.value > 0 ? '+' : ''}{metric.trend.value}%
                  </span>
                  <span className="text-xs text-gray-400">
                    {metric.trend.period}
                  </span>
                </div>
              )}
              
              {metric.description && (
                <p className="text-xs text-gray-400 line-clamp-2">
                  {metric.description}
                </p>
              )}
            </div>
          </div>
          
          <div className={`${currentSizeClasses.icon} rounded-full ${colorClasses[metric.color]} flex-shrink-0 ml-4`}>
            <span className={`${currentSizeClasses.iconSize} flex items-center justify-center`}>
              {metric.icon}
            </span>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
};

// ===== COMPONENTE PRINCIPAL =====
const MetricsGrid: React.FC<MetricsGridProps> = ({
  metrics = {},
  categories = [],
  locations = [],
  showTrends = false,
  showBreakdown = false,
  isLoading = false,
  className = '',
  onMetricClick
}) => {
  // Calcular métricas derivadas
  const equipmentUtilization = metrics.total_equipment ? 
    (metrics.assigned_equipment || 0) / metrics.total_equipment * 100 : 0;
  
  const equipmentHealth = metrics.total_equipment ? 
    (metrics.active_equipment || 0) / metrics.total_equipment * 100 : 0;
  
  // Configuración de métricas principales
  const mainMetrics: MetricCard[] = [
    {
      id: 'total_equipment',
      title: 'Total Equipos',
      value: metrics.total_equipment || 0,
      subtitle: `${metrics.active_equipment || 0} operativos (${equipmentHealth.toFixed(1)}%)`,
      icon: <ComputerDesktopIcon className="h-6 w-6" />,
      color: 'blue',
      trend: showTrends ? {
        value: 2.5,
        direction: 'up',
        period: '30d',
        isGood: true
      } : undefined,
      status: equipmentHealth < 80 ? 'warning' : 'normal',
      clickable: true,
      onClick: () => onMetricClick?.('equipment')
    },
    {
      id: 'total_supplies',
      title: 'Total Suministros',
      value: metrics.total_supplies || 0,
      subtitle: `${metrics.low_stock_supplies || 0} con stock bajo`,
      icon: <CubeIcon className="h-6 w-6" />,
      color: 'green',
      trend: showTrends ? {
        value: -1.2,
        direction: 'down',
        period: '30d',
        isGood: false
      } : undefined,
      status: (metrics.low_stock_supplies || 0) > 0 ? 'warning' : 'normal',
      clickable: true,
      onClick: () => onMetricClick?.('supplies')
    },
    {
      id: 'equipment_utilization',
      title: 'Utilización Equipos',
      value: equipmentUtilization,
      format: 'percentage',
      subtitle: `${metrics.assigned_equipment || 0} de ${metrics.total_equipment || 0} asignados`,
      icon: <CheckCircleIcon className="h-6 w-6" />,
      color: 'purple',
      trend: showTrends ? {
        value: 8.3,
        direction: 'up',
        period: '30d',
        isGood: true
      } : undefined,
      status: equipmentUtilization > 80 ? 'success' : equipmentUtilization > 60 ? 'normal' : 'warning',
      clickable: true,
      onClick: () => onMetricClick?.('utilization')
    },
    {
      id: 'alerts',
      title: 'Alertas Activas',
      value: (metrics.damaged_equipment || 0) + (metrics.low_stock_supplies || 0) + (metrics.out_of_stock_supplies || 0),
      subtitle: 'Requieren atención inmediata',
      icon: <ExclamationTriangleIcon className="h-6 w-6" />,
      color: 'red',
      status: ((metrics.damaged_equipment || 0) + (metrics.low_stock_supplies || 0)) > 0 ? 'critical' : 'normal',
      clickable: true,
      onClick: () => onMetricClick?.('alerts')
    }
  ];

  // Métricas secundarias
  const secondaryMetrics: MetricCard[] = [
    {
      id: 'categories',
      title: 'Categorías Activas',
      value: metrics.total_categories || 0,
      subtitle: 'Clasificaciones configuradas',
      icon: <UserGroupIcon className="h-6 w-6" />,
      color: 'indigo',
      clickable: true,
      onClick: () => onMetricClick?.('categories')
    },
    {
      id: 'locations',
      title: 'Ubicaciones',
      value: metrics.total_locations || 0,
      subtitle: 'Espacios físicos registrados',
      icon: <MapPinIcon className="h-6 w-6" />,
      color: 'cyan',
      clickable: true,
      onClick: () => onMetricClick?.('locations')
    },
    {
      id: 'recent_activity',
      title: 'Movimientos Recientes',
      value: metrics.recent_movements || 0,
      subtitle: 'Últimos 7 días',
      icon: <ClockIcon className="h-6 w-6" />,
      color: 'gray',
      clickable: true,
      onClick: () => onMetricClick?.('activity')
    },
    {
      id: 'total_value',
      title: 'Valor Total Estimado',
      value: metrics.total_value || 0,
      format: 'currency',
      subtitle: 'Inventario completo',
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
      color: 'amber',
      clickable: true,
      onClick: () => onMetricClick?.('value')
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Métricas principales */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Métricas Principales
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mainMetrics.map((metric) => (
            <MetricCardComponent
              key={metric.id}
              metric={metric}
              isLoading={isLoading}
              size="md"
            />
          ))}
        </div>
      </div>

      {/* Métricas secundarias */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Información Adicional
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {secondaryMetrics.map((metric) => (
            <MetricCardComponent
              key={metric.id}
              metric={metric}
              isLoading={isLoading}
              size="sm"
            />
          ))}
        </div>
      </div>

      {/* Desglose por categorías */}
      {showBreakdown && categories.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribución por Categorías
          </h3>
          <DashboardCard>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div 
                  key={category.id}
                  className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => onMetricClick?.(`category_${category.id}`)}
                >
                  <h4 className="font-medium text-gray-900 mb-2">
                    {category.name}
                  </h4>
                  <p className="text-2xl font-bold text-blue-600 mb-1">
                    {category.count}
                  </p>
                  <p className="text-sm text-gray-500">
                    {category.operational_count} operativos
                  </p>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {category.percentage.toFixed(1)}% del total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      )}

      {/* Desglose por ubicaciones */}
      {showBreakdown && locations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribución por Ubicaciones
          </h3>
          <DashboardCard>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {locations.map((location) => (
                <div 
                  key={location.id}
                  className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => onMetricClick?.(`location_${location.id}`)}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">
                      {location.name}
                    </h4>
                    {location.is_external && (
                      <Badge variant="info" size="xs">
                        Externa
                      </Badge>
                    )}
                  </div>
                  <p className="text-xl font-bold text-green-600 mb-1">
                    {location.count}
                  </p>
                  <p className="text-xs text-gray-500">
                    {location.percentage.toFixed(1)}% del total
                  </p>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      )}
    </div>
  );
};

// ===== COMPONENTE DE MÉTRICAS COMPACTAS =====
export const CompactMetrics: React.FC<{
  metrics: any;
  onMetricClick?: (metricId: string) => void;
  className?: string;
}> = ({ metrics, onMetricClick, className = '' }) => {
  const compactMetrics: MetricCard[] = [
    {
      id: 'equipment',
      title: 'Equipos',
      value: metrics.total_equipment || 0,
      icon: <ComputerDesktopIcon className="h-5 w-5" />,
      color: 'blue',
      clickable: true,
      onClick: () => onMetricClick?.('equipment')
    },
    {
      id: 'supplies',
      title: 'Suministros',
      value: metrics.total_supplies || 0,
      icon: <CubeIcon className="h-5 w-5" />,
      color: 'green',
      clickable: true,
      onClick: () => onMetricClick?.('supplies')
    },
    {
      id: 'alerts',
      title: 'Alertas',
      value: (metrics.damaged_equipment || 0) + (metrics.low_stock_supplies || 0),
      icon: <ExclamationTriangleIcon className="h-5 w-5" />,
      color: 'red',
      clickable: true,
      onClick: () => onMetricClick?.('alerts')
    }
  ];

  return (
    <div className={`flex gap-4 ${className}`}>
      {compactMetrics.map((metric) => (
        <MetricCardComponent
          key={metric.id}
          metric={metric}
          size="sm"
        />
      ))}
    </div>
  );
};

export default MetricsGrid;