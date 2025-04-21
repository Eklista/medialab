// src/components/common/ApiErrorHandler.tsx
import React from 'react';
import DashboardButton from '../../features/dashboard/components/ui/DashboardButton';

interface ApiErrorHandlerProps {
  error: string | null;
  onRetry?: () => void;
  resourceName?: string;
}

const ApiErrorHandler: React.FC<ApiErrorHandlerProps> = ({
  error,
  onRetry,
  resourceName = 'los datos'
}) => {
  if (!error) return null;

  // Determinar tipo de error para mostrar mensaje apropiado
  let errorMessage = error;
  let suggestedAction = '';

  if (error.includes('Network Error') || error.includes('conectar con el servidor')) {
    errorMessage = `No se pudo conectar con el servidor. Por favor verifica tu conexión a internet.`;
    suggestedAction = 'Intentar nuevamente';
  } else if (error.includes('401') || error.includes('Unauthorized')) {
    errorMessage = `No tienes autorización para acceder a ${resourceName}. Puede que tu sesión haya expirado.`;
    suggestedAction = 'Iniciar sesión nuevamente';
  } else if (error.includes('403') || error.includes('Forbidden')) {
    errorMessage = `No tienes los permisos necesarios para acceder a ${resourceName}.`;
    suggestedAction = 'Contactar al administrador';
  } else if (error.includes('404') || error.includes('Not Found')) {
    errorMessage = `No se encontró ${resourceName} en el servidor.`;
    suggestedAction = 'Verificar configuración';
  } else if (error.includes('timeout') || error.includes('Timeout')) {
    errorMessage = `La solicitud ha tardado demasiado tiempo. El servidor puede estar sobrecargado.`;
    suggestedAction = 'Intentar nuevamente más tarde';
  }

  return (
    <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
      <p className="font-medium">Error al cargar {resourceName}</p>
      <p>{errorMessage}</p>
      {suggestedAction && (
        <p className="mt-1 text-sm">
          <strong>Acción sugerida:</strong> {suggestedAction}
        </p>
      )}
      {onRetry && (
        <DashboardButton
          variant="text"
          onClick={onRetry}
          className="mt-2"
        >
          Reintentar
        </DashboardButton>
      )}
    </div>
  );
};

export default ApiErrorHandler;