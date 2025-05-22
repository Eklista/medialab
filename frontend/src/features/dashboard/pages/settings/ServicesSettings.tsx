// src/features/dashboard/pages/settings/ServicesSettings.tsx
import React, { useState, useEffect } from 'react';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardModal from '../../components/ui/DashboardModal';
import DashboardDataTable from '../../components/ui/DashboardDataTable';
import ServiceForm, { ServiceFormData } from '../../components/config/ServiceForm';
import TemplateForm, { TemplateFormData } from '../../components/config/TemplateForm';
import ConfigPageTemplate from '../../components/config/ConfigPageTemplate';
import { PlusIcon } from '@heroicons/react/24/outline';
import { servicesService, serviceTemplatesService } from '../../../../services';
import { Service } from '../../../../services/services.service';
import { ServiceTemplate } from '../../../../services/serviceTemplates.service';
import ApiErrorHandler from '../../../../components/common/ApiErrorHandler';
import { useAuth } from '../../../auth/hooks/useAuth';

const ServicesSettings: React.FC = () => {
  // Obtener estado de autenticación y funciones para verificar permisos
  const { hasPermission } = useAuth();
  
  // Verificar permisos para servicios y plantillas
  const canViewServices = hasPermission('service_view');
  const canCreateService = hasPermission('service_create');
  const canEditService = hasPermission('service_edit');
  const canDeleteService = hasPermission('service_delete');
  
  const canViewTemplates = hasPermission('template_view');
  const canCreateTemplate = hasPermission('template_create');
  const canEditTemplate = hasPermission('template_edit');
  const canDeleteTemplate = hasPermission('template_delete');
  
  // Determinar la pestaña inicial basada en permisos
  const getInitialTab = () => {
    if (canViewServices) return 'services';
    if (canViewTemplates) return 'templates';
    return 'services'; // Default fallback
  };
  
  // Estado para pestañas
  const [activeTab, setActiveTab] = useState<'services' | 'templates'>(getInitialTab());
  
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
    if (activeTab === 'services' && canViewServices) {
      fetchServices();
    } else if (activeTab === 'templates' && canViewTemplates) {
      fetchTemplates();
    }
  }, [activeTab, canViewServices, canViewTemplates]);

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
      // Obtener la lista básica de plantillas
      const data = await serviceTemplatesService.getServiceTemplates();
      
      // Para cada plantilla, enriquecer con datos de servicios
      const enrichedTemplates = await Promise.all(
        data.map(async (template) => {
          // Obtener los servicios relacionados
          const serviceRelations = await serviceTemplatesService.getTemplateServiceRelations(template.id!);
          
          // Retornar plantilla enriquecida
          return {
            ...template,
            services: serviceRelations.map(rel => ({
              id: rel.service_id,
              name: '', // El nombre no es importante para el conteo
              description: '',
              icon_name: '',
              sub_services: []
            }))
          };
        })
      );
      
      setTemplates(enrichedTemplates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las plantillas');
      console.error('Error al cargar plantillas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplateDetails = async (templateId: number) => {
    setIsSubmitting(true);
    try {
      // 1. Cargar la plantilla básica
      const template = await serviceTemplatesService.getServiceTemplateById(templateId);
      
      // 2. Obtener los servicios seleccionados para esta plantilla
      const tempServiceRelations = await serviceTemplatesService.getTemplateServiceRelations(templateId);
      
      // 3. Obtener los subservicios seleccionados para esta plantilla
      const tempSubServiceRelations = await serviceTemplatesService.getTemplateSubServiceRelations(templateId);
      
      // 4. Crear un objeto enriquecido con toda la información
      const enrichedTemplate = {
        ...template,
        // Asegurarse de que services existe
        services: tempServiceRelations.map(rel => 
          services.find(s => s.id === rel.service_id) || { 
            id: rel.service_id, 
            name: `Servicio ${rel.service_id}`,
            sub_services: []
          }
        ),
        // Añadir subservicios
        subservices: tempSubServiceRelations,
        // Crear service_selections
        service_selections: tempServiceRelations.map(rel => ({
          service_id: rel.service_id,
          sub_service_ids: tempSubServiceRelations
            .filter(sub => sub.service_id === rel.service_id)
            .map(sub => sub.id)
        }))
      };
      
      setCurrentTemplate(enrichedTemplate);
      setIsEditTemplateModalOpen(true);
    } catch (err) {
      console.error('Error al cargar detalles de plantilla:', err);
      setModalError(err instanceof Error ? err.message : 'Error al cargar detalles de la plantilla');
    } finally {
      setIsSubmitting(false);
    }
  };  
  
  // HANDLERS PARA SERVICIOS
  const handleAddService = () => {
    if (!canCreateService) return;
    
    setModalError(null);
    setIsAddModalOpen(true);
  };
  
  const handleEditService = (service: Service) => {
    if (!canEditService) return;
    
    setModalError(null);
    setCurrentService(service);
    setIsEditModalOpen(true);
  };
  
  const handleDeleteClick = (service: Service) => {
    if (!canDeleteService) return;
    
    setModalError(null);
    setCurrentService(service);
    setIsDeleteModalOpen(true);
  };
  
  const handleDeleteService = async () => {
    if (!currentService || !currentService.id || !canDeleteService) return;
    
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
    if (!canCreateService) return;
    
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
    if (!currentService || !currentService.id || !canEditService) return;
    
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
    if (!canCreateTemplate) return;
    
    setModalError(null);
    setIsAddTemplateModalOpen(true);
  };
  
  const handleEditTemplate = (template: ServiceTemplate) => {
    if (!canEditTemplate) return;
    
    setModalError(null);
    fetchTemplateDetails(template.id!);
  };
  
  const handleDeleteTemplateClick = (template: ServiceTemplate) => {
    if (!canDeleteTemplate) return;
    
    setModalError(null);
    setCurrentTemplate(template);
    setIsDeleteTemplateModalOpen(true);
  };
  
  const handleDeleteTemplate = async () => {
    if (!currentTemplate || !currentTemplate.id || !canDeleteTemplate) return;
    
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
    if (!canCreateTemplate) return;
    
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
    if (!currentTemplate || !currentTemplate.id || !canEditTemplate) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      console.log('Datos del formulario:', data);
      
      // Preparar datos para enviar al backend
      const templateData = {
        name: data.name,
        description: data.description,
        is_public: data.isPublic,
        // Convertir al formato que espera el backend
        service_selections: data.serviceSelections.map(sel => ({
          service_id: sel.serviceId,
          sub_service_ids: sel.subServiceIds
        }))
      };
      
      console.log('Datos a enviar al backend:', templateData);
      
      // Llamar al servicio de actualización
      await serviceTemplatesService.updateServiceTemplate(
        currentTemplate.id, 
        templateData
      );
      
      // Recargamos las plantillas después de actualizar
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

  // Filtrar pestañas basadas en permisos
  const availableTabs = [
    canViewServices && {
      id: 'services',
      label: 'Servicios',
      isActive: activeTab === 'services',
      onClick: () => setActiveTab('services')
    },
    canViewTemplates && {
      id: 'templates',
      label: 'Plantillas',
      isActive: activeTab === 'templates',
      onClick: () => setActiveTab('templates')
    }
  ].filter(Boolean) as Array<{
    id: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
  }>;

  // Configuración del botón de acción basado en permisos
  const actionButton = (() => {
    if (activeTab === 'services' && canCreateService) {
      return (
        <DashboardButton
          onClick={handleAddService}
          leftIcon={<PlusIcon className="w-5 h-5" />}
          className="w-full sm:w-auto"
        >
          Agregar Servicio
        </DashboardButton>
      );
    }
    
    if (activeTab === 'templates' && canCreateTemplate) {
      return (
        <DashboardButton
          onClick={handleAddTemplate}
          leftIcon={<PlusIcon className="w-5 h-5" />}
          className="w-full sm:w-auto"
        >
          Crear Plantilla
        </DashboardButton>
      );
    }
    
    return null;
  })();

  // Preparar el mensaje de error para el ConfigPageTemplate
  const errorComponent = error ? (
    <ApiErrorHandler 
      error={error} 
      onRetry={activeTab === 'services' ? fetchServices : fetchTemplates} 
      resourceName={activeTab === 'services' ? "los servicios" : "las plantillas"}
    />
  ) : null;
  
  // Mostrar un mensaje si el usuario no tiene permisos para ninguna pestaña
  if (availableTabs.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Restringido</h2>
        <p className="text-gray-600">
          No tienes permisos para acceder a esta sección. Contacta con el administrador si crees que esto es un error.
        </p>
      </div>
    );
  }
  
  return (
    <ConfigPageTemplate
      title="Gestión de Servicios y Plantillas"
      actionButton={actionButton}
      tabs={availableTabs}
      error={errorComponent}
    >
      <div className="p-0">
        {activeTab === 'services' ? (
          <DashboardDataTable
            columns={serviceColumns}
            data={services}
            keyExtractor={(service) => service.id?.toString() || ''}
            onEdit={canEditService ? handleEditService : undefined}
            onDelete={canDeleteService ? handleDeleteClick : undefined}
            actionColumn={canEditService || canDeleteService}
            emptyMessage={isLoading ? "Cargando servicios..." : "No hay servicios configurados"}
            isLoading={isLoading}
          />
        ) : (
          <DashboardDataTable
            columns={templateColumns}
            data={templates}
            keyExtractor={(template) => template.id?.toString() || ''}
            onEdit={canEditTemplate ? handleEditTemplate : undefined}
            onDelete={canDeleteTemplate ? handleDeleteTemplateClick : undefined}
            actionColumn={canEditTemplate || canDeleteTemplate}
            emptyMessage={isLoading ? "Cargando plantillas..." : "No hay plantillas configuradas"}
            isLoading={isLoading}
          />
        )}
      </div>
      
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
              serviceSelections: 
                // Si hay service_selections directamente en la respuesta, úsalos
                currentTemplate.service_selections 
                  ? currentTemplate.service_selections.map(sel => ({
                      serviceId: sel.service_id,
                      subServiceIds: sel.sub_service_ids || []
                    }))
                  : // Si no hay service_selections, construirlos desde services y subservices
                    currentTemplate.services 
                      ? currentTemplate.services.map(service => {
                          // Buscar los subservicios asociados a este servicio
                          let subServiceIds: number[] = [];
                          
                          // Si hay subservices directamente en la plantilla
                          if (currentTemplate.subservices && Array.isArray(currentTemplate.subservices)) {
                            subServiceIds = currentTemplate.subservices
                              .filter(sub => sub.service_id === service.id)
                              .map(sub => sub.id!)
                              .filter(Boolean);
                          }
                          
                          console.log(`Servicio ${service.id} - subservicios:`, subServiceIds);
                          
                          return {
                            serviceId: service.id!,
                            subServiceIds: subServiceIds
                          };
                        })
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
    </ConfigPageTemplate>
  );
};

export default ServicesSettings;