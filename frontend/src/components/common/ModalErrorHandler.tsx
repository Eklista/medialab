// src/components/common/ModalErrorHandler.tsx
import React from 'react';

interface ModalErrorHandlerProps {
  error: string | null;
  onRetry?: () => void;
}

const ModalErrorHandler: React.FC<ModalErrorHandlerProps> = ({ error, onRetry }) => {
  if (!error) return null;
  
  return (
    <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
      <p className="font-medium">Error</p>
      <p className="text-sm mt-1">{error}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="mt-2 text-sm font-medium text-red-700 hover:text-red-900"
        >
          Intentar nuevamente
        </button>
      )}
    </div>
  );
};

export default ModalErrorHandler;