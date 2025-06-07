// frontend/src/features/dashboard/inventory/common/InventoryStats.tsx

import React from 'react';
import DashboardCard from '../../components/ui/DashboardCard';
import Badge from '../../components/ui/Badge';
import { 
  ComputerDesktopIcon,
  CubeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  UserGroupIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

// ===== TIPOS =====
interface InventoryStatsProps {
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
  };
  className?: string;
  layout?: 'grid' | 'horizontal' | 'compact';
  variant?: 'default' | 'dashboard' | 'summary';
  showTrends?: boolean;
  isLoading?: boolean;
  onStatClick?: (statType: string, value: number) => void;
}

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'gray';
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
    period: string;
  };
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'danger' | 'info';
  };
  onClick?: () => void;
  isLoading?: boolean;
}

// ===== COMPONENTE DE TARJETA INDIVIDUAL =====
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
  badge,
  onClick,
  isLoading
}) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
    gray: 'bg-gray-100 text-gray-600'
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case 'up':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />;
      case 'down':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />;
      default:
        return <MinusIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return 'text-gray-500';
    return trend.direction === 'up' ? 'text-green-600' : 
           trend.direction === 'down' ? 'text-red-600' : 'text-gray-500';
  };

  if (isLoading) {
    return (
      <DashboardCard className="animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
          <div className={`p-3 rounded-full bg-gray-200`}>
            <div className="h-6 w-6 bg-gray-300 rounded"></div>
          </div>
        </div>
      </DashboardCard>
    );
  }

  return (
    <div 
      className={`${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <DashboardCard>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-600 truncate">
                {title}
              </p>
              {badge && (
                <Badge variant={badge.variant} size="xs">
                  {badge.text}
                </Badge>
              )}
            </div>
            
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {value.toLocaleString()}
            </p>
            
            <div className="flex items-center gap-2">
              {subtitle && (
                <p className="text-xs text-gray-500 truncate">
                  {subtitle}
                </p>
              )}
              
              {trend && (
                <div className="flex items-center gap-1">
                  {getTrendIcon()}
                  <span className={`text-xs font-medium ${getTrendColor()}`}>
                    {Math.abs(trend.value)}%
                  </span>
                  <span className="text-xs text-gray-400">
                    {trend.period}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className={`p-3 rounded-full ${colorClasses[color]} flex-shrink-0 ml-4`}>
            <span className="h-6 w-6 flex items-center justify-center">
              {icon}
            </span>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
};

// ===== COMPONENTE PRINCIPAL =====
const InventoryStats: React.FC<InventoryStatsProps> = ({
  metrics = {},
  className = '',
  layout = 'grid',
  variant = 'default',
  showTrends = false,
  isLoading = false,
  onStatClick
}) => {
  // Calcular estadísticas derivadas
  const equipmentAssignmentRate = metrics.total_equipment ? 
    ((metrics.assigned_equipment || 0) / metrics.total_equipment * 100) : 0;
  
  const equipmentHealthRate = metrics.total_equipment ? 
    ((metrics.active_equipment || 0) / metrics.total_equipment * 100) : 0;
  
  const suppliesAlertRate = metrics.total_supplies ? 
    (((metrics.low_stock_supplies || 0) + (metrics.out_of_stock_supplies || 0)) / metrics.total_supplies * 100) : 0;

  // Configuración de las estadísticas según la variante
  const getStatsConfig = () => {
    const baseStats = [
      {
        key: 'total_equipment',
        title: 'Total Equipos',
        value: metrics.total_equipment || 0,
        subtitle: `${metrics.active_equipment || 0} operativos`,
        icon: <ComputerDesktopIcon className="h-6 w-6" />,
        color: 'blue' as const,
        badge: equipmentHealthRate < 80 ? { text: 'Revisar', variant: 'warning' as const } : undefined,
        trend: undefined
      },
      {
        key: 'total_supplies',
        title: 'Total Suministros',
        value: metrics.total_supplies || 0,
        subtitle: `${metrics.low_stock_supplies || 0} stock bajo`,
        icon: <CubeIcon className="h-6 w-6" />,
        color: 'green' as const,
        badge: (metrics.low_stock_supplies || 0) > 0 ? { text: 'Alertas', variant: 'warning' as const } : undefined,
        trend: undefined
      },
      {
        key: 'assigned_equipment',
        title: 'Equipos Asignados',
        value: metrics.assigned_equipment || 0,
        subtitle: `${equipmentAssignmentRate.toFixed(1)}% del total`,
        icon: <CheckCircleIcon className="h-6 w-6" />,
        color: 'purple' as const,
        badge: undefined,
        trend: showTrends ? {
          value: 5.2,
          direction: 'up' as const,
          period: '30d'
        } : undefined
      },
      {
        key: 'alerts',
        title: 'Requieren Atención',
        value: (metrics.damaged_equipment || 0) + (metrics.low_stock_supplies || 0) + (metrics.out_of_stock_supplies || 0),
        subtitle: 'Equipos y suministros',
        icon: <ExclamationTriangleIcon className="h-6 w-6" />,
        color: 'amber' as const,
        badge: suppliesAlertRate > 20 ? { text: 'Urgente', variant: 'danger' as const } : undefined,
        trend: undefined
      }
    ];

    if (variant === 'dashboard') {
      return [
        ...baseStats,
        {
          key: 'categories',
          title: 'Categorías',
          value: metrics.total_categories || 0,
          subtitle: 'Activas',
          icon: <UserGroupIcon className="h-6 w-6" />,
          color: 'gray' as const,
          badge: undefined,
          trend: undefined
        },
        {
          key: 'locations',
          title: 'Ubicaciones',
          value: metrics.total_locations || 0,
          subtitle: 'Registradas',
          icon: <MapPinIcon className="h-6 w-6" />,
          color: 'gray' as const,
          badge: undefined,
          trend: undefined
        }
      ];
    }

    if (variant === 'summary') {
      return baseStats.filter(stat => 
        ['total_equipment', 'total_supplies', 'alerts'].includes(stat.key)
      );
    }

    return baseStats;
  };

  const statsConfig = getStatsConfig();

  // Estilos según el layout
  const getLayoutClasses = () => {
    switch (layout) {
      case 'horizontal':
        return 'flex flex-wrap gap-4';
      case 'compact':
        return 'grid grid-cols-2 md:grid-cols-4 gap-3';
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';
    }
  };

  return (
    <div className={`${getLayoutClasses()} ${className}`}>
      {statsConfig.map((stat) => (
        <StatCard
          key={stat.key}
          title={stat.title}
          value={stat.value}
          subtitle={stat.subtitle}
          icon={stat.icon}
          color={stat.color}
          trend={stat.trend}
          badge={stat.badge}
          onClick={() => onStatClick?.(stat.key, stat.value)}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};

// ===== COMPONENTE DE ESTADÍSTICAS RÁPIDAS =====
export const QuickStats: React.FC<{
  totalEquipment: number;
  totalSupplies: number;
  alerts: number;
  isLoading?: boolean;
  className?: string;
}> = ({ totalEquipment, totalSupplies, alerts, isLoading, className = '' }) => {
  return (
    <div className={`flex gap-6 ${className}`}>
      <div className="text-center">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-8 w-12 bg-gray-200 rounded mx-auto mb-1"></div>
            <div className="h-4 w-16 bg-gray-200 rounded mx-auto"></div>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-blue-600">{totalEquipment}</div>
            <div className="text-sm text-gray-500">Equipos</div>
          </>
        )}
      </div>
      
      <div className="text-center">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-8 w-12 bg-gray-200 rounded mx-auto mb-1"></div>
            <div className="h-4 w-20 bg-gray-200 rounded mx-auto"></div>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-green-600">{totalSupplies}</div>
            <div className="text-sm text-gray-500">Suministros</div>
          </>
        )}
      </div>
      
      {alerts > 0 && (
        <div className="text-center">
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 w-8 bg-gray-200 rounded mx-auto mb-1"></div>
              <div className="h-4 w-12 bg-gray-200 rounded mx-auto"></div>
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold text-amber-600">{alerts}</div>
              <div className="text-sm text-gray-500">Alertas</div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ===== COMPONENTE DE MÉTRICAS DETALLADAS =====
export const DetailedMetrics: React.FC<{
  metrics: any;
  period?: string;
  showComparison?: boolean;
  className?: string;
}> = ({ metrics, period = '30 días', showComparison = false, className = '' }) => {
  return (
    <DashboardCard className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Métricas Detalladas
        </h3>
        <Badge variant="info" size="sm">
          {period}
        </Badge>
      </div>
      
      <InventoryStats 
        metrics={metrics}
        variant="dashboard"
        showTrends={showComparison}
        layout="grid"
      />
    </DashboardCard>
  );
};

export default InventoryStats;