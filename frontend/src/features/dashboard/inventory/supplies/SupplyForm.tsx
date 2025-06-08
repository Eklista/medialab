import React, { useState, useEffect } from 'react';
import { 
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Importar componentes UI
import DashboardModal from '../../components/ui/DashboardModal';
import DashboardTextInput from '../../components/ui/DashboardTextInput';
import DashboardTextArea from '../../components/ui/DashboardTextArea';
import DashboardSelect from '../../components/ui/DashboardSelect';
import DashboardButton from '../../components/ui/DashboardButton';
import Switch from '../../components/ui/Switch';
import Badge from '../../components/ui/Badge';

// Importar hooks y tipos
import { useInventoryCommon } from '../../../../services/inventory/hooks';
import { useSuppliesList } from '../../../../services/inventory/hooks';
import type { 
  SupplyWithDetails, 
  SupplyCreateRequest, 
  SupplyUpdateRequest 
} from '../../../../services/inventory/types';

interface SupplyFormProps {
  isOpen: boolean;
  onClose: () => void;
  supply?: SupplyWithDetails | null; // null = crear, objeto = editar
  onSuccess?: (supply: SupplyWithDetails) => void;
  onError?: (error: string) => void;
}

interface FormData {
  codigo: string;
  nombre_producto: string;
  presentacion: string;
  descripcion: string;
  category_id: string;
  location_id: string;
  stock_actual: string;
  stock_minimo: string;
  is_active: boolean;
  observaciones: string;
}

interface FormErrors {
  codigo?: string;
  nombre_producto?: string;
  category_id?: string;
  stock_actual?: string;
  stock_minimo?: string;
  general?: string;
}

const SupplyForm: React.FC<SupplyFormProps> = ({
  isOpen,
  onClose,
  supply = null,
  onSuccess,
  onError
}) => {
  // Estados del formulario
  const [formData, setFormData] = useState<FormData>({
    codigo: '',
    nombre_producto: '',
    presentacion: '',
    descripcion: '',
    category_id: '',
    location_id: '',
    stock_actual: '0',
    stock_minimo: '0',
    is_active: true,
    observaciones: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Hooks
  const { createSupply, updateSupply } = useSuppliesList();
  const { 
    categories, 
    locations, 
    isLoading: isLoadingCommon 
  } = useInventoryCommon();

  // Determinar si es modo edición
  const isEditing = Boolean(supply);
  const modalTitle = isEditing ? 'Editar Suministro' : 'Crear Nuevo Suministro';

  // Opciones para selects (solo categorías que NO son equipos)
  const categoryOptions = categories
    .filter(cat => !cat.is_equipment && cat.is_active)
    .map(cat => ({ 
      value: cat.id.toString(), 
      label: cat.name 
    }));

  const locationOptions = locations
    .filter(loc => loc.is_active)
    .map(loc => ({ 
      value: loc.id.toString(), 
      label: loc.name 
    }));

  // Cargar datos cuando se abre en modo edición
  useEffect(() => {
    if (isOpen && supply) {
      setFormData({
        codigo: supply.codigo || '',
        nombre_producto: supply.nombre_producto || '',
        presentacion: supply.presentacion || '',
        descripcion: supply.descripcion || '',
        category_id: supply.category_id?.toString() || '',
        location_id: supply.location_id?.toString() || '',
        stock_actual: supply.stock_actual?.toString() || '0',
        stock_minimo: supply.stock_minimo?.toString() || '0',
        is_active: supply.is_active ?? true,
        observaciones: supply.observaciones || ''
      });
    } else if (isOpen && !supply) {
      // Resetear formulario para crear nuevo
      setFormData({
        codigo: '',
        nombre_producto: '',
        presentacion: '',
        descripcion: '',
        category_id: '',
        location_id: '',
        stock_actual: '0',
        stock_minimo: '0',
        is_active: true,
        observaciones: ''
      });
    }
    
    // Limpiar estados cuando se abre el modal
    if (isOpen) {
      setErrors({});
      setIsSubmitting(false);
      setSubmitSuccess(false);
    }
  }, [isOpen, supply]);

  // Validación del formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Nombre del producto es requerido
    if (!formData.nombre_producto.trim()) {
      newErrors.nombre_producto = 'El nombre del producto es requerido';
    }

    // Categoría es requerida
    if (!formData.category_id) {
      newErrors.category_id = 'La categoría es requerida';
    }

    // Validar stock actual
    const stockActual = parseInt(formData.stock_actual);
    if (isNaN(stockActual) || stockActual < 0) {
      newErrors.stock_actual = 'El stock actual debe ser un número válido mayor o igual a 0';
    }

    // Validar stock mínimo
    const stockMinimo = parseInt(formData.stock_minimo);
    if (isNaN(stockMinimo) || stockMinimo < 0) {
      newErrors.stock_minimo = 'El stock mínimo debe ser un número válido mayor o igual a 0';
    }

    // Validar código si se proporciona
    if (formData.codigo && formData.codigo.trim().length < 2) {
      newErrors.codigo = 'El código debe tener al menos 2 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en los campos
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, is_active: checked }));
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Preparar datos para envío
      const submitData: SupplyCreateRequest | SupplyUpdateRequest = {
        codigo: formData.codigo.trim() || undefined,
        nombre_producto: formData.nombre_producto.trim(),
        presentacion: formData.presentacion.trim() || undefined,
        descripcion: formData.descripcion.trim() || undefined,
        category_id: parseInt(formData.category_id),
        location_id: formData.location_id ? parseInt(formData.location_id) : undefined,
        stock_actual: parseInt(formData.stock_actual),
        stock_minimo: parseInt(formData.stock_minimo),
        is_active: formData.is_active,
        observaciones: formData.observaciones.trim() || undefined
      };

      let result;
      
      if (isEditing && supply) {
        // Actualizar suministro existente
        result = await updateSupply(supply.id, submitData as SupplyUpdateRequest);
      } else {
        // Crear nuevo suministro
        result = await createSupply(submitData as SupplyCreateRequest);
      }

      if (result) {
        setSubmitSuccess(true);
        
        // Mostrar mensaje de éxito por un momento
        setTimeout(() => {
          onSuccess?.(result);
          onClose();
        }, 1500);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar el suministro';
      setErrors({ general: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calcular estado del stock para mostrar indicador
  const getStockStatus = () => {
    const actual = parseInt(formData.stock_actual) || 0;
    const minimo = parseInt(formData.stock_minimo) || 0;
    
    if (actual <= 0) return { color: 'danger', label: 'Sin stock' };
    if (actual <= minimo * 0.5) return { color: 'danger', label: 'Crítico' };
    if (actual <= minimo) return { color: 'warning', label: 'Bajo' };
    return { color: 'success', label: 'Normal' };
  };

  const stockStatus = getStockStatus();

  return (
    <DashboardModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="lg"
      error={errors.general}
      success={submitSuccess ? `Suministro ${isEditing ? 'actualizado' : 'creado'} exitosamente` : null}
      footer={
        <div className="flex justify-between w-full">
          <div className="flex items-center gap-2">
            {/* Indicador de estado del stock */}
            <Badge 
              variant={stockStatus.color as any} 
              size="sm"
              icon={<ExclamationTriangleIcon className="h-3 w-3" />}
            >
              Stock: {stockStatus.label}
            </Badge>
          </div>
          
          <div className="flex gap-3">
            <DashboardButton
              variant="outline"
              onClick={onClose}
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
              {isEditing ? 'Actualizar' : 'Crear'} Suministro
            </DashboardButton>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DashboardTextInput
            id="codigo"
            name="codigo"
            label="Código del Suministro"
            value={formData.codigo}
            onChange={handleInputChange}
            placeholder="Ej: PAPEL-A4, TONER-HP"
            error={errors.codigo}
            helperText="Opcional - Código único para identificar el suministro"
            maxLength={50}
          />

          <DashboardTextInput
            id="nombre_producto"
            name="nombre_producto"
            label="Nombre del Producto"
            value={formData.nombre_producto}
            onChange={handleInputChange}
            placeholder="Nombre descriptivo del producto"
            required
            error={errors.nombre_producto}
            maxLength={255}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DashboardTextInput
            id="presentacion"
            name="presentacion"
            label="Presentación"
            value={formData.presentacion}
            onChange={handleInputChange}
            placeholder="Ej: Caja x 500 hojas, Cartucho"
            helperText="Formato o presentación del producto"
            maxLength={100}
          />

          <DashboardSelect
            id="category_id"
            name="category_id"
            label="Categoría"
            value={formData.category_id}
            onChange={handleSelectChange}
            options={categoryOptions}
            placeholder="Seleccionar categoría"
            required
            error={errors.category_id}
            loading={isLoadingCommon}
          />
        </div>

        {/* Stock */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DashboardTextInput
            id="stock_actual"
            name="stock_actual"
            label="Stock Actual"
            type="number"
            value={formData.stock_actual}
            onChange={handleInputChange}
            min="0"
            required
            error={errors.stock_actual}
          />

          <DashboardTextInput
            id="stock_minimo"
            name="stock_minimo"
            label="Stock Mínimo"
            type="number"
            value={formData.stock_minimo}
            onChange={handleInputChange}
            min="0"
            required
            error={errors.stock_minimo}
            helperText="Cantidad mínima antes de alertar"
          />

          <DashboardSelect
            id="location_id"
            name="location_id"
            label="Ubicación"
            value={formData.location_id}
            onChange={handleSelectChange}
            options={locationOptions}
            placeholder="Seleccionar ubicación"
            loading={isLoadingCommon}
            helperText="Ubicación principal del suministro"
          />
        </div>

        {/* Descripción */}
        <DashboardTextArea
          id="descripcion"
          name="descripcion"
          label="Descripción"
          value={formData.descripcion}
          onChange={handleInputChange}
          placeholder="Descripción detallada del suministro..."
          rows={3}
          maxLength={500}
          showCharCount
          helperText="Información adicional sobre el suministro"
        />

        {/* Observaciones */}
        <DashboardTextArea
          id="observaciones"
          name="observaciones"
          label="Observaciones"
          value={formData.observaciones}
          onChange={handleInputChange}
          placeholder="Notas adicionales, consideraciones especiales..."
          rows={2}
          maxLength={500}
          showCharCount
        />

        {/* Estado activo */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Estado del Suministro</h4>
            <p className="text-sm text-gray-500">
              {formData.is_active 
                ? 'El suministro estará disponible para uso y movimientos' 
                : 'El suministro estará desactivado y no aparecerá en listados activos'
              }
            </p>
          </div>
          
          <Switch
            checked={formData.is_active}
            onChange={handleSwitchChange}
            size="md"
            variant={formData.is_active ? 'success' : 'default'}
            onLabel="Activo"
            offLabel="Inactivo"
          />
        </div>

        {/* Información adicional para modo edición */}
        {isEditing && supply && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Información del Sistema</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">ID:</span> {supply.id}
              </div>
              <div>
                <span className="font-medium">Creado:</span>{' '}
                {new Date(supply.created_at).toLocaleDateString('es-GT')}
              </div>
              <div>
                <span className="font-medium">Última actualización:</span>{' '}
                {new Date(supply.updated_at).toLocaleDateString('es-GT')}
              </div>
              {supply.category && (
                <div>
                  <span className="font-medium">Categoría actual:</span> {supply.category.name}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardModal>
  );
};

export default SupplyForm;