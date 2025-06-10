// frontend/src/features/dashboard/components/layout/InventoryLayout.tsx

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Badge from '../ui/Badge';

// Icons
import { 
  ChartBarIcon,
  ComputerDesktopIcon,
  CubeIcon,
  Cog6ToothIcon,
  DocumentChartBarIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Hooks para obtener datos para badges
import { useInventoryDashboard, useSuppliesList, useEquipmentList } from '../../../../services/inventory';

interface InventoryLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  description: string;
  badge?: {
    count?: number;
    variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'gradient';
    text?: string;
  };
  isActive?: boolean;
}

const InventoryLayout: React.FC<InventoryLayoutProps> = ({
  children,
  title,
  subtitle,
  className = ''
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hooks para obtener datos de badges
  const { dashboardData } = useInventoryDashboard();
  const { lowStockSupplies } = useSuppliesList();
  const { equipment } = useEquipmentList();

  // Calcular métricas para badges
  const metrics = dashboardData?.metrics;
  const damagedEquipment = equipment.filter(eq => !eq.state?.is_operational).length;

  // Configuración de navegación
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard/inventory',
      icon: <ChartBarIcon className="h-5 w-5" />,
      description: 'Vista general y métricas',
      isActive: location.pathname === '/dashboard/inventory'
    },
    {
      id: 'equipment',
      label: 'Equipos',
      path: '/dashboard/inventory/equipment',
      icon: <ComputerDesktopIcon className="h-5 w-5" />,
      description: 'Gestión de equipos tecnológicos',
      badge: damagedEquipment > 0 ? {
        count: damagedEquipment,
        variant: 'danger',
        text: `${damagedEquipment} dañados`
      } : undefined,
      isActive: location.pathname.startsWith('/dashboard/inventory/equipment')
    },
    {
      id: 'supplies',
      label: 'Suministros',
      path: '/dashboard/inventory/supplies',
      icon: <CubeIcon className="h-5 w-5" />,
      description: 'Control de stock e inventario',
      badge: lowStockSupplies.length > 0 ? {
        count: lowStockSupplies.length,
        variant: 'danger',
        text: `${lowStockSupplies.length} stock bajo`
      } : undefined,
      isActive: location.pathname.startsWith('/dashboard/inventory/supplies')
    },
    {
      id: 'search',
      label: 'Búsqueda',
      path: '/dashboard/inventory/search',
      icon: <MagnifyingGlassIcon className="h-5 w-5" />,
      description: 'Búsqueda avanzada en inventario',
      isActive: location.pathname.startsWith('/dashboard/inventory/search')
    },
    {
      id: 'reports',
      label: 'Reportes',
      path: '/dashboard/inventory/reports',
      icon: <DocumentChartBarIcon className="h-5 w-5" />,
      description: 'Análisis y reportes detallados',
      isActive: location.pathname.startsWith('/dashboard/inventory/reports')
    },
    {
      id: 'settings',
      label: 'Configuración',
      path: '/dashboard/inventory/settings',
      icon: <Cog6ToothIcon className="h-5 w-5" />,
      description: 'Categorías, ubicaciones y ajustes',
      isActive: location.pathname.startsWith('/dashboard/inventory/settings')
    }
  ];

  // Handler para navegación
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  // Renderizar badge
  const renderBadge = (badge?: NavigationItem['badge']) => {
    if (!badge) return null;

    return (
      <Badge 
        variant={badge.variant} 
        size="sm"
        className="ml-auto"
      >
        {badge.count || badge.text}
      </Badge>
    );
  };

  // Detectar si hay alertas críticas
  const criticalAlerts = (lowStockSupplies.length + damagedEquipment);

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header de Inventario con Navegación por Pestañas */}
      <div className="bg-white border-b border-gray-200">
        {/* Header principal */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {title || 'Sistema de Inventario'}
              </h1>
              {subtitle && (
                <p className="text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>

            {/* Indicadores de estado */}
            <div className="flex items-center gap-4">
              {/* Estado general */}
              {criticalAlerts === 0 ? (
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-green-700 font-medium">Todo en orden</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                  <span className="text-sm text-amber-700 font-medium">
                    {criticalAlerts} alertas activas
                  </span>
                </div>
              )}

              {/* Métricas rápidas */}
              {metrics && (
                <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <ComputerDesktopIcon className="h-4 w-4" />
                    <span>{metrics.total_equipment} equipos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CubeIcon className="h-4 w-4" />
                    <span>{metrics.total_supplies} suministros</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navegación por pestañas */}
        <div className="px-6">
          <nav className="flex space-x-8 overflow-x-auto" aria-label="Navegación de inventario">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className={`
                  group flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200
                  ${item.isActive
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className={`
                  flex-shrink-0 transition-colors duration-200
                  ${item.isActive ? 'text-black' : 'text-gray-400 group-hover:text-gray-600'}
                `}>
                  {item.icon}
                </span>
                
                <span>{item.label}</span>
                
                {item.badge && (
                  <span className="ml-1">
                    {renderBadge(item.badge)}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Alertas de estado (solo si hay alertas críticas) */}
        {criticalAlerts > 0 && (
          <div className="px-6 py-3 bg-amber-50 border-t border-amber-200">
            <div className="flex items-center justify-center gap-6">
              {/* Alertas de stock */}
              {lowStockSupplies.length > 0 && (
                <button 
                  className="flex items-center gap-2 text-sm text-amber-700 hover:text-amber-900 transition-colors"
                  onClick={() => handleNavigate('/dashboard/inventory/supplies?tab=alerts')}
                >
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <span className="font-medium">{lowStockSupplies.length} suministros con stock bajo</span>
                  <Badge variant="warning" size="sm">
                    Ver
                  </Badge>
                </button>
              )}

              {/* Equipos dañados */}
              {damagedEquipment > 0 && (
                <button 
                  className="flex items-center gap-2 text-sm text-red-700 hover:text-red-900 transition-colors"
                  onClick={() => handleNavigate('/dashboard/inventory/equipment?filter=damaged')}
                >
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <span className="font-medium">{damagedEquipment} equipos necesitan mantenimiento</span>
                  <Badge variant="danger" size="sm">
                    Ver
                  </Badge>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Contenido principal - SIN PADDING, A RAS DEL MAIN */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

export default InventoryLayout;