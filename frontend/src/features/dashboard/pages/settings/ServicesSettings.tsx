// src/features/dashboard/pages/settings/ServicesSettings.tsx
import React, { useState, useEffect } from 'react';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardModal from '../../components/ui/DashboardModal';
import DashboardDataTable from '../../components/ui/DashboardDataTable';
import ServiceForm, { ServiceFormData } from '../../components/config/ServiceForm';
import { PlusIcon } from '@heroicons/react/24/outline';
import { servicesService } from '../../../../services';
import { Service } from '../../../../services/services.service';
import ApiErrorHandler from '../../../../components/common/ApiErrorHandler';

const ServicesSettings: React.FC = () => {
  // Estado para servicios
  const [services, setServices] = useState<Service[]>([]);
  
  // Estado para modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para carga de datos
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cargar servicios al montar el componente
  useEffect(() => {
    fetchServices();
  }, []);

  // Función para cargar servicios desde la API
  const fetchServices = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await servicesService.getServices();
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los servicios');
      console.error('Error al cargar servicios:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handlers para servicios
  const handleAddService = () => {
    setIsAddModalOpen(true);
  };
  
  const handleEditService = (service: Service) => {
    setCurrentService(service);
    setIsEditModalOpen(true);
  };
  
  const handleDeleteClick = (service: Service) => {
    setCurrentService(service);
    setIsDeleteModalOpen(true);
  };
  
  const handleDeleteService = async () => {
    if (!currentService || !currentService.id) return;
    
    setIsSubmitting(true);
    
    try {
      await servicesService.deleteService(currentService.id);
      
      // Actualizar la lista local de servicios
      setServices(services.filter(s => s.id !== currentService.id));
      setIsDeleteModalOpen(false);
      setCurrentService(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el servicio');
      console.error('Error al eliminar servicio:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Adaptar los datos al formato esperado por la API
      const serviceData = {
        name: data.name,
        description: data.description,
        icon_name: data.iconName,
        sub_services: data.subServices.map(sub => ({
          name: sub.name,
          description: sub.description
        }))
      };
      
      // Crear el servicio
      const newService = await servicesService.createService(serviceData);
      
      // Actualizar la lista local de servicios
      setServices([...services, newService]);
      setIsAddModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el servicio');
      console.error('Error al crear servicio:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditSubmit = async (data: ServiceFormData) => {
    if (!currentService || !currentService.id) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Primero actualizar la información básica del servicio
      const serviceUpdateData = {
        name: data.name,
        description: data.description,
        icon_name: data.iconName
      };
      
      // Actualizar el servicio
      const updatedService = await servicesService.updateService(
        currentService.id, 
        serviceUpdateData
      );
      
      // Actualizar la lista local de servicios
      setServices(services.map(s => s.id === currentService.id ? updatedService : s));
      
      // Ahora manejar cambios en los sub-servicios
      // 1. Identificar sub-servicios a eliminar (los que están en el servicio actual pero no en los datos enviados)
      const existingSubServiceIds = new Set(currentService.sub_services.map(sub => sub.id));
      const newSubServiceIds = new Set(
        data.subServices
          .filter(sub => sub.id !== undefined)
          .map(sub => sub.id)
      );
      
      const subServicesToDelete = currentService.sub_services.filter(
        sub => sub.id && !newSubServiceIds.has(sub.id)
      );
      
      // 2. Identificar sub-servicios a añadir (los que no tienen ID)
      const subServicesToAdd = data.subServices.filter(sub => !sub.id);
      
      // 3. Identificar sub-servicios a actualizar (los que tienen ID y están en ambos conjuntos)
      const subServicesToUpdate = data.subServices.filter(
        sub => sub.id && existingSubServiceIds.has(sub.id)
      );
      
      // Ejecutar las operaciones
      // Eliminar sub-servicios
      for (const subService of subServicesToDelete) {
        if (subService.id) {
          await servicesService.deleteSubService(subService.id);
        }
      }
      
      // Añadir nuevos sub-servicios
      for (const subService of subServicesToAdd) {
        if (currentService.id) {
          await servicesService.addSubService(currentService.id, {
            name: subService.name,
            description: subService.description
          });
        }
      }
      
      // Actualizar sub-servicios existentes
      for (const subService of subServicesToUpdate) {
        if (subService.id) {
          await servicesService.updateSubService(subService.id, {
            name: subService.name,
            description: subService.description
          });
        }
      }
      
      // Recargar los servicios para obtener los datos actualizados
      await fetchServices();
      
      setIsEditModalOpen(false);
      setCurrentService(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el servicio');
      console.error('Error al actualizar servicio:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Columnas para la tabla
  const columns = [
    {
      header: 'Nombre',
      accessor: (service: Service) => service.name
    },
    {
      header: 'Descripción',
      accessor: (service: Service) => service.description || '-'
    },
    {
      header: 'Icono',
      accessor: (service: Service) => service.icon_name || '-'
    },
    {
      header: 'Subservicios',
      accessor: (service: Service) => (
        <span className="text-gray-600">{service.sub_services.length} subservicios</span>
      )
    }
  ];
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Gestión de Servicios</h2>
        <DashboardButton
          onClick={handleAddService}
          leftIcon={<PlusIcon className="w-5 h-5" />}
        >
          Agregar Servicio
        </DashboardButton>
      </div>
      
      {/* Mostrar errores si los hay */}
      {error && (
        <ApiErrorHandler 
          error={error} 
          onRetry={fetchServices} 
          resourceName="los servicios"
        />
      )}
      
      <DashboardDataTable
        columns={columns}
        data={services}
        keyExtractor={(service) => service.id?.toString() || ''}
        onEdit={handleEditService}
        onDelete={handleDeleteClick}
        actionColumn={true}
        emptyMessage={isLoading ? "Cargando servicios..." : "No hay servicios configurados"}
        isLoading={isLoading}
      />
      
      {/* Modal para agregar servicio */}
      <DashboardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Agregar Servicio"
        size="lg"
      >
        <ServiceForm
          onSubmit={handleAddSubmit}
          onCancel={() => setIsAddModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </DashboardModal>
      
      {/* Modal para editar servicio */}
      <DashboardModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setCurrentService(null);
        }}
        title="Editar Servicio"
        size="lg"
      >
        {currentService && (
          <ServiceForm
            initialData={{
              name: currentService.name,
              description: currentService.description || '',
              iconName: currentService.icon_name || '',
              subServices: currentService.sub_services.map(sub => ({
                id: sub.id,
                name: sub.name,
                description: sub.description || ''
              }))
            }}
            onSubmit={handleEditSubmit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setCurrentService(null);
            }}
            isSubmitting={isSubmitting}
          />
        )}
      </DashboardModal>
      
      {/* Modal para confirmar eliminación */}
      <DashboardModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCurrentService(null);
        }}
        title="Confirmar Eliminación"
      >
        <div className="py-3">
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar el servicio <span className="font-medium">{currentService?.name}</span>?
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Esta acción también eliminará todos los subservicios asociados y no se puede deshacer.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <DashboardButton
            variant="outline"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setCurrentService(null);
            }}
            disabled={isSubmitting}
          >
            Cancelar
          </DashboardButton>
          <DashboardButton
            variant="danger"
            onClick={handleDeleteService}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Eliminar
          </DashboardButton>
        </div>
      </DashboardModal>
    </div>
  );
};

export default ServicesSettings;