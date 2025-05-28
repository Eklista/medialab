// src/features/dashboard/pages/RequestsPage.tsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardCard from '../components/ui/DashboardCard';
import DashboardButton from '../components/ui/DashboardButton';
import DashboardModal from '../components/ui/DashboardModal';
import DashboardDataTable from '../components/ui/DashboardDataTable';
import { 
  ClipboardDocumentListIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon,
  DocumentPlusIcon,
  ClockIcon,
  CalendarDaysIcon,
  UserIcon,
  BuildingOfficeIcon,
  PlayIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

// Importamos datos mock para simular solicitudes
import { mockRequests } from '../data/mockRequests';
import { RequestStatus, ServiceRequest } from '../components/requests/types';
import { getStatusClass, getStatusLabel } from '../data/mockRequests';

const RequestsPage: React.FC = () => {
  const navigate = useNavigate();
  // Estado para las solicitudes
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([]);
  
  // Estado para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Estado para solicitud actual y modal
  const [currentRequest, setCurrentRequest] = useState<ServiceRequest | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  
  // Estado para historial de actividad
  const [activeLogRequest, setActiveLogRequest] = useState<string | null>(null);
  
  // Cargar solicitudes (simulación)
  useEffect(() => {
    // Simulamos una carga desde API
    const loadRequests = async () => {
      // En un caso real, aquí harías una llamada a tu API
      setTimeout(() => {
        setRequests(mockRequests);
        setFilteredRequests(mockRequests);
      }, 500);
    };
    
    loadRequests();
  }, []);
  
  // Efecto para aplicar filtros cuando cambian
  useEffect(() => {
    let result = [...requests];
    
    // Aplicar filtro de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        req => 
          req.title.toLowerCase().includes(searchLower) || 
          req.requester.name.toLowerCase().includes(searchLower) ||
          req.requester.department.toLowerCase().includes(searchLower)
      );
    }
    
    // Aplicar filtro de estado
    if (statusFilter !== 'all') {
      result = result.filter(req => req.status === statusFilter);
    }
    
    // Aplicar filtro de tipo
    if (typeFilter !== 'all') {
      result = result.filter(req => req.type === typeFilter);
    }
    
    setFilteredRequests(result);
  }, [searchTerm, statusFilter, typeFilter, requests]);
  
  // Calcular datos paginados
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  // Función para cambiar de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Funciones para manejar modales
  const handleViewRequest = (request: ServiceRequest) => {
    navigate(`/dashboard/requests/${request.id}`);
  };
  
  const handleShowDownload = (request: ServiceRequest) => {
    setCurrentRequest(request);
    setIsDownloadModalOpen(true);
  };
  
  // Función para actualizar estado de una solicitud
  const handleStatusChange = (requestId: string, newStatus: RequestStatus) => {
    const updatedRequests = requests.map(req => 
      req.id === requestId ? { ...req, status: newStatus, statusLabel: getStatusLabel(newStatus), statusClass: getStatusClass(newStatus) } : req
    );
    
    setRequests(updatedRequests);
    
    // Si hay una solicitud actual seleccionada, actualizarla también
    if (currentRequest && currentRequest.id === requestId) {
      setCurrentRequest({ 
        ...currentRequest, 
        status: newStatus, 
        statusLabel: getStatusLabel(newStatus), 
        statusClass: getStatusClass(newStatus) 
      });
    }
    
    // Mostrar notificación
    alert(`Estado de solicitud ${requestId} actualizado a ${getStatusLabel(newStatus)}`);
  };
  
  // Función para generar pdf
  const handleGeneratePdf = () => {
    if (!currentRequest) return;
    
    // En una aplicación real, aquí generarías el PDF
    console.log(`Generando PDF para solicitud: ${currentRequest.id}`);
    
    // Simulamos descarga con un timeout
    setTimeout(() => {
      // Crear un enlace de descarga simulado
      const link = document.createElement('a');
      link.href = '#';
      link.download = `solicitud-${currentRequest.id}.pdf`;
      link.click();
      
      setIsDownloadModalOpen(false);
    }, 1000);
  };
  
  // Función para generar registros de actividad simulados basados en el estado de la solicitud
  const generateActivityLogs = (request: ServiceRequest) => {
    const logs = [];
    
    // Log de creación
    logs.push({
      date: new Date(request.createDate),
      action: 'Solicitud creada',
      user: request.requester.name
    });
    
    if (request.status !== 'pending') {
      // Si el estado no es pendiente, añadir la aprobación/rechazo
      const dateApproved = new Date(request.createDate);
      dateApproved.setDate(dateApproved.getDate() + 1);
      
      if (request.status === 'rejected') {
        logs.push({
          date: dateApproved,
          action: 'Solicitud rechazada',
          user: 'Admin'
        });
      } else {
        logs.push({
          date: dateApproved,
          action: 'Solicitud aprobada',
          user: 'Admin'
        });
      }
    }
    
    if (request.status === 'in_progress' || request.status === 'completed') {
      // Añadir inicio de producción
      const dateStarted = new Date(request.createDate);
      dateStarted.setDate(dateStarted.getDate() + 2);
      
      logs.push({
        date: dateStarted,
        action: 'Producción iniciada',
        user: 'Productor'
      });
    }
    
    if (request.status === 'completed') {
      // Añadir finalización
      const dateCompleted = new Date(request.createDate);
      dateCompleted.setDate(dateCompleted.getDate() + 7);
      
      logs.push({
        date: dateCompleted,
        action: 'Producción completada',
        user: 'Productor'
      });
    }
    
    // Ordenar por fecha (más reciente primero)
    return logs.sort((a, b) => b.date.getTime() - a.date.getTime());
  };
  
  // Función auxiliar para formatear fechas
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Solicitudes</h1>
            <p className="text-gray-500">Gestiona y visualiza todas las solicitudes de servicio</p>
          </div>
          <DashboardButton
            leftIcon={<DocumentPlusIcon className="h-5 w-5" />}
            onClick={() => window.open('/service-request', '_blank')}
          >
            Nueva Solicitud
          </DashboardButton>
        </div>

        {/* Filtros */}
        <DashboardCard>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por título, solicitante o departamento..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <FunnelIcon className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
              </div>
              
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-black"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as RequestStatus | 'all')}
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="approved">Aprobadas</option>
                <option value="in_progress">En progreso</option>
                <option value="completed">Completadas</option>
                <option value="cancelled">Canceladas</option>
                <option value="rejected">Rechazadas</option>
              </select>
              
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-black"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">Todos los tipos</option>
                <option value="single">Actividad Única</option>
                <option value="recurrent">Actividad Recurrente</option>
                <option value="podcast">Podcast</option>
                <option value="course">Curso</option>
              </select>
            </div>
          </div>
        </DashboardCard>

        {/* Tabla de solicitudes */}
        <DashboardCard>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay solicitudes</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                No se encontraron solicitudes que coincidan con los criterios de búsqueda.
                Intente con diferentes filtros o cree una nueva solicitud.
              </p>
              <DashboardButton
                className="mt-6"
                onClick={() => window.open('/service-request', '_blank')}
              >
                Crear Nueva Solicitud
              </DashboardButton>
            </div>
          ) : (
            <DashboardDataTable
              columns={[
                {
                  header: 'Título',
                  accessor: (request: ServiceRequest) => (
                    <div>
                      <div className="font-medium text-black">{request.title}</div>
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <span 
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-1.5 ${
                            request.typeClass
                          }`}
                        >
                          {request.typeLabel}
                        </span>
                        <span className="flex items-center">
                          <CalendarDaysIcon className="h-3 w-3 mr-0.5" />
                          {request.dateLabel}
                        </span>
                      </div>
                    </div>
                  )
                },
                {
                  header: 'Solicitante',
                  accessor: (request: ServiceRequest) => (
                    <div>
                      <div className="flex items-center text-sm">
                        <UserIcon className="h-3.5 w-3.5 mr-1 text-gray-500" />
                        {request.requester.name}
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <BuildingOfficeIcon className="h-3 w-3 mr-0.5" />
                        {request.requester.department}
                      </div>
                    </div>
                  )
                },
                {
                  header: 'Servicios',
                  accessor: (request: ServiceRequest) => (
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {request.services.slice(0, 2).map((service) => (
                        <span 
                          key={service.id}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                          title={service.description}
                        >
                          {service.name}
                        </span>
                      ))}
                      {request.services.length > 2 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-500">
                          +{request.services.length - 2} más
                        </span>
                      )}
                    </div>
                  )
                },
                {
                  header: 'Estado',
                  accessor: (request: ServiceRequest) => (
                    <div className="flex items-center relative">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.statusClass
                        }`}
                      >
                        {request.statusLabel}
                      </span>
                      {request.status === 'in_progress' && (
                        <span className="ml-2 flex items-center text-xs text-gray-500">
                          <ClockIcon className="h-3 w-3 mr-0.5" />
                          Hace {request.daysInProgress || 1} día(s)
                        </span>
                      )}
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveLogRequest(activeLogRequest === request.id ? null : request.id);
                        }}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                        title="Ver historial de actividad"
                      >
                        <ClockIcon className="h-4 w-4" />
                      </button>
                      
                      {activeLogRequest === request.id && (
                        <div className="absolute z-10 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-3 right-0 top-6">
                          <h4 className="text-sm font-medium mb-2 pb-1 border-b border-gray-200">Historial de actividad</h4>
                          <div className="max-h-40 overflow-y-auto space-y-2">
                            {generateActivityLogs(request).map((log, index) => (
                              <div key={index} className="text-xs">
                                <span className="text-gray-500">{formatDate(log.date)}</span>
                                <p className="text-gray-800">
                                  {log.action} {log.user && <span className="text-gray-500">por {log.user}</span>}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ),
                  className: 'relative'
                }
              ]}
              data={currentItems}
              keyExtractor={(request) => request.id}
              actionColumn={true}
              pagination={{
                currentPage,
                totalPages,
                onPageChange: handlePageChange,
                itemsPerPage,
                totalItems: filteredRequests.length
              }}
              renderActions={(request: ServiceRequest) => (
                <div className="flex items-center space-x-2">
                  <DashboardButton
                    variant="text"
                    size="sm"
                    onClick={() => handleViewRequest(request)}
                    leftIcon={<EyeIcon className="h-4 w-4" />}
                    className="text-gray-600 hover:text-gray-900"
                    title="Ver detalles"
                  >
                    Ver
                  </DashboardButton>
                  
                  <DashboardButton
                    variant="text"
                    size="sm"
                    onClick={() => handleShowDownload(request)}
                    leftIcon={<DocumentArrowDownIcon className="h-4 w-4" />}
                    className="text-gray-600 hover:text-gray-900"
                    title="Descargar PDF"
                  >
                    PDF
                  </DashboardButton>
                  
                  {request.status === 'pending' && (
                    <>
                      <DashboardButton
                        variant="text"
                        size="sm"
                        onClick={() => handleStatusChange(request.id, 'rejected')}
                        leftIcon={<XMarkIcon className="h-4 w-4" />}
                        className="text-red-600 hover:text-red-800"
                        title="Rechazar solicitud"
                      >
                        Rechazar
                      </DashboardButton>
                      
                      <DashboardButton
                        variant="text"
                        size="sm"
                        onClick={() => handleStatusChange(request.id, 'approved')}
                        leftIcon={<CheckIcon className="h-4 w-4" />}
                        className="text-green-600 hover:text-green-800"
                        title="Aprobar solicitud"
                      >
                        Aprobar
                      </DashboardButton>
                    </>
                  )}
                  
                  {request.status === 'rejected' && (
                    <DashboardButton
                      variant="text"
                      size="sm"
                      onClick={() => handleStatusChange(request.id, 'pending')}
                      leftIcon={<ArrowPathIcon className="h-4 w-4" />}
                      className="text-gray-600 hover:text-gray-900"
                      title="Restaurar solicitud a pendiente"
                    >
                      Restaurar
                    </DashboardButton>
                  )}
                  
                  {request.status === 'approved' && (
                    <DashboardButton
                      variant="text"
                      size="sm"
                      onClick={() => handleStatusChange(request.id, 'in_progress')}
                      leftIcon={<PlayIcon className="h-4 w-4" />}
                      className="text-indigo-600 hover:text-indigo-800"
                      title="Iniciar producción"
                    >
                      Producción
                    </DashboardButton>
                  )}
                </div>
              )}
            />
          )}
        </DashboardCard>
      </div>

      {/* Modal de descarga */}
      <DashboardModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        title="Descargar PDF de Solicitud"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Puede descargar un archivo PDF con todos los detalles de esta solicitud para su revisión o archivo.
          </p>
          
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <ClipboardDocumentListIcon className="h-10 w-10 text-red-500 mr-3" />
              <div>
                <p className="font-medium">{currentRequest?.title}</p>
                <p className="text-sm text-gray-500">Formato PDF</p>
              </div>
            </div>
            <DashboardButton onClick={handleGeneratePdf}>
              Descargar
            </DashboardButton>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg text-blue-800 text-sm">
            <p>El archivo incluirá todos los detalles de la solicitud, incluyendo información del solicitante, servicios requeridos y detalles específicos.</p>
          </div>
        </div>
      </DashboardModal>
    </DashboardLayout>
  );
};

export default RequestsPage;