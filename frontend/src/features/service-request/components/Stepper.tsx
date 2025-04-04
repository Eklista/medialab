import React from 'react';

interface StepperProps {
  currentStep: number;
  totalSteps: number;
}

const Stepper: React.FC<StepperProps> = ({ currentStep, totalSteps }) => {
  // Array para los pasos basado en el total
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);
  
  // Textos para cada paso
  const stepLabels = ["Tipo", "Detalles", "Servicios", "Solicitante"];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step) => (
          <div key={step} className="flex flex-col items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step === currentStep 
                ? 'bg-black text-white' 
                : step < currentStep 
                  ? 'bg-black/20 text-black' 
                  : 'bg-gray-200 text-gray-500'
            }`}>
              {step < currentStep ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span>{step}</span>
              )}
            </div>
            <span className="mt-2 text-xs font-medium text-black">
              {stepLabels[step - 1] || `Paso ${step}`}
            </span>
          </div>
        ))}
      </div>
      
      {/* Progress Line */}
      <div className="relative mt-2">
        <div className="absolute top-0 h-1 w-full bg-gray-200 rounded"></div>
        <div 
          className="absolute top-0 h-1 bg-black rounded transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Stepper;