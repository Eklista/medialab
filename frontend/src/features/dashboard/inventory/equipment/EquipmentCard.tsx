// frontend/src/features/dashboard/inventory/equipment/EquipmentCard.tsx

import React from 'react';
import DashboardCard from '../../components/ui/DashboardCard';
import DashboardButton from '../../components/ui/DashboardButton';
import Badge, { StatusBadge } from '../../components/ui/Badge';
import { 
  ComputerDesktopIcon,
  UserIcon,
  MapPinIcon,
  BuildingStorefrontIcon,
  QrCodeIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  UserMinusIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

// ===== TIPOS =====
interface Equipment {
  id: number;
  codigo_ug?: string;
  numero_serie?: string;
  service_tag?: string;
  marca?: string;
  modelo?: string;
  descripcion?: string;
  
  // Relaciones expandidas
  category?: {
    id: number;
    name: string;
    is_equipment: boolean;
  };
  state?: {
    id: number;
    name: string;
    color: string;
    is_operational: boolean;
  };
  location?: {
    id: number;
    name: string;
    is_external: boolean;
  };
  supplier?: {
    id: number;
    name: string;
  };
  assigned_user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
  };
  
  // Fechas
  fecha_entrega?: string;
  created_at: string;
  updated_at: string;
  
  // Metadata adicional
  numero_hoja_envio?: string;
  observaciones?: string;
}

interface EquipmentCardProps {
  equipment: Equipment;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  selectable?: boolean;
  isSelected?: boolean;
  onSelect?: (equipment: Equipment) => void;
  onView?: (equipment: Equipment) => void;
  onEdit?: (equipment: Equipment) => void;
  onDelete?: (equipment: Equipment) => void;
  onAssign?: (equipment: Equipment) => void;
  onUnassign?: (equipment: Equipment) => void;
  onQrCode?: (equipment: Equipment) => void;
  className?: string;
}

// ===== HELPERS =====
const getEquipmentCode = (equipment: Equipment): string => {
  return equipment.codigo_ug || `#${equipment.id}`;
};

const getEquipmentTitle = (equipment: Equipment): string => {
  const brand = equipment.marca || '';
  const model = equipment.modelo || '';
  return `${brand} ${model}`.trim() || 'Equipo sin nombre';
};

const getStateVariant = (state?: Equipment['state']): 'success' | 'warning' | 'danger' | 'info' => {
  if (!state) return 'info';
  
  if (state.is_operational) {
    return 'success';
  } else {
    // Determinar variante por color o nombre del estado
    const colorMap: Record<string, 'warning' | 'danger'> = {
      'yellow': 'warning',
      'amber': 'warning',
      'orange': 'warning',
      'red': 'danger',
      'crimson': 'danger'
    };
    
    return colorMap[state.color?.toLowerCase()] || 'danger';
  }
};

// ===== COMPONENTE DE TARJETA COMPACTA =====
const CompactCard: React.FC<EquipmentCardProps> = ({
  equipment,
  showActions = true,
  selectable = false,
  isSelected = false,
  onSelect,
  onView,
  onEdit,
  onAssign,
  onUnassign,
  className = ''
}) => {
  return (
    <DashboardCard 
      className={`${className} ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
      hover={true}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {selectable && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect?.(equipment)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          )}
          
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <ComputerDesktopIcon className="h-5 w-5 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-gray-900 truncate">
                {getEquipmentCode(equipment)}
              </h4>
              {equipment.state && (
                <StatusBadge 
                  status={equipment.state.is_operational ? 'active' : 'inactive'}
                  size="sm"
                  showIcon={false}
                />
              )}
            </div>
            <p className="text-sm text-gray-600 truncate">
              {getEquipmentTitle(equipment)}
            </p>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
              {equipment.location && (
                <span className="flex items-center gap-1">
                  <MapPinIcon className="h-3 w-3" />
                  {equipment.location.name}
                </span>
              )}
              {equipment.assigned_user && (
                <span className="flex items-center gap-1">
                  <UserIcon className="h-3 w-3" />
                  {equipment.assigned_user.fullName}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {showActions && (
          <div className="flex items-center gap-1 flex-shrink-0 ml-3">
            {onView && (
              <DashboardButton
                variant="text"
                size="sm"
                onClick={() => onView(equipment)}
                leftIcon={<EyeIcon className="h-3 w-3" />}
                className="text-gray-500"
              >
                Ver
              </DashboardButton>
            )}
            
            {equipment.assigned_user ? (
              onUnassign && (
                <DashboardButton
                  variant="text"
                  size="sm"
                  onClick={() => onUnassign(equipment)}
                  leftIcon={<UserMinusIcon className="h-3 w-3" />}
                  className="text-orange-600"
                >
                  Desasignar
                </DashboardButton>
              )
            ) : (
              onAssign && (
                <DashboardButton
                  variant="text"
                  size="sm"
                  onClick={() => onAssign(equipment)}
                  leftIcon={<UserPlusIcon className="h-3 w-3" />}
                  className="text-green-600"
                >
                  Asignar
                </DashboardButton>
              )
            )}
          </div>
        )}
      </div>
    </DashboardCard>
  );
};

// ===== COMPONENTE DE TARJETA DETALLADA =====
const DetailedCard: React.FC<EquipmentCardProps> = ({
  equipment,
  showActions = true,
  selectable = false,
  isSelected = false,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onAssign,
  onUnassign,
  onQrCode,
  className = ''
}) => {
  return (
    <DashboardCard 
      className={`${className} ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
      hover={true}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {selectable && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect?.(equipment)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          )}
          
          <div className="p-3 bg-blue-100 rounded-lg">
            <ComputerDesktopIcon className="h-6 w-6 text-blue-600" />
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {getEquipmentCode(equipment)}
              </h3>
              {equipment.state && (
                <Badge 
                  variant={getStateVariant(equipment.state)}
                  size="sm"
                >
                  {equipment.state.name}
                </Badge>
              )}
            </div>
            <p className="text-gray-600">
              {getEquipmentTitle(equipment)}
            </p>
          </div>
        </div>
        
        {onQrCode && (
          <DashboardButton
            variant="outline"
            size="sm"
            onClick={() => onQrCode(equipment)}
            leftIcon={<QrCodeIcon className="h-4 w-4" />}
          >
            QR
          </DashboardButton>
        )}
      </div>
      
      {/* Contenido */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Información básica */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 text-sm">Información General</h4>
            
            {equipment.numero_serie && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Número de Serie:</span>
                <span className="font-medium text-gray-900">{equipment.numero_serie}</span>
              </div>
            )}
            
            {equipment.service_tag && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Service Tag:</span>
                <span className="font-medium text-gray-900">{equipment.service_tag}</span>
              </div>
            )}
            
            {equipment.category && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Categoría:</span>
                <Badge variant="secondary" size="sm">{equipment.category.name}</Badge>
              </div>
            )}
            
            {equipment.fecha_entrega && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fecha de Entrega:</span>
                <span className="font-medium text-gray-900">
                  {new Date(equipment.fecha_entrega).toLocaleDateString('es-GT')}
                </span>
              </div>
            )}
          </div>
          
          {/* Ubicación y asignación */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 text-sm">Ubicación y Asignación</h4>
            
            {equipment.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPinIcon className="h-4 w-4 text-gray-500" />
                <span className="text-gray-500">Ubicación:</span>
                <span className="font-medium text-gray-900">{equipment.location.name}</span>
                {equipment.location.is_external && (
                  <Badge variant="info" size="xs">Externa</Badge>
                )}
              </div>
            )}
            
            {equipment.assigned_user ? (
              <div className="flex items-center gap-2 text-sm">
                <UserIcon className="h-4 w-4 text-green-500" />
                <span className="text-gray-500">Asignado a:</span>
                <span className="font-medium text-gray-900">{equipment.assigned_user.fullName}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <UserIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Estado:</span>
                <Badge variant="neutral" size="sm">Disponible</Badge>
              </div>
            )}
            
            {equipment.supplier && (
              <div className="flex items-center gap-2 text-sm">
                <BuildingStorefrontIcon className="h-4 w-4 text-gray-500" />
                <span className="text-gray-500">Proveedor:</span>
                <span className="font-medium text-gray-900">{equipment.supplier.name}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Descripción */}
        {equipment.descripcion && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 text-sm mb-2">Descripción</h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              {equipment.descripcion}
            </p>
          </div>
        )}
        
        {/* Observaciones */}
        {equipment.observaciones && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 text-sm mb-2">Observaciones</h4>
            <p className="text-sm text-gray-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
              {equipment.observaciones}
            </p>
          </div>
        )}
        
        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <CalendarDaysIcon className="h-3 w-3" />
              Creado: {new Date(equipment.created_at).toLocaleDateString('es-GT')}
            </span>
            {equipment.numero_hoja_envio && (
              <span className="flex items-center gap-1">
                <ClipboardDocumentListIcon className="h-3 w-3" />
                Hoja: {equipment.numero_hoja_envio}
              </span>
            )}
          </div>
          
          <span>
            ID: {equipment.id}
          </span>
        </div>
      </div>
      
      {/* Acciones */}
      {showActions && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex gap-2">
            {onView && (
              <DashboardButton
                variant="outline"
                size="sm"
                onClick={() => onView(equipment)}
                leftIcon={<EyeIcon className="h-4 w-4" />}
              >
                Ver Detalles
              </DashboardButton>
            )}
            
            {onEdit && (
              <DashboardButton
                variant="outline"
                size="sm"
                onClick={() => onEdit(equipment)}
                leftIcon={<PencilIcon className="h-4 w-4" />}
              >
                Editar
              </DashboardButton>
            )}
          </div>
          
          <div className="flex gap-2">
            {equipment.assigned_user ? (
              onUnassign && (
                <DashboardButton
                  variant="outline"
                  size="sm"
                  onClick={() => onUnassign(equipment)}
                  leftIcon={<UserMinusIcon className="h-4 w-4" />}
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  Desasignar
                </DashboardButton>
              )
            ) : (
              onAssign && (
                <DashboardButton
                  variant="outline"
                  size="sm"
                  onClick={() => onAssign(equipment)}
                  leftIcon={<UserPlusIcon className="h-4 w-4" />}
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  Asignar
                </DashboardButton>
              )
            )}
            
            {onDelete && (
              <DashboardButton
                variant="outline"
                size="sm"
                onClick={() => onDelete(equipment)}
                leftIcon={<TrashIcon className="h-4 w-4" />}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Eliminar
              </DashboardButton>
            )}
          </div>
        </div>
      )}
    </DashboardCard>
  );
};

// ===== COMPONENTE PRINCIPAL =====
const EquipmentCard: React.FC<EquipmentCardProps> = ({ variant = 'default', ...props }) => {
  if (variant === 'compact') {
    return <CompactCard {...props} />;
  }
  
  if (variant === 'detailed') {
    return <DetailedCard {...props} />;
  }
  
  // Variante por defecto - intermedia
  return (
    <DashboardCard 
      className={`${props.className || ''} ${props.isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
      hover={true}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {props.selectable && (
              <input
                type="checkbox"
                checked={props.isSelected}
                onChange={() => props.onSelect?.(props.equipment)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            )}
            
            <div className="p-2 bg-blue-100 rounded-lg">
              <ComputerDesktopIcon className="h-5 w-5 text-blue-600" />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">
                  {getEquipmentCode(props.equipment)}
                </h3>
                {props.equipment.state && (
                  <Badge 
                    variant={getStateVariant(props.equipment.state)}
                    size="sm"
                  >
                    {props.equipment.state.name}
                  </Badge>
                )}
              </div>
              <p className="text-gray-600">
                {getEquipmentTitle(props.equipment)}
              </p>
            </div>
          </div>
          
          {props.onQrCode && (
            <DashboardButton
              variant="text"
              size="sm"
              onClick={() => props.onQrCode!(props.equipment)}
              leftIcon={<QrCodeIcon className="h-4 w-4" />}
            />
          )}
        </div>
        
        <div className="space-y-2 text-sm">
          {props.equipment.location && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPinIcon className="h-4 w-4" />
              <span>{props.equipment.location.name}</span>
              {props.equipment.location.is_external && (
                <Badge variant="info" size="xs">Externa</Badge>
              )}
            </div>
          )}
          
          {props.equipment.assigned_user ? (
            <div className="flex items-center gap-2 text-gray-600">
              <UserIcon className="h-4 w-4 text-green-500" />
              <span>Asignado a: {props.equipment.assigned_user.fullName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-600">
              <UserIcon className="h-4 w-4 text-gray-400" />
              <Badge variant="neutral" size="sm">Disponible</Badge>
            </div>
          )}
          
          {props.equipment.category && (
            <div className="flex items-center gap-2 text-gray-600">
              <span>Categoría:</span>
              <Badge variant="secondary" size="sm">{props.equipment.category.name}</Badge>
            </div>
          )}
        </div>
        
        {props.showActions && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
            <div className="flex gap-2">
              {props.onView && (
                <DashboardButton
                  variant="text"
                  size="sm"
                  onClick={() => props.onView!(props.equipment)}
                  leftIcon={<EyeIcon className="h-4 w-4" />}
                >
                  Ver
                </DashboardButton>
              )}
              
              {props.onEdit && (
                <DashboardButton
                  variant="text"
                  size="sm"
                  onClick={() => props.onEdit!(props.equipment)}
                  leftIcon={<PencilIcon className="h-4 w-4" />}
                >
                  Editar
                </DashboardButton>
              )}
            </div>
            
            <div className="flex gap-2">
              {props.equipment.assigned_user ? (
                props.onUnassign && (
                  <DashboardButton
                    variant="text"
                    size="sm"
                    onClick={() => props.onUnassign!(props.equipment)}
                    leftIcon={<UserMinusIcon className="h-4 w-4" />}
                    className="text-orange-600"
                  >
                    Desasignar
                  </DashboardButton>
                )
              ) : (
                props.onAssign && (
                  <DashboardButton
                    variant="text"
                    size="sm"
                    onClick={() => props.onAssign!(props.equipment)}
                    leftIcon={<UserPlusIcon className="h-4 w-4" />}
                    className="text-green-600"
                  >
                    Asignar
                  </DashboardButton>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardCard>
  );
};

export default EquipmentCard;