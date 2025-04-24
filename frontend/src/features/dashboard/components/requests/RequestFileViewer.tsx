// src/features/dashboard/components/requests/RequestFileViewer.tsx
import React, { useState } from 'react';
import DashboardCard from '../ui/DashboardCard';
import DashboardButton from '../ui/DashboardButton';
import { 
  DocumentTextIcon, 
  DocumentArrowDownIcon,
  ArrowTopRightOnSquareIcon,
  TrashIcon,
  DocumentPlusIcon
} from '@heroicons/react/24/outline';

interface RequestFile {
  id: string;
  name: string;
  description?: string;
  type: string;
  size: string;
  uploadDate: string;
  url: string;
}

interface RequestFileViewerProps {
  requestId: string;
  files: RequestFile[];
  onAddFile?: () => void;
  onDeleteFile?: (fileId: string) => void;
  canUpload?: boolean;
}

const RequestFileViewer: React.FC<RequestFileViewerProps> = ({
  files,
  onAddFile,
  onDeleteFile,
  canUpload = false
}) => {
  // Estado para el modal de visualización de PDF
  const [selectedFile, setSelectedFile] = useState<RequestFile | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  
  // Función para abrir el visualizador de PDF
  const handleViewFile = (file: RequestFile) => {
    setSelectedFile(file);
    setIsViewerOpen(true);
  };
  
  // Función para simular descarga
  const handleDownload = (file: RequestFile) => {
    // En una aplicación real, aquí harías una petición para descargar el archivo
    console.log(`Descargando archivo: ${file.name}`);
    
    // Simulamos apertura de una nueva pestaña con el archivo
    window.open(file.url, '_blank');
  };
  
  return (
    <>
      <DashboardCard 
        title="Archivos" 
        subtitle="Documentos relacionados a esta solicitud"
        headerAction={
          canUpload && onAddFile ? (
            <DashboardButton
              size="sm"
              variant="outline"
              onClick={onAddFile}
              leftIcon={<DocumentPlusIcon className="h-4 w-4" />}
            >
              Subir
            </DashboardButton>
          ) : null
        }
      >
        {files.length === 0 ? (
          <div className="py-8 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay archivos asociados a esta solicitud.</p>
            {canUpload && onAddFile && (
              <DashboardButton 
                className="mt-4"
                variant="outline"
                size="sm"
                onClick={onAddFile}
              >
                Subir archivo
              </DashboardButton>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {files.map((file) => (
              <div key={file.id} className="py-4 flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-6 w-6 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      {file.description && (
                        <p className="text-xs text-gray-500 truncate">{file.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <span className="capitalize">{file.type}</span>
                        <span className="mx-1">•</span>
                        <span>{file.size}</span>
                        <span className="mx-1">•</span>
                        <span>Subido el {file.uploadDate}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <DashboardButton
                    size="sm"
                    variant="text"
                    onClick={() => handleViewFile(file)}
                    leftIcon={<ArrowTopRightOnSquareIcon className="h-4 w-4" />}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Ver
                  </DashboardButton>
                  <DashboardButton
                    size="sm"
                    variant="text"
                    onClick={() => handleDownload(file)}
                    leftIcon={<DocumentArrowDownIcon className="h-4 w-4" />}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Descargar
                  </DashboardButton>
                  {onDeleteFile && canUpload && (
                    <DashboardButton
                      size="sm"
                      variant="text"
                      onClick={() => onDeleteFile(file.id)}
                      leftIcon={<TrashIcon className="h-4 w-4" />}
                      className="text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </DashboardButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardCard>
      
      {/* Modal para visualización de PDF */}
      {isViewerOpen && selectedFile && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black opacity-50 transition-opacity" onClick={() => setIsViewerOpen(false)}></div>
            
            {/* Modal container */}
            <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-5xl w-full z-10 flex flex-col h-5/6">
              {/* Modal header */}
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedFile.name}
                </h3>
                <div className="flex space-x-2">
                  <DashboardButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(selectedFile)}
                    leftIcon={<DocumentArrowDownIcon className="h-4 w-4" />}
                  >
                    Descargar
                  </DashboardButton>
                  <button
                    onClick={() => setIsViewerOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* PDF Viewer */}
              <div className="flex-1 overflow-hidden">
                <iframe
                  src={selectedFile.url}
                  className="w-full h-full"
                  title={selectedFile.name}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RequestFileViewer;