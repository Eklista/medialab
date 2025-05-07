// src/features/dashboard/pages/settings/ServicesSettings.tsx
import React, { useState, useEffect } from 'react';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardModal from '../../components/ui/DashboardModal';
import DashboardDataTable from '../../components/ui/DashboardDataTable';
import ServiceForm, { ServiceFormData } from '../../components/config/ServiceForm';
import TemplateForm, { TemplateFormData } from '../../components/config/TemplateForm';
import { PlusIcon } from '@heroicons/react/24/outline';
import { servicesService, serviceTemplatesService } from '../../../../services';
import { Service } from '../../../../services/services.service';
import { ServiceTemplate } from '../../../../services/service-templates.service';
import ApiErrorHandler from '../../../../components/common/ApiErrorHandler';

const ServicesSettings: React.FC = () => {
  // Estado para pestañas
  const [activeTab, setActiveTab] = useState<'services' | 'templates'>('services');
  
  // Estado para servicios
  const [services, setServices] = useState<Service[]>([]);
  
  // Estado para plantillas
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  
  // Estado para modales de servicios
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  
  // Estado para modales de plantillas
  const [isAddTemplateModalOpen, setIsAddTemplateModalOpen] = useState(false);
  const [isEditTemplateModalOpen, setIsEditTemplateModalOpen] = useState(false);
  const [isDeleteTemplateModalOpen, setIsDeleteTemplateModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<ServiceTemplate | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Estado para carga de datos
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cargar datos al montar el componente o cambiar de pestaña
  useEffect(() => {
    if (activeTab === 'services') {
      fetchServices();
    } else {
      fetchTemplates();
    }
  }, [activeTab]);

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
  
  // Función para cargar plantillas desde la API
  const fetchTemplates = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await serviceTemplatesService.getServiceTemplates();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las plantillas');
      console.error('Error al cargar plantillas:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // HANDLERS PARA SERVICIOS
  const handleAddService = () => {
    setModalError(null);
    setIsAddModalOpen(true);
  };
  
  const handleEditService = (service: Service) => {
    setModalError(null);
    setCurrentService(service);
    setIsEditModalOpen(true);
  };
  
  const handleDeleteClick = (service: Service) => {
    setModalError(null);
    setCurrentService(service);
    setIsDeleteModalOpen(true);
  };
  
  const handleDeleteService = async () => {
    if (!currentService || !currentService.id) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      await servicesService.deleteService(currentService.id);
      
      setServices(services.filter(s => s.id !== currentService.id));
      setIsDeleteModalOpen(false);
      setCurrentService(null);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al eliminar el servicio');
      console.error('Error al eliminar servicio:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      const serviceData = {
        name: data.name,
        description: data.description,
        icon_name: data.iconName,
        sub_services: data.subServices.map(sub => ({
          name: sub.name,
          description: sub.description
        }))
      };
      
      const newService = await servicesService.createService(serviceData);
      
      setServices([...services, newService]);
      setIsAddModalOpen(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al crear el servicio');
      console.error('Error al crear servicio:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditSubmit = async (data: ServiceFormData) => {
    if (!currentService || !currentService.id) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      const serviceUpdateData = {
        name: data.name,
        description: data.description,
        icon_name: data.iconName
      };
      
      const updatedService = await servicesService.updateService(
        currentService.id, 
        serviceUpdateData
      );
      
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
      setModalError(err instanceof Error ? err.message : 'Error al actualizar el servicio');
      console.error('Error al actualizar servicio:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // HANDLERS PARA PLANTILLAS
  const handleAddTemplate = () => {
    setModalError(null);
    setIsAddTemplateModalOpen(true);
  };
  
  const handleEditTemplate = (template: ServiceTemplate) => {
    setModalError(null);
    setCurrentTemplate(template);
    setIsEditTemplateModalOpen(true);
  };
  
  const handleDeleteTemplateClick = (template: ServiceTemplate) => {
    setModalError(null);
    setCurrentTemplate(template);
    setIsDeleteTemplateModalOpen(true);
  };
  
  const handleDeleteTemplate = async () => {
    if (!currentTemplate || !currentTemplate.id) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      await serviceTemplatesService.deleteServiceTemplate(currentTemplate.id);
      
      setTemplates(templates.filter(t => t.id !== currentTemplate.id));
      setIsDeleteTemplateModalOpen(false);
      setCurrentTemplate(null);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al eliminar la plantilla');
      console.error('Error al eliminar plantilla:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddTemplateSubmit = async (data: TemplateFormData) => {
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      const templateData = {
        name: data.name,
        description: data.description,
        is_public: data.isPublic,
        service_selections: data.serviceSelections.map(sel => ({
          service_id: sel.serviceId,
          sub_service_ids: sel.subServiceIds
        }))
      };
      
      await serviceTemplatesService.createServiceTemplate(templateData);
      await fetchTemplates();
      setIsAddTemplateModalOpen(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al crear la plantilla');
      console.error('Error al crear plantilla:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditTemplateSubmit = async (data: TemplateFormData) => {
    if (!currentTemplate || !currentTemplate.id) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      const templateData = {
        name: data.name,
        description: data.description,
        is_public: data.isPublic,
        service_selections: data.serviceSelections.map(sel => ({
          service_id: sel.serviceId,
          sub_service_ids: sel.subServiceIds
        }))
      };
      
      await serviceTemplatesService.updateServiceTemplate(
        currentTemplate.id, 
        templateData
      );
      
      await fetchTemplates();
      setIsEditTemplateModalOpen(false);
      setCurrentTemplate(null);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al actualizar la plantilla');
      console.error('Error al actualizar plantilla:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Columnas para la tabla de servicios
  const serviceColumns = [
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
  
  // Columnas para la tabla de plantillas
  const templateColumns = [
    {
      header: 'Nombre',
      accessor: (template: ServiceTemplate) => template.name
    },
    {
      header: 'Descripción',
      accessor: (template: ServiceTemplate) => template.description || '-'
    },
    {
      header: 'Estado',
      accessor: (template: ServiceTemplate) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          template.is_public 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {template.is_public ? 'Pública' : 'Privada'}
        </span>
      )
    },
    {
      header: 'Servicios',
      accessor: (template: ServiceTemplate) => (
        <span className="text-gray-600">
          {template.services ? template.services.length : 0} servicios
        </span>
      )
    }
  ];
  
  return (
    <div className="p-6">
      {/* Pestañas */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            className={`py-4 px-6 border-b-2 text-sm font-medium ${
              activeTab === 'services'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('services')}
          >
            Servicios
          </button>
          <button
            className={`py-4 px-6 border-b-2 text-sm font-medium ${
              activeTab === 'templates'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('templates')}
          >
            Plantillas
          </button>
        </nav>
      </div>
      
      {/* Contenido según la pestaña activa */}
      {activeTab === 'services' ? (
        <>
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
            columns={serviceColumns}
            data={services}
            keyExtractor={(service) => service.id?.toString() || ''}
            onEdit={handleEditService}
            onDelete={handleDeleteClick}
            actionColumn={true}
            emptyMessage={isLoading ? "Cargando servicios..." : "No hay servicios configurados"}
            isLoading={isLoading}
          />
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">Gestión de Plantillas</h2>
            <DashboardButton
              onClick={handleAddTemplate}
              leftIcon={<PlusIcon className="w-5 h-5" />}
            >
              Crear Plantilla
            </DashboardButton>
          </div>
          
          {/* Mostrar errores si los hay */}
          {error && (
            <ApiErrorHandler 
              error={error} 
              onRetry={fetchTemplates} 
              resourceName="las plantillas"
            />
          )}
          
          <DashboardDataTable
            columns={templateColumns}
            data={templates}
            keyExtractor={(template) => template.id?.toString() || ''}
            onEdit={handleEditTemplate}
            onDelete={handleDeleteTemplateClick}
            actionColumn={true}
            emptyMessage={isLoading ? "Cargando plantillas..." : "No hay plantillas configuradas"}
            isLoading={isLoading}
          />
        </>
      )}
      
      {/* Modales para Servicios */}
      <DashboardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Agregar Servicio"
        size="lg"
        error={modalError}
      >
        <ServiceForm
          onSubmit={handleAddSubmit}
          onCancel={() => setIsAddModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </DashboardModal>
      
      <DashboardModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setCurrentService(null);
        }}
        title="Editar Servicio"
        size="lg"
        error={modalError}
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

      <DashboardModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCurrentService(null);
        }}
        title="Confirmar Eliminación"
        error={modalError}
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
      
      {/* Modales para Plantillas */}
      <DashboardModal
        isOpen={isAddTemplateModalOpen}
        onClose={() => setIsAddTemplateModalOpen(false)}
        title="Crear Plantilla de Servicios"
        size="lg"
        error={modalError}
      >
        <TemplateForm
          services={services}
          onSubmit={handleAddTemplateSubmit}
          onCancel={() => setIsAddTemplateModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </DashboardModal>
      
      <DashboardModal
        isOpen={isEditTemplateModalOpen}
        onClose={() => {
          setIsEditTemplateModalOpen(false);
          setCurrentTemplate(null);
        }}
        title="Editar Plantilla de Servicios"
        size="lg"
        error={modalError}
      >
        {currentTemplate && (
          <TemplateForm
            services={services}
            initialData={{
              name: currentTemplate.name,
              description: currentTemplate.description || '',
              isPublic: currentTemplate.is_public,
              serviceSelections: currentTemplate.services 
                ? currentTemplate.services.map(service => ({
                    serviceId: service.id!,
                    subServiceIds: [] // Aquí necesitarás añadir lógica para determinar qué subservicios están seleccionados
                  }))
                : []
            }}
            onSubmit={handleEditTemplateSubmit}
            onCancel={() => {
              setIsEditTemplateModalOpen(false);
              setCurrentTemplate(null);
            }}
            isSubmitting={isSubmitting}
          />
        )}
      </DashboardModal>

      <DashboardModal
        isOpen={isDeleteTemplateModalOpen}
        onClose={() => {
          setIsDeleteTemplateModalOpen(false);
          setCurrentTemplate(null);
        }}
        title="Confirmar Eliminación"
        error={modalError}
      >
        <div className="py-3">
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar la plantilla <span className="font-medium">{currentTemplate?.name}</span>?
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Esta acción no se puede deshacer.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <DashboardButton
            variant="outline"
            onClick={() => {
              setIsDeleteTemplateModalOpen(false);
              setCurrentTemplate(null);
            }}
            disabled={isSubmitting}
          >
            Cancelar
          </DashboardButton>
          <DashboardButton
            variant="danger"
            onClick={handleDeleteTemplate}
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