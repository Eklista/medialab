// src/features/service-request/components/MultiDayPicker.tsx
import React, { useState } from 'react';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Button from './Button';
import Modal from './Modal';

export interface MultiDayPickerProps {
  id: string;
  name: string;
  label?: string;
  selectedDates: Date[];
  onChange: (dates: Date[]) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  helperText?: string;
  minDate?: Date;
  maxDate?: Date;
}

const MultiDayPicker: React.FC<MultiDayPickerProps> = ({
  id,
  label,
  selectedDates,
  onChange,
  required = false,
  disabled = false,
  error,
  className = '',
  helperText,
  minDate,
  maxDate,
}) => {
  // Estado para el modal del calendario
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Estado para almacenar temporalmente las fechas seleccionadas en el modal
  const [tempSelectedDates, setTempSelectedDates] = useState<Date[]>([]);
  // Estado para saber si hay cambios sin guardar
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // Estado para el modal de confirmación
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Función para formatar fecha en DD/MM/YYYY
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Abrir el modal y copiar las fechas actuales a las temporales
  const handleOpenModal = () => {
    setTempSelectedDates([...selectedDates]);
    setHasUnsavedChanges(false);
    setIsModalOpen(true);
  };

  // Función para manejar el intento de cerrar el modal
  const handleCloseModal = () => {
    // Si hay cambios sin guardar, mostramos el modal de confirmación
    if (hasUnsavedChanges) {
      setIsConfirmModalOpen(true);
    } else {
      // Si no hay cambios, cerramos directamente
      setIsModalOpen(false);
    }
  };

  // Función para manejar la selección de fechas dentro del modal
  const handleDateChange = (date: Date | null) => {
    if (!date) return;
    
    // Comprobamos si la fecha ya está seleccionada
    const dateIndex = tempSelectedDates.findIndex(selectedDate => 
      selectedDate.getFullYear() === date.getFullYear() && 
      selectedDate.getMonth() === date.getMonth() && 
      selectedDate.getDate() === date.getDate()
    );
    
    if (dateIndex >= 0) {
      // Si la fecha ya está seleccionada, la eliminamos (toggle)
      const newDates = [...tempSelectedDates];
      newDates.splice(dateIndex, 1);
      setTempSelectedDates(newDates);
    } else {
      // Si la fecha no está seleccionada, la añadimos
      setTempSelectedDates([...tempSelectedDates, date]);
    }
    
    // Marcamos que hay cambios sin guardar
    setHasUnsavedChanges(true);
  };

  // Guardar las fechas seleccionadas y cerrar el modal
  const handleSaveDates = () => {
    onChange(tempSelectedDates);
    setIsModalOpen(false);
    setHasUnsavedChanges(false);
  };

  // Confirmar salir sin guardar
  const handleConfirmDiscard = () => {
    setIsConfirmModalOpen(false);
    setIsModalOpen(false);
    setHasUnsavedChanges(false);
  };

  // Cancelar salir sin guardar
  const handleCancelDiscard = () => {
    setIsConfirmModalOpen(false);
  };

  // Eliminar una fecha específica de la selección principal (fuera del modal)
  const handleRemoveDate = (indexToRemove: number) => {
    onChange(selectedDates.filter((_, index) => index !== indexToRemove));
  };

  // Eliminar una fecha específica de la selección temporal (dentro del modal)
  const handleRemoveTempDate = (indexToRemove: number) => {
    setTempSelectedDates(tempSelectedDates.filter((_, index) => index !== indexToRemove));
    setHasUnsavedChanges(true);
  };

  // Limpiar todas las fechas seleccionadas temporales
  const handleClearTempDates = () => {
    setTempSelectedDates([]);
    setHasUnsavedChanges(true);
  };

  // Limpiar todas las fechas seleccionadas principales
  const handleClearAllDates = () => {
    onChange([]);
  };

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-black mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleOpenModal}
            disabled={disabled}
            leftIcon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          >
            Selección Manual de Fechas
          </Button>
          
          {selectedDates.length > 0 && (
            <span className="text-sm text-gray-500">
              {selectedDates.length} {selectedDates.length === 1 ? 'fecha seleccionada' : 'fechas seleccionadas'}
            </span>
          )}
        </div>
        
        {selectedDates.length > 0 && (
          <div className="mt-3">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-700">Fechas seleccionadas:</p>
              {selectedDates.length > 0 && (
                <Button 
                  variant="text" 
                  size="xs" 
                  onClick={handleClearAllDates}
                  className="text-red-600 hover:text-red-800"
                >
                  Limpiar todo
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
              {selectedDates.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No hay fechas seleccionadas</p>
              ) : (
                selectedDates.sort((a, b) => a.getTime() - b.getTime()).map((date, index) => (
                  <div 
                    key={index}
                    className="bg-white rounded-full px-3 py-1 text-sm flex items-center shadow-sm border border-gray-200"
                  >
                    <span>{formatDate(date)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDate(index)}
                      className="ml-2 text-gray-500 hover:text-red-500"
                      disabled={disabled}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
      
      {/* Modal para selección de fechas */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Selección Manual de Fechas"
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button onClick={handleSaveDates}>
              Aceptar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600 mb-2">
            Seleccione las fechas para su actividad haciendo clic en el calendario. Haga clic nuevamente en una fecha seleccionada para desmarcarla.
          </p>
          
          <div className="relative flex justify-center">
            <ReactDatePicker
              selected={null}
              onChange={(date) => handleDateChange(date)}
              inline
              monthsShown={1}
              highlightDates={tempSelectedDates}
              minDate={minDate}
              maxDate={maxDate}
              calendarClassName="border border-gray-200 rounded-lg shadow-sm"
            />
            
            {tempSelectedDates.length > 0 && (
              <div className="absolute top-2 right-2">
                <button
                  type="button"
                  onClick={handleClearTempDates}
                  className="bg-white text-gray-500 hover:text-red-500 p-1 rounded-full shadow-sm border border-gray-200"
                  title="Limpiar selección"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          {tempSelectedDates.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium text-gray-700">Fechas seleccionadas: {tempSelectedDates.length}</p>
                <Button 
                  variant="text" 
                  size="xs" 
                  onClick={handleClearTempDates}
                  className="text-red-600 hover:text-red-800"
                >
                  Limpiar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
                {tempSelectedDates.sort((a, b) => a.getTime() - b.getTime()).map((date, index) => (
                  <div 
                    key={index}
                    className="bg-white rounded-full px-3 py-1 text-sm flex items-center shadow-sm border border-gray-200"
                  >
                    <span>{formatDate(date)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTempDate(index)}
                      className="ml-2 text-gray-500 hover:text-red-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
      
      {/* Modal de confirmación */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelDiscard}
        title="¿Desea salir sin guardar?"
        footer={
          <>
            <Button variant="outline" onClick={handleCancelDiscard}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmDiscard}>
              Salir sin guardar
            </Button>
          </>
        }
      >
        <p className="text-gray-600">
          Ha realizado cambios en la selección de fechas que no se han guardado. 
          Si sale ahora, perderá estos cambios.
        </p>
      </Modal>
    </div>
  );
};

export default MultiDayPicker;