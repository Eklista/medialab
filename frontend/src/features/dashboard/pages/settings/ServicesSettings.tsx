// src/features/dashboard/pages/settings/ServicesSettings.tsx
import React, { useState } from 'react';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardModal from '../../components/ui/DashboardModal';
import DashboardDataTable from '../../components/ui/DashboardDataTable';
import ServiceForm, { ServiceFormData, SubService } from '../../components/config/ServiceForm';
import { PlusIcon } from '@heroicons/react/24/outline';

// Tipos
interface Service {
  id: string;
  name: string;
  description: string;
  iconName: string;
  subServices: SubService[];
}

const ServicesSettings: React.FC = () => {
  // Estado para servicios
  const [services, setServices] = useState<Service[]>([
    {
      id: 'audiovisual',
      name: 'Producción Audiovisual',
      description: 'Servicios relacionados con producción de contenido audiovisual',
      iconName: 'video-camera',
      subServices: [
        { id: 'video', name: 'Grabación de Video', description: 'Grabación profesional con equipo de alta calidad' },
        { id: 'audio', name: 'Grabación de Audio', description: 'Grabación y procesamiento de audio' },
        { id: 'editing', name: 'Edición de Video', description: 'Montaje y post-producción de contenido audiovisual' },
        { id: 'streaming', name: 'Transmisión en vivo', description: 'Streaming para eventos y actividades' }
      ]
    },
    {
      id: 'web',
      name: 'Desarrollo Web',
      description: 'Servicios relacionados con desarrollo y diseño web',
      iconName: 'code',
      subServices: [
        { id: 'website', name: 'Desarrollo de Sitios Web', description: 'Creación de sitios web responsivos' },
        { id: 'webapp', name: 'Aplicaciones Web', description: 'Desarrollo de aplicaciones web interactivas' }
      ]
    }
  ]);
  
  // Estado para modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handlers
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
  
  const handleDeleteService = () => {
    if (currentService) {
      setServices(services.filter(service => service.id !== currentService.id));
      setIsDeleteModalOpen(false);
      setCurrentService(null);
    }
  };
  
  const handleAddSubmit = (data: ServiceFormData) => {
    setIsSubmitting(true);
    
    // Simulamos una petición a la API
    setTimeout(() => {
      const newService: Service = {
        id: data.name.toLowerCase().replace(/\s+/g, '-'),
        ...data
      };
      
      setServices([...services, newService]);
      setIsAddModalOpen(false);
      setIsSubmitting(false);
    }, 500);
  };
  
  const handleEditSubmit = (data: ServiceFormData) => {
    if (!currentService) return;
    
    setIsSubmitting(true);
    
    // Simulamos una petición a la API
    setTimeout(() => {
      setServices(services.map(service => 
        service.id === currentService.id
          ? { ...service, ...data }
          : service
      ));
      
      setIsEditModalOpen(false);
      setCurrentService(null);
      setIsSubmitting(false);
    }, 500);
  };
  
  // Columnas para la tabla
  const columns = [
    {
      header: 'Nombre',
      accessor: (service: Service) => service.name
    },
    {
      header: 'Descripción',
      accessor: (service: Service) => service.description
    },
    {
      header: 'Icono',
      accessor: (service: Service) => service.iconName
    },
    {
      header: 'Subservicios',
      accessor: (service: Service) => (
        <span className="text-gray-600">{service.subServices.length} subservicios</span>
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
      
      <DashboardDataTable
        columns={columns}
        data={services}
        keyExtractor={(service) => service.id}
        onEdit={handleEditService}
        onDelete={handleDeleteClick}
        actionColumn={true}
        emptyMessage="No hay servicios configurados"
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
            initialData={currentService}
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
          >
            Cancelar
          </DashboardButton>
          <DashboardButton
            variant="danger"
            onClick={handleDeleteService}
          >
            Eliminar
          </DashboardButton>
        </div>
      </DashboardModal>
    </div>
  );
};

export default ServicesSettings;