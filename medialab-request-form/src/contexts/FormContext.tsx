import React, { createContext, useContext, useState } from 'react';

// Definición básica del contexto
interface FormContextState {
  currentStep: number;
  nextStep: () => void;
  prevStep: () => void;
}

// Crear el contexto
const FormContext = createContext<FormContextState | undefined>(undefined);

// Proveedor del contexto
export const FormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Avanzar al siguiente paso
  const nextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  // Retroceder al paso anterior
  const prevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  return (
    <FormContext.Provider
      value={{
        currentStep,
        nextStep,
        prevStep,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useFormContext = () => {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};