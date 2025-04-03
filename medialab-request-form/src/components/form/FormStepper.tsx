// src/components/form/FormStepper.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface FormStepperProps {
  currentStep: number;
  steps: string[];
  onStepChange?: (step: number) => void;
}

export function FormStepper({ currentStep, steps, onStepChange }: FormStepperProps) {
  return (
    <div className="w-full py-6">
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div key={index} className="relative flex flex-col items-center">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border",
                currentStep > index
                  ? "bg-primary text-primary-foreground border-primary"
                  : currentStep === index
                    ? "bg-card text-primary border-primary"
                    : "bg-muted text-muted-foreground border-border"
              )}
              onClick={() => {
                if (onStepChange && currentStep > index) {
                  onStepChange(index);
                }
              }}
            >
              {currentStep > index ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <div className="text-xs font-medium mt-2 text-center">{step}</div>
            
            {index < steps.length - 1 && (
              <div 
                className={cn(
                  "absolute top-5 w-full h-0.5 left-1/2",
                  currentStep > index ? "bg-primary" : "bg-border"
                )}
                style={{ width: 'calc(100% - 2.5rem)' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Hook personalizado para gestionar la lógica del stepper
export function useFormStepper(totalSteps: number) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
      return true;
    }
    return false;
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
      return true;
    }
    return false;
  };
  
  const goToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
      window.scrollTo(0, 0);
      return true;
    }
    return false;
  };
  
  return {
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === totalSteps - 1,
  };
}