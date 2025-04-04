import React, { useState } from 'react';
import ActivityTypeStep, { ActivityType } from './ActivityTypeStep';
import { ActivityDetailsStep, ServicesStep, RequestorInfoStep } from './PlaceholderSteps';
import Stepper from './components/Stepper';

const ServiceRequestForm: React.FC = () => {
  // Estado para controlar el paso actual
  const [currentStep, setCurrentStep] = useState(1);
  
  // Estado para almacenar el tipo de actividad seleccionada
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);

  // Función para avanzar al siguiente paso
  const handleNextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  // Función para retroceder al paso anterior
  const handlePrevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  // Función para manejar la selección de actividad
  const handleActivitySelect = (activity: ActivityType) => {
    setSelectedActivity(activity);
  };

  // Determinar si el botón de siguiente paso debe estar deshabilitado
  const isNextButtonDisabled = () => {
    // En el paso 1, se necesita seleccionar un tipo de actividad
    if (currentStep === 1) {
      return !selectedActivity;
    }
    
    // Para los otros pasos, podemos agregar validaciones adicionales más adelante
    return false;
  };

  // Renderizar el contenido correspondiente según el paso actual
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ActivityTypeStep 
            selectedActivity={selectedActivity} 
            onActivitySelect={handleActivitySelect} 
          />
        );
      case 2:
        return <ActivityDetailsStep activityType={selectedActivity as ActivityType} />;
      case 3:
        return <ServicesStep />;
      case 4:
        return <RequestorInfoStep />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      {/* Progress Indicator */}
      <Stepper currentStep={currentStep} totalSteps={4} />

      {/* Form Content */}
      <div className="mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={handlePrevStep}
          className={`px-6 py-2 rounded-lg border-2 border-black text-black font-medium hover:bg-black/5 transition-colors ${
            currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={currentStep === 1}
        >
          Anterior
        </button>
        
        {currentStep < 4 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className={`px-6 py-2 rounded-lg bg-black text-white font-medium hover:bg-black/90 transition-colors ${
              isNextButtonDisabled() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isNextButtonDisabled()}
          >
            Siguiente
          </button>
        ) : (
          <button
            type="submit"
            className="px-6 py-2 rounded-lg bg-black text-white font-medium hover:bg-black/90 transition-colors"
          >
            Enviar Solicitud
          </button>
        )}
      </div>
    </div>
  );
};

export default ServiceRequestForm;