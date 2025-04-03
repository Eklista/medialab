// src/features/request-form/RequestFormPage.tsx
import { useState, useEffect } from 'react';
import { FormProvider, useFormContext } from '@/contexts/FormContext';
import { FormStepper, useFormStepper } from '@/components/form/FormStepper';
import { Step1ActivityType } from './components/Step1ActivityType';
import { UniqueActivityForm } from './components/Step2Details/UniqueActivity';
import { RecurringActivityForm } from './components/Step2Details/RecurringActivity';
import { PodcastForm } from './components/Step2Details/Podcast';
import { CourseForm } from './components/Step2Details/Course';
import { Step3Services } from './components/Step3Services';
import { Step4Requester } from './components/Step4Requester';
import { SuccessScreen } from './components/SuccessScreen';
import { Button } from '@/components/ui/Button';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const FORM_STEPS = [
  'Tipo de Actividad',
  'Detalles',
  'Servicios',
  'Solicitante',
];

export function RequestFormPageWrapper() {
  return (
    <FormProvider>
      <RequestFormPage />
    </FormProvider>
  );
}

function RequestFormPage() {
  const { formState } = useFormContext();
  const { currentStep, nextStep, prevStep, goToStep, isFirstStep, isLastStep } = useFormStepper(FORM_STEPS.length);
  const [showSuccess, setShowSuccess] = useState(false);

  // Render el componente correspondiente al paso actual
  const renderStep = () => {
    if (showSuccess) {
      return <SuccessScreen onReset={() => {
        setShowSuccess(false);
        goToStep(0);
      }} />;
    }

    switch (currentStep) {
      case 0:
        return <Step1ActivityType onNext={nextStep} />;
      case 1:
        // Renderizar el componente adecuado según el tipo de actividad seleccionada
        switch (formState.step1.activityType) {
          case 'unique':
            return <UniqueActivityForm onNext={nextStep} onBack={prevStep} />;
          case 'recurring':
            return <RecurringActivityForm onNext={nextStep} onBack={prevStep} />;
          case 'podcast':
            return <PodcastForm onNext={nextStep} onBack={prevStep} />;
          case 'course':
            return <CourseForm onNext={nextStep} onBack={prevStep} />;
          default:
            // Si no hay tipo seleccionado, volver al paso 1
            goToStep(0);
            return null;
        }
      case 2:
        return <Step3Services onNext={nextStep} onBack={prevStep} />;
      case 3:
        return <Step4Requester 
          onBack={prevStep}
          onSubmit={() => {
            // Aquí iría la lógica para enviar el formulario
            setShowSuccess(true);
          }}
        />;
      default:
        return null;
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-xl shadow-lg p-6 mb-8">
              <h1 className="text-3xl font-heading font-bold text-center mb-8 text-foreground">
                Solicitud de Servicios MediaLab
              </h1>
              
              {!showSuccess && (
                <FormStepper 
                  currentStep={currentStep}
                  steps={FORM_STEPS}
                  onStepChange={(step) => {
                    // Solo permitir navegar a pasos anteriores o al actual
                    if (step <= currentStep) {
                      goToStep(step);
                    }
                  }}
                />
              )}
              
              <div className="mt-8">
                {renderStep()}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}