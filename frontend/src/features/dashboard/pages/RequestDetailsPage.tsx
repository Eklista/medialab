import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  DocumentArrowDownIcon,
  CheckIcon,
  XMarkIcon,
  PlayIcon,
  ClockIcon,
  CalendarDaysIcon,
  UserIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  FolderIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardCard from '../components/ui/DashboardCard';
import DashboardButton from '../components/ui/DashboardButton';
import DashboardModal from '../components/ui/DashboardModal';
import RequestFileViewer from '../components/requests/RequestFileViewer';
import { mockRequests } from '../data/mockRequests';
import { ServiceRequest, RequestStatus } from '../components/requests/types';
import { getStatusClass, getStatusLabel } from '../data/mockRequests';

const RequestDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const foundRequest = mockRequests.find(req => req.id === id);
        if (foundRequest) {
          setRequest(foundRequest);
        } else {
          setError('Solicitud no encontrada');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading request details:', error);
        setError('Error al cargar los detalles de la solicitud');
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id]);

  const handleStatusChange = (newStatus: RequestStatus) => {
    if (!request) return;
    
    const updatedRequest = {
      ...request,
      status: newStatus,
      statusLabel: getStatusLabel(newStatus),
      statusClass: getStatusClass(newStatus)
    };
    
    setRequest(updatedRequest);
  };

  const handleGeneratePdf = () => {
    if (!request) return;
    // Simular generación de PDF
    console.log(`Generando PDF para solicitud: ${request.id}`);
    setIsDownloadModalOpen(false);
  };

  const handleConvertToProject = () => {
    if (!request) return;
    // Simular conversión a proyecto
    console.log(`Convirtiendo solicitud ${request.id} a proyecto`);
    setIsConvertModalOpen(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <DashboardCard>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </DashboardCard>
      </DashboardLayout>
    );
  }

  if (!request) {
    return (
      <DashboardLayout>
        <DashboardCard>
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
            Solicitud no encontrada
          </div>
        </DashboardCard>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header con botones de acción */}
        <div className="flex justify-between items-center">
          <DashboardButton
            variant="outline"
            onClick={() => navigate('/dashboard/requests')}
            leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          >
            Volver a solicitudes
          </DashboardButton>
          
          <div className="flex gap-2">
            <DashboardButton
              variant="outline"
              onClick={() => setIsDownloadModalOpen(true)}
              leftIcon={<DocumentArrowDownIcon className="h-5 w-5" />}
            >
              Descargar PDF
            </DashboardButton>
            
            {request.status === 'pending' && (
              <>
                <DashboardButton
                  variant="outline"
                  onClick={() => handleStatusChange('rejected')}
                  leftIcon={<XMarkIcon className="h-5 w-5" />}
                  className="text-red-600 hover:text-red-800"
                >
                  Rechazar
                </DashboardButton>
                <DashboardButton
                  variant="outline"
                  onClick={() => handleStatusChange('approved')}
                  leftIcon={<CheckIcon className="h-5 w-5" />}
                  className="text-green-600 hover:text-green-800"
                >
                  Aprobar
                </DashboardButton>
              </>
            )}
            
            {request.status === 'approved' && (
              <DashboardButton
                variant="outline"
                onClick={() => setIsConvertModalOpen(true)}
                leftIcon={<FolderIcon className="h-5 w-5" />}
                className="text-indigo-600 hover:text-indigo-800"
              >
                Convertir en Proyecto
              </DashboardButton>
            )}
            
            {request.status === 'approved' && (
              <DashboardButton
                variant="outline"
                onClick={() => handleStatusChange('in_progress')}
                leftIcon={<PlayIcon className="h-5 w-5" />}
                className="text-blue-600 hover:text-blue-800"
              >
                Iniciar Producción
              </DashboardButton>
            )}
          </div>
        </div>

        {/* Grid de información */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información principal */}
          <DashboardCard>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              {request.title}
            </h1>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${request.statusClass}`}>
                  {request.statusLabel}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${request.typeClass}`}>
                  {request.typeLabel}
                </span>
              </div>

              <div className="flex items-center text-sm text-gray-500">
                <CalendarDaysIcon className="h-4 w-4 mr-1" />
                {request.dateLabel}
              </div>

              <div className="space-y-2">
                <h2 className="text-sm font-medium text-gray-500">Solicitante</h2>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center text-gray-900">
                    <UserIcon className="h-4 w-4 mr-1" />
                    {request.requester.name}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                    {request.requester.department}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <EnvelopeIcon className="h-4 w-4 mr-1" />
                    {request.requester.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <PhoneIcon className="h-4 w-4 mr-1" />
                    {request.requester.phone}
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-medium text-gray-500">Servicios</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {request.services.map((service) => (
                    <span 
                      key={service.id}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                      title={service.description}
                    >
                      {service.name}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-medium text-gray-500">Notas Adicionales</h2>
                <p className="mt-1 text-gray-900">{request.additionalNotes}</p>
              </div>
            </div>
          </DashboardCard>

          {/* Detalles específicos según el tipo */}
          <DashboardCard>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalles de la Actividad</h2>
            
            {request.type === 'single' && request.details && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Fecha de la Actividad</h3>
                  <p className="mt-1 text-gray-900">{request.details.activityDate}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Horario</h3>
                  <p className="mt-1 text-gray-900">{request.details.startTime} - {request.details.endTime}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Ubicación</h3>
                  <p className="mt-1 text-gray-900">
                    {request.details.location.tower}, {request.details.location.classroom}
                  </p>
                </div>
              </div>
            )}

            {request.type === 'recurrent' && request.details && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Período</h3>
                  <p className="mt-1 text-gray-900">
                    {request.details.startDate} - {request.details.endDate}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Horario</h3>
                  <p className="mt-1 text-gray-900">{request.details.startTime} - {request.details.endTime}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Días</h3>
                  <p className="mt-1 text-gray-900">{request.details.weekDays.join(', ')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Ubicación</h3>
                  <p className="mt-1 text-gray-900">
                    {request.details.location.tower}, {request.details.location.classroom}
                  </p>
                </div>
              </div>
            )}

            {request.type === 'podcast' && request.details && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Período</h3>
                  <p className="mt-1 text-gray-900">
                    {request.details.startDate} - {request.details.endDate}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Episodios</h3>
                  <div className="mt-2 space-y-2">
                    {request.details.episodes.map((episode: { id: string; name: string; topic: string; recordingDate: string }) => (
                      <div key={episode.id} className="bg-gray-50 p-2 rounded">
                        <p className="font-medium">{episode.name}</p>
                        <p className="text-sm text-gray-500">{episode.topic}</p>
                        <p className="text-xs text-gray-400">Fecha: {episode.recordingDate}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Moderadores</h3>
                  <div className="mt-2 space-y-2">
                    {request.details.moderators.map((mod: { id: string; name: string; position: string; role: string }) => (
                      <div key={mod.id} className="bg-gray-50 p-2 rounded">
                        <p className="font-medium">{mod.name}</p>
                        <p className="text-sm text-gray-500">{mod.position}</p>
                        <p className="text-xs text-gray-400">Rol: {mod.role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DashboardCard>
        </div>

        {/* Historial de actividad y archivos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Historial de actividad */}
          <DashboardCard>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial de Actividad</h2>
            <div className="space-y-4">
              <div className="flex items-center text-sm text-gray-500">
                <ClockIcon className="h-4 w-4 mr-1" />
                <span>Creación: {request.createDate}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <DocumentTextIcon className="h-4 w-4 mr-1" />
                <span>Última actualización: {request.updateDate}</span>
              </div>
              {request.daysInProgress && (
                <div className="flex items-center text-sm text-gray-500">
                  <PlayIcon className="h-4 w-4 mr-1" />
                  <span>En progreso desde hace {request.daysInProgress} días</span>
                </div>
              )}
            </div>
          </DashboardCard>

          {/* Archivos */}
          <DashboardCard>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Archivos</h2>
            <RequestFileViewer 
              requestId={request.id} 
              files={request.files || []} 
            />
          </DashboardCard>
        </div>
      </div>

      {/* Modal de descarga PDF */}
      <DashboardModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        title="Descargar PDF de Solicitud"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Desea descargar un archivo PDF con todos los detalles de esta solicitud?
          </p>
          <div className="flex justify-end gap-2">
            <DashboardButton
              variant="outline"
              onClick={() => setIsDownloadModalOpen(false)}
            >
              Cancelar
            </DashboardButton>
            <DashboardButton onClick={handleGeneratePdf}>
              Descargar
            </DashboardButton>
          </div>
        </div>
      </DashboardModal>

      {/* Modal de conversión a proyecto */}
      <DashboardModal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        title="Convertir en Proyecto"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Desea convertir esta solicitud en un proyecto de producción?
          </p>
          <div className="flex justify-end gap-2">
            <DashboardButton
              variant="outline"
              onClick={() => setIsConvertModalOpen(false)}
            >
              Cancelar
            </DashboardButton>
            <DashboardButton onClick={handleConvertToProject}>
              Convertir
            </DashboardButton>
          </div>
        </div>
      </DashboardModal>
    </DashboardLayout>
  );
};

export default RequestDetailsPage; 