// frontend/src/features/dashboard/inventory/common/QuickActions.tsx

import React from 'react';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardCard from '../../components/ui/DashboardCard';
import Badge from '../../components/ui/Badge';
import { 
  PlusIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  QrCodeIcon,
  PrinterIcon,
  ClipboardDocumentListIcon,
  UserPlusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  CogIcon,
  ChartBarIcon,
  TagIcon,
  MapPinIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';

// ===== TIPOS =====
interface ActionItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'gradient';
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'danger' | 'info';
  };
  permission?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}

interface QuickActionsProps {
  type?: 'dashboard' | 'equipment' | 'supplies' | 'settings';
  actions?: ActionItem[];
  layout?: 'grid' | 'list' | 'horizontal' | 'compact';
  title?: string;
  subtitle?: string;
  showTitle?: boolean;
  alertCounts?: {
    lowStock?: number;
    damaged?: number;
    unassigned?: number;
  };
  className?: string;
  onCustomAction?: (actionId: string) => void;
}

interface ActionCardProps {
  action: ActionItem;
  layout: 'grid' | 'list' | 'horizontal' | 'compact';
  className?: string;
}

// ===== COMPONENTE DE ACCIÓN INDIVIDUAL =====
const ActionCard: React.FC<ActionCardProps> = ({ action, layout, className = '' }) => {
  const getButtonVariant = () => {
    if (action.variant) return action.variant;
    return action.color === 'primary' ? 'primary' : 'outline';
  };

  const getButtonSize = () => {
    switch (layout) {
      case 'compact':
        return 'sm';
      case 'horizontal':
        return 'md';
      default:
        return 'md';
    }
  };

  if (layout === 'list') {
    return (
      <div className={`flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors ${className}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <span className="h-5 w-5 text-gray-600 flex items-center justify-center">
              {action.icon}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900">{action.label}</h4>
              {action.badge && (
                <Badge variant={action.badge.variant} size="xs">
                  {action.badge.text}
                </Badge>
              )}
            </div>
            {action.description && (
              <p className="text-sm text-gray-500">{action.description}</p>
            )}
          </div>
        </div>
        
        <DashboardButton
          variant={getButtonVariant()}
          size="sm"
          onClick={action.onClick}
          disabled={action.disabled}
          loading={action.loading}
        >
          Ejecutar
        </DashboardButton>
      </div>
    );
  }

  if (layout === 'horizontal') {
    return (
      <DashboardButton
        variant={getButtonVariant()}
        size={getButtonSize()}
        onClick={action.onClick}
        disabled={action.disabled}
        loading={action.loading}
        leftIcon={action.icon}
        className={`flex-shrink-0 ${className}`}
      >
        <span className="flex items-center gap-2">
          {action.label}
          {action.badge && (
            <Badge variant={action.badge.variant} size="xs">
              {action.badge.text}
            </Badge>
          )}
        </span>
      </DashboardButton>
    );
  }

  // Layout grid o compact
  return (
    <DashboardButton
      variant={getButtonVariant()}
      size={getButtonSize()}
      onClick={action.onClick}
      disabled={action.disabled}
      loading={action.loading}
      leftIcon={action.icon}
      fullWidth
      className={`justify-start text-left h-auto py-3 ${className}`}
    >
      <div className="flex items-center justify-between w-full">
        <div>
          <div className="font-medium">{action.label}</div>
          {action.description && layout !== 'compact' && (
            <div className="text-xs opacity-75 mt-1">{action.description}</div>
          )}
        </div>
        {action.badge && (
          <Badge variant={action.badge.variant} size="xs" className="ml-2">
            {action.badge.text}
          </Badge>
        )}
      </div>
    </DashboardButton>
  );
};

// ===== CONFIGURACIONES DE ACCIONES POR DEFECTO =====
const getDefaultActions = (
  type: string, 
  alertCounts: any = {}, 
  onAction: (actionId: string) => void
): ActionItem[] => {
  const commonActions = {
    dashboard: [
      {
        id: 'add_equipment',
        label: 'Nuevo Equipo',
        description: 'Registrar equipo tecnológico',
        icon: <PlusIcon className="h-5 w-5" />,
        variant: 'primary' as const,
        onClick: () => onAction('add_equipment')
      },
      {
        id: 'add_supply',
        label: 'Nuevo Suministro',
        description: 'Agregar material o insumo',
        icon: <PlusIcon className="h-5 w-5" />,
        variant: 'primary' as const,
        onClick: () => onAction('add_supply')
      },
      {
        id: 'view_alerts',
        label: 'Ver Alertas',
        description: 'Stock bajo y equipos dañados',
        icon: <ExclamationTriangleIcon className="h-5 w-5" />,
        variant: 'outline' as const,
        badge: (alertCounts.lowStock || 0) + (alertCounts.damaged || 0) > 0 ? {
          text: ((alertCounts.lowStock || 0) + (alertCounts.damaged || 0)).toString(),
          variant: 'warning' as const
        } : undefined,
        onClick: () => onAction('view_alerts')
      },
      {
        id: 'quick_search',
        label: 'Búsqueda Rápida',
        description: 'Buscar equipos o suministros',
        icon: <MagnifyingGlassIcon className="h-5 w-5" />,
        variant: 'outline' as const,
        onClick: () => onAction('quick_search')
      },
      {
        id: 'generate_report',
        label: 'Generar Reporte',
        description: 'Informes de inventario',
        icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
        variant: 'outline' as const,
        onClick: () => onAction('generate_report')
      },
      {
        id: 'import_data',
        label: 'Importar Datos',
        description: 'Subir archivo CSV/Excel',
        icon: <DocumentArrowUpIcon className="h-5 w-5" />,
        variant: 'outline' as const,
        onClick: () => onAction('import_data')
      }
    ],

    equipment: [
      {
        id: 'add_equipment',
        label: 'Nuevo Equipo',
        icon: <PlusIcon className="h-5 w-5" />,
        variant: 'primary' as const,
        onClick: () => onAction('add_equipment')
      },
      {
        id: 'bulk_assign',
        label: 'Asignación Masiva',
        description: 'Asignar múltiples equipos',
        icon: <UserPlusIcon className="h-5 w-5" />,
        variant: 'outline' as const,
        onClick: () => onAction('bulk_assign')
      },
      {
        id: 'scan_qr',
        label: 'Escanear QR',
        description: 'Buscar por código QR',
        icon: <QrCodeIcon className="h-5 w-5" />,
        variant: 'outline' as const,
        onClick: () => onAction('scan_qr')
      },
      {
        id: 'print_labels',
        label: 'Imprimir Etiquetas',
        description: 'Códigos QR para equipos',
        icon: <PrinterIcon className="h-5 w-5" />,
        variant: 'outline' as const,
        onClick: () => onAction('print_labels')
      },
      {
        id: 'export_equipment',
        label: 'Exportar',
        description: 'Descargar lista completa',
        icon: <DocumentArrowDownIcon className="h-5 w-5" />,
        variant: 'outline' as const,
        onClick: () => onAction('export_equipment')
      },
      {
        id: 'sync_equipment',
        label: 'Sincronizar',
        description: 'Actualizar desde SEGA',
        icon: <ArrowPathIcon className="h-5 w-5" />,
        variant: 'outline' as const,
        onClick: () => onAction('sync_equipment')
      }
    ],

    supplies: [
      {
        id: 'add_supply',
        label: 'Nuevo Suministro',
        icon: <PlusIcon className="h-5 w-5" />,
        variant: 'primary' as const,
        onClick: () => onAction('add_supply')
      },
      {
        id: 'stock_movement',
        label: 'Movimiento Stock',
        description: 'Entrada/Salida rápida',
        icon: <ArrowPathIcon className="h-5 w-5" />,
        variant: 'primary' as const,
        onClick: () => onAction('stock_movement')
      },
      {
        id: 'low_stock_alert',
        label: 'Stock Bajo',
        description: 'Revisar suministros críticos',
        icon: <ExclamationTriangleIcon className="h-5 w-5" />,
        variant: 'outline' as const,
        badge: alertCounts.lowStock > 0 ? {
          text: alertCounts.lowStock.toString(),
          variant: 'warning' as const
        } : undefined,
        onClick: () => onAction('low_stock_alert')
      },
      {
        id: 'inventory_count',
        label: 'Conteo Físico',
        description: 'Verificar inventario',
        icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
        variant: 'outline' as const,
        onClick: () => onAction('inventory_count')
      },
      {
        id: 'export_supplies',
        label: 'Exportar',
        description: 'Descargar inventario',
        icon: <DocumentArrowDownIcon className="h-5 w-5" />,
        variant: 'outline' as const,
        onClick: () => onAction('export_supplies')
      },
      {
        id: 'purchase_request',
        label: 'Solicitar Compra',
        description: 'Generar orden de compra',
        icon: <BuildingStorefrontIcon className="h-5 w-5" />,
        variant: 'outline' as const,
        onClick: () => onAction('purchase_request')
      }
    ],

    settings: [
      {
        id: 'manage_categories',
        label: 'Categorías',
        description: 'Gestionar clasificaciones',
        icon: <TagIcon className="h-5 w-5" />,
        variant: 'outline' as const,
        onClick: () => onAction('manage_categories')
      },
      {
        id: 'manage_locations',
        label: 'Ubicaciones',
        description: 'Configurar espacios físicos',
        icon: <MapPinIcon className="h-5 w-5" />,
        variant: 'outline' as const,
        onClick: () => onAction('manage_locations')
      },
      {
        id: 'manage_suppliers',
        label: 'Proveedores',
        description: 'Datos de contacto',
        icon: <BuildingStorefrontIcon className="h-5 w-5" />,
        variant: 'outline' as const,
        onClick: () => onAction('manage_suppliers')
      },
      {
        id: 'system_settings',
        label: 'Configuración',
        description: 'Parámetros del sistema',
        icon: <CogIcon className="h-5 w-5" />,
        variant: 'outline' as const,
        onClick: () => onAction('system_settings')
      },
      {
        id: 'view_reports',
        label: 'Reportes',
        description: 'Análisis y métricas',
        icon: <ChartBarIcon className="h-5 w-5" />,
        variant: 'outline' as const,
        onClick: () => onAction('view_reports')
      },
      {
        id: 'backup_data',
        label: 'Respaldo',
        description: 'Exportar configuración',
        icon: <DocumentArrowDownIcon className="h-5 w-5" />,
        variant: 'outline' as const,
        onClick: () => onAction('backup_data')
      }
    ]
  };

  return commonActions[type as keyof typeof commonActions] || [];
};

// ===== COMPONENTE PRINCIPAL =====
const QuickActions: React.FC<QuickActionsProps> = ({
  type = 'dashboard',
  actions,
  layout = 'grid',
  title,
  subtitle,
  showTitle = true,
  alertCounts = {},
  className = '',
  onCustomAction
}) => {
  const handleAction = (actionId: string) => {
    onCustomAction?.(actionId);
  };

  const actionItems = actions || getDefaultActions(type, alertCounts, handleAction);

  const getContainerClasses = () => {
    switch (layout) {
      case 'list':
        return 'space-y-2';
      case 'horizontal':
        return 'flex flex-wrap gap-3';
      case 'compact':
        return 'grid grid-cols-2 md:grid-cols-3 gap-2';
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3';
    }
  };

  const getTitle = () => {
    if (title) return title;
    
    const titles = {
      dashboard: 'Acciones Rápidas',
      equipment: 'Gestión de Equipos',
      supplies: 'Gestión de Suministros',
      settings: 'Configuración'
    };
    
    return titles[type];
  };

  const getSubtitle = () => {
    if (subtitle) return subtitle;
    
    const subtitles = {
      dashboard: 'Accesos directos a las funciones más utilizadas',
      equipment: 'Operaciones comunes para equipos',
      supplies: 'Operaciones comunes para suministros',
      settings: 'Configuración del sistema de inventario'
    };
    
    return subtitles[type];
  };

  if (layout === 'horizontal') {
    return (
      <div className={`space-y-3 ${className}`}>
        {showTitle && (
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{getTitle()}</h3>
              {getSubtitle() && (
                <p className="text-sm text-gray-500">{getSubtitle()}</p>
              )}
            </div>
          </div>
        )}
        
        <div className={getContainerClasses()}>
          {actionItems.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              layout={layout}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <DashboardCard className={className}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{getTitle()}</h3>
            {getSubtitle() && (
              <p className="text-sm text-gray-500 mt-1">{getSubtitle()}</p>
            )}
          </div>
          
          {type === 'dashboard' && Object.values(alertCounts).some(count => count > 0) && (
            <Badge variant="warning" size="sm">
              {Object.values(alertCounts).reduce((sum: number, count: any) => sum + (count || 0), 0)} alertas
            </Badge>
          )}
        </div>
      )}
      
      <div className={getContainerClasses()}>
        {actionItems.map((action) => (
          <ActionCard
            key={action.id}
            action={action}
            layout={layout}
          />
        ))}
      </div>
    </DashboardCard>
  );
};

// ===== COMPONENTE DE ACCIONES FLOTANTES =====
export const FloatingActions: React.FC<{
  actions: ActionItem[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}> = ({ actions, position = 'bottom-right', className = '' }) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6'
  };

  return (
    <div className={`${positionClasses[position]} z-50 space-y-3 ${className}`}>
      {actions.map((action) => (
        <DashboardButton
          key={action.id}
          variant={action.variant || 'primary'}
          size="lg"
          onClick={action.onClick}
          disabled={action.disabled}
          loading={action.loading}
          className="shadow-lg hover:shadow-xl transition-shadow rounded-full w-14 h-14 p-0"
          title={action.label}
        >
          {action.icon}
        </DashboardButton>
      ))}
    </div>
  );
};

// ===== COMPONENTE DE BARRA DE ACCIONES =====
export const ActionsBar: React.FC<{
  primaryActions: ActionItem[];
  secondaryActions?: ActionItem[];
  className?: string;
}> = ({ primaryActions, secondaryActions = [], className = '' }) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex gap-3">
        {primaryActions.map((action) => (
          <DashboardButton
            key={action.id}
            variant={action.variant || 'primary'}
            size="md"
            onClick={action.onClick}
            disabled={action.disabled}
            loading={action.loading}
            leftIcon={action.icon}
          >
            {action.label}
          </DashboardButton>
        ))}
      </div>
      
      {secondaryActions.length > 0 && (
        <div className="flex gap-2">
          {secondaryActions.map((action) => (
            <DashboardButton
              key={action.id}
              variant="outline"
              size="md"
              onClick={action.onClick}
              disabled={action.disabled}
              loading={action.loading}
              leftIcon={action.icon}
            >
              {action.label}
            </DashboardButton>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuickActions;