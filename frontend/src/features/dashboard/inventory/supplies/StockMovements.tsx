import React, { useState, useEffect } from 'react';
import { 
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UserIcon,
  DocumentTextIcon,
  ClockIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

// Importar componentes UI
import DashboardModal from '../../components/ui/DashboardModal';
import DashboardCard from '../../components/ui/DashboardCard';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardTextInput from '../../components/ui/DashboardTextInput';
import DashboardTextArea from '../../components/ui/DashboardTextArea';
import DashboardSelect from '../../components/ui/DashboardSelect';
import DashboardDataTable from '../../components/ui/DashboardDataTable';
import Badge from '../../components/ui/Badge';
import DashboardTabs, { useDashboardTabs } from '../../components/ui/DashboardTabs';

// Importar hooks y tipos
import { useSuppliesList, useInventoryCommon } from '../../../../services/inventory/hooks';
import type { 
  SupplyWithDetails, 
  SupplyMovementWithDetails
} from '../../../../services/inventory/types';
interface StockMovementsProps {
  supply?: SupplyWithDetails | null; // Si se pasa, es para un suministro específico
  onClose?: () => void;
  className?: string;
}

interface MovementFormData {
  supply_id: string;
  movement_type_id: string;
  cantidad: string;
  numero_envio: string;
  user_receives_id: string;
  user_delivers_to_id: string;
  observaciones: string;
}

interface MovementFormErrors {
  supply_id?: string;
  movement_type_id?: string;
  cantidad?: string;
  general?: string;
}

const StockMovements: React.FC<StockMovementsProps> = ({
  supply = null,
  onClose,
  className = ''
}) => {
  // Estados
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<SupplyWithDetails | null>(supply);
  const [movements, setMovements] = useState<SupplyMovementWithDetails[]>([]);

  // Estados del formulario
  const [formData, setFormData] = useState<MovementFormData>({
    supply_id: supply?.id.toString() || '',
    movement_type_id: '',
    cantidad: '',
    numero_envio: '',
    user_receives_id: '',
    user_delivers_to_id: '',
    observaciones: ''
  });

  const [errors, setErrors] = useState<MovementFormErrors>({});

  // Hooks
  const { supplies, createMovement } = useSuppliesList();
  const { movementTypes } = useInventoryCommon();
  const { activeTabId, createTab } = useDashboardTabs('all');

  // Datos simulados de usuarios (en producción vendrían de un hook de usuarios)
  const users = [
    { id: 1, name: 'Juan Pérez', email: 'juan@example.com' },
    { id: 2, name: 'María García', email: 'maria@example.com' },
    { id: 3, name: 'Carlos López', email: 'carlos@example.com' }
  ];

  // Simular movimientos para mostrar (en producción vendrían del backend)
  useEffect(() => {
    if (selectedSupply) {
      // Aquí cargarías los movimientos reales del backend
      setMovements([
        {
          id: 1,
          supply_id: selectedSupply.id,
          movement_type_id: 1,
          cantidad: 50,
          numero_envio: 'ENV-001',
          fecha_movimiento: '2024-03-15T10:30:00Z',
          observaciones: 'Compra inicial de inventario',
          created_by_id: 1,
          supply: selectedSupply,
          movement_type: { 
            id: 1, 
            name: 'ENTRADA', 
            affects_stock: 1, 
            is_active: true,
            created_at: '2024-03-15T10:30:00Z',
            updated_at: '2024-03-15T10:30:00Z'
          },
          created_by: { id: 1, firstName: 'Juan', lastName: 'Pérez', email: 'juan@example.com', fullName: 'Juan Pérez' },
          created_at: '2024-03-15T10:30:00Z',
          updated_at: '2024-03-15T10:30:00Z'
        },
        {
          id: 2,
          supply_id: selectedSupply.id,
          movement_type_id: 2,
          cantidad: 10,
          numero_envio: '',
          fecha_movimiento: '2024-03-16T14:20:00Z',
          observaciones: 'Entrega para oficina principal',
          created_by_id: 2,
          user_delivers_to_id: 3,
          supply: selectedSupply,
          movement_type: { 
            id: 2, 
            name: 'SALIDA', 
            affects_stock: -1,
            is_active: true,
            created_at: '2024-03-16T14:20:00Z',
            updated_at: '2024-03-16T14:20:00Z'
          },
          created_by: { id: 2, firstName: 'María', lastName: 'García', email: 'maria@example.com', fullName: 'María García' },
          user_delivers_to: { id: 3, firstName: 'Carlos', lastName: 'López', email: 'carlos@example.com', fullName: 'Carlos López' },
          created_at: '2024-03-16T14:20:00Z',
          updated_at: '2024-03-16T14:20:00Z'
        }
      ]);
    }
  }, [selectedSupply]);

  // Opciones para selects
  const supplyOptions = supplies.map(sup => ({
    value: sup.id.toString(),
    label: `${sup.codigo || sup.id} - ${sup.nombre_producto}`
  }));

  const movementTypeOptions = movementTypes
    .filter(mt => mt.is_active)
    .map(mt => ({
      value: mt.id.toString(),
      label: mt.name,
      disabled: false
    }));

  const userOptions = users.map(user => ({
    value: user.id.toString(),
    label: user.name
  }));

  // Filtrar movimientos según la pestaña activa
  const filteredMovements = React.useMemo(() => {
    switch (activeTabId) {
      case 'entradas':
        return movements.filter(mov => mov.movement_type?.affects_stock && mov.movement_type.affects_stock > 0);
      case 'salidas':
        return movements.filter(mov => mov.movement_type?.affects_stock && mov.movement_type.affects_stock < 0);
      case 'ajustes':
        return movements.filter(mov => !mov.movement_type?.affects_stock || mov.movement_type.affects_stock === 0);
      default:
        return movements;
    }
  }, [activeTabId, movements]);

  // Validación del formulario
  const validateForm = (): boolean => {
    const newErrors: MovementFormErrors = {};

    if (!formData.supply_id) {
      newErrors.supply_id = 'Debe seleccionar un suministro';
    }

    if (!formData.movement_type_id) {
      newErrors.movement_type_id = 'Debe seleccionar un tipo de movimiento';
    }

    const cantidad = parseInt(formData.cantidad);
    if (!formData.cantidad || isNaN(cantidad) || cantidad <= 0) {
      newErrors.cantidad = 'La cantidad debe ser un número mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name as keyof MovementFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name as keyof MovementFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    // Si cambia el suministro, actualizar el suministro seleccionado
    if (name === 'supply_id' && value) {
      const newSupply = supplies.find(s => s.id.toString() === value);
      setSelectedSupply(newSupply || null);
    }
  };

  // Enviar formulario
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const movementData = {
        supply_id: parseInt(formData.supply_id),
        movement_type_id: parseInt(formData.movement_type_id),
        cantidad: parseInt(formData.cantidad),
        numero_envio: formData.numero_envio || undefined,
        user_receives_id: formData.user_receives_id ? parseInt(formData.user_receives_id) : undefined,
        user_delivers_to_id: formData.user_delivers_to_id ? parseInt(formData.user_delivers_to_id) : undefined,
        observaciones: formData.observaciones || undefined
      };

      await createMovement(movementData);
      
      setSubmitSuccess(true);
      
      // Resetear formulario después de éxito
      setTimeout(() => {
        setFormData({
          supply_id: supply?.id.toString() || '',
          movement_type_id: '',
          cantidad: '',
          numero_envio: '',
          user_receives_id: '',
          user_delivers_to_id: '',
          observaciones: ''
        });
        setShowCreateForm(false);
        setSubmitSuccess(false);
      }, 1500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el movimiento';
      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Configuración de columnas para la tabla
  const columns = [
    {
      header: 'Fecha',
      accessor: ((movement: SupplyMovementWithDetails) => (
        <div className="text-sm">
          <div className="font-medium">
            {new Date(movement.fecha_movimiento).toLocaleDateString('es-GT')}
          </div>
          <div className="text-gray-500">
            {new Date(movement.fecha_movimiento).toLocaleTimeString('es-GT', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      )) as any,
      width: '120px'
    },
    {
      header: 'Tipo',
      accessor: ((movement: SupplyMovementWithDetails) => (
        <div className="flex items-center gap-2">
          {movement.movement_type?.affects_stock && movement.movement_type.affects_stock > 0 ? (
            <ArrowUpIcon className="h-4 w-4 text-green-500" />
          ) : movement.movement_type?.affects_stock && movement.movement_type.affects_stock < 0 ? (
            <ArrowDownIcon className="h-4 w-4 text-red-500" />
          ) : (
            <ClockIcon className="h-4 w-4 text-yellow-500" />
          )}
          <Badge 
            variant={
              movement.movement_type?.affects_stock && movement.movement_type.affects_stock > 0 ? 'success' : 
              movement.movement_type?.affects_stock && movement.movement_type.affects_stock < 0 ? 'danger' : 'warning'
            }
            size="sm"
          >
            {movement.movement_type?.name || 'N/A'}
          </Badge>
        </div>
      )) as any,
      width: '150px'
    },
    {
      header: 'Cantidad',
      accessor: ((movement: SupplyMovementWithDetails) => (
        <div className="text-center">
          <span className={`font-medium ${
            movement.movement_type?.affects_stock && movement.movement_type.affects_stock > 0 ? 'text-green-600' : 
            movement.movement_type?.affects_stock && movement.movement_type.affects_stock < 0 ? 'text-red-600' : 'text-yellow-600'
          }`}>
            {movement.movement_type?.affects_stock && movement.movement_type.affects_stock > 0 ? '+' : 
             movement.movement_type?.affects_stock && movement.movement_type.affects_stock < 0 ? '-' : '±'}{movement.cantidad}
          </span>
        </div>
      )) as any,
      width: '100px',
      align: 'center' as const
    },
    {
      header: 'Envío',
      accessor: ((movement: SupplyMovementWithDetails) => 
        movement.numero_envio ? (
          <Badge variant="secondary" size="sm">
            {movement.numero_envio}
          </Badge>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )
      ) as any,
      width: '120px'
    },
    {
      header: 'Personal',
      accessor: ((movement: SupplyMovementWithDetails) => (
        <div className="text-sm">
          {movement.created_by && (
            <div className="flex items-center gap-1 mb-1">
              <UserIcon className="h-3 w-3 text-gray-400" />
              <span className="text-gray-600">Por: {movement.created_by.fullName}</span>
            </div>
          )}
          {movement.user_delivers_to && (
            <div className="flex items-center gap-1">
              <ArrowDownIcon className="h-3 w-3 text-blue-400" />
              <span className="text-blue-600">Para: {movement.user_delivers_to.fullName}</span>
            </div>
          )}
          {movement.user_receives && (
            <div className="flex items-center gap-1">
              <ArrowUpIcon className="h-3 w-3 text-green-400" />
              <span className="text-green-600">Recibe: {movement.user_receives.fullName}</span>
            </div>
          )}
        </div>
      )) as any,
      width: '200px'
    },
    {
      header: 'Observaciones',
      accessor: ((movement: SupplyMovementWithDetails) => 
        movement.observaciones ? (
          <div className="text-sm text-gray-600 max-w-xs truncate" title={movement.observaciones}>
            {movement.observaciones}
          </div>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )
      ) as any
    }
  ];

  // Configurar pestañas
  const tabs = [
    createTab('all', 'Todos', { 
      count: movements.length,
      icon: <DocumentTextIcon className="h-4 w-4" />
    }),
    createTab('entradas', 'Entradas', { 
      count: movements.filter(m => m.movement_type?.affects_stock && m.movement_type.affects_stock > 0).length,
      icon: <ArrowUpIcon className="h-4 w-4" />
    }),
    createTab('salidas', 'Salidas', { 
      count: movements.filter(m => m.movement_type?.affects_stock && m.movement_type.affects_stock < 0).length,
      icon: <ArrowDownIcon className="h-4 w-4" />
    }),
    createTab('ajustes', 'Ajustes', { 
      count: movements.filter(m => !m.movement_type?.affects_stock || m.movement_type.affects_stock === 0).length,
      icon: <ClockIcon className="h-4 w-4" />
    })
  ];

  // Obtener tipo de movimiento seleccionado para mostrar campos condicionales
  const selectedMovementType = movementTypes.find(mt => mt.id.toString() === formData.movement_type_id);
  const isEntrada = selectedMovementType?.affects_stock && selectedMovementType.affects_stock > 0;
  const isSalida = selectedMovementType?.affects_stock && selectedMovementType.affects_stock < 0;

  return (
    <>
      <DashboardCard
        title={supply ? `Movimientos - ${supply.nombre_producto}` : "Gestión de Movimientos de Stock"}
        subtitle={supply ? `Código: ${supply.codigo || supply.id}` : "Control de entradas, salidas y ajustes de inventario"}
        className={className}
        headerAction={
          <div className="flex items-center gap-3">
            {onClose && (
              <DashboardButton
                variant="outline"
                size="sm"
                onClick={onClose}
                leftIcon={<XMarkIcon className="h-4 w-4" />}
              >
                Cerrar
              </DashboardButton>
            )}
            
            <DashboardButton
              variant="primary"
              size="sm"
              onClick={() => setShowCreateForm(true)}
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              Nuevo Movimiento
            </DashboardButton>
          </div>
        }
      >
        {/* Información del suministro seleccionado */}
        {selectedSupply && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">{selectedSupply.nombre_producto}</h3>
                <p className="text-sm text-blue-700">
                  Stock actual: <span className="font-medium">{selectedSupply.stock_actual}</span> | 
                  Stock mínimo: <span className="font-medium">{selectedSupply.stock_minimo}</span>
                </p>
              </div>
              <Badge 
                variant={selectedSupply.stock_actual <= selectedSupply.stock_minimo ? 'warning' : 'success'}
                size="sm"
              >
                {selectedSupply.stock_actual <= 0 ? 'Sin stock' : 
                 selectedSupply.stock_actual <= selectedSupply.stock_minimo ? 'Stock bajo' : 'Normal'}
              </Badge>
            </div>
          </div>
        )}

        {/* Pestañas */}
        <div className="mb-6">
          <DashboardTabs
            tabs={tabs}
            variant="underline"
          />
        </div>

        {/* Tabla de movimientos */}
        <DashboardDataTable
          columns={columns}
          data={filteredMovements}
          keyExtractor={(movement) => movement.id.toString()}
          emptyMessage="No hay movimientos registrados"
          hover
          striped
        />
      </DashboardCard>

      {/* Modal para crear movimiento */}
      <DashboardModal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Crear Nuevo Movimiento"
        size="lg"
        error={errors.general}
        success={submitSuccess ? "Movimiento creado exitosamente" : null}
        footer={
          <div className="flex justify-end gap-3">
            <DashboardButton
              variant="outline"
              onClick={() => setShowCreateForm(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </DashboardButton>
            
            <DashboardButton
              variant="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || submitSuccess}
              leftIcon={<CheckIcon className="h-4 w-4" />}
            >
              Crear Movimiento
            </DashboardButton>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Selección de suministro (solo si no se pasó uno específico) */}
          {!supply && (
            <DashboardSelect
              id="supply_id"
              name="supply_id"
              label="Suministro"
              value={formData.supply_id}
              onChange={handleSelectChange}
              options={supplyOptions}
              placeholder="Seleccionar suministro"
              required
              error={errors.supply_id}
            />
          )}

          {/* Tipo de movimiento y cantidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DashboardSelect
              id="movement_type_id"
              name="movement_type_id"
              label="Tipo de Movimiento"
              value={formData.movement_type_id}
              onChange={handleSelectChange}
              options={movementTypeOptions}
              placeholder="Seleccionar tipo"
              required
              error={errors.movement_type_id}
            />

            <DashboardTextInput
              id="cantidad"
              name="cantidad"
              label="Cantidad"
              type="number"
              value={formData.cantidad}
              onChange={handleInputChange}
              placeholder="0"
              min="1"
              required
              error={errors.cantidad}
            />
          </div>

          {/* Número de envío */}
          <DashboardTextInput
            id="numero_envio"
            name="numero_envio"
            label="Número de Envío"
            value={formData.numero_envio}
            onChange={handleInputChange}
            placeholder="Opcional - Número de factura, orden, etc."
            helperText="Para entradas: número de factura o compra. Para salidas: número de entrega"
          />

          {/* Campos condicionales según el tipo de movimiento */}
          {(isEntrada || isSalida) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isEntrada && (
                <DashboardSelect
                  id="user_receives_id"
                  name="user_receives_id"
                  label="Persona que Recibe"
                  value={formData.user_receives_id}
                  onChange={handleSelectChange}
                  options={userOptions}
                  placeholder="Seleccionar persona"
                  helperText="Quien recibe el suministro"
                />
              )}

              {isSalida && (
                <DashboardSelect
                  id="user_delivers_to_id"
                  name="user_delivers_to_id"
                  label="Entregar a"
                  value={formData.user_delivers_to_id}
                  onChange={handleSelectChange}
                  options={userOptions}
                  placeholder="Seleccionar destinatario"
                  helperText="A quién se le entrega el suministro"
                />
              )}
            </div>
          )}

          {/* Observaciones */}
          <DashboardTextArea
            id="observaciones"
            name="observaciones"
            label="Observaciones"
            value={formData.observaciones}
            onChange={handleInputChange}
            placeholder="Notas adicionales sobre el movimiento..."
            rows={3}
            maxLength={500}
            showCharCount
          />
        </div>
      </DashboardModal>
    </>
  );
};

export default StockMovements;