// src/features/dashboard/components/ui/DashboardModal.tsx modificado
import React, { useEffect, useRef } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

export interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnClickOutside?: boolean;
  preventCloseOnEsc?: boolean;
  error?: string | null;
  success?: string | null;
}

const DashboardModal: React.FC<DashboardModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnClickOutside = true,
  preventCloseOnEsc = false,
  error = null,
  success = null,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Lock body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    // Handle ESC key press
    const handleEscKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !preventCloseOnEsc) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscKeyPress);
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscKeyPress);
    };
  }, [isOpen, onClose, preventCloseOnEsc]);
  
  // Efecto para ocultar automáticamente el mensaje de éxito después de un tiempo
  useEffect(() => {
    let timer: number | undefined;
    
    if (success) {
      timer = window.setTimeout(() => {
      }, 3000);
    }
    
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [success]);
  
  if (!isOpen) return null;
  
  // Handle click outside modal content
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnClickOutside && modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };
  
  // Determine max-width based on size
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size];
  
  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
      
      {/* Modal dialog alignment */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Modal content */}
        <div
          ref={modalRef}
          className={`relative bg-white rounded-lg shadow-xl transform transition-all w-full ${sizeClasses} max-h-[90vh] flex flex-col`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-4 border-b border-gray-200">
            <h3 
              id="modal-title" 
              className="text-lg font-medium text-gray-900"
            >
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-black p-1 rounded-full transition duration-150 ease-in-out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Body with scrolling */}
          <div className="p-6 overflow-y-auto">
            {/* Mostrar mensaje de error si existe */}
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}
            
            {/* Mostrar mensaje de éxito si existe */}
            {success && (
              <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-start">
                <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Operación exitosa</p>
                  <p className="text-sm mt-1">{success}</p>
                </div>
              </div>
            )}
            
            {children}
          </div>
          
          {/* Footer with action buttons */}
          {footer && (
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardModal;