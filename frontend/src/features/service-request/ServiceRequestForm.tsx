// src/features/service-request/ServiceRequestForm.tsx
import React, { useState } from 'react';
import ActivityTypeStep, { ActivityType } from './ActivityTypeStep';
import { ActivityDetailsStep } from './PlaceholderSteps';
import Step3Services from './Step3Services';
import Step4ActivityRequester, { RequesterData } from './Step4ActivityRequester';
import Stepper from './components/Stepper';
import { Button } from './components';
import { mainServices } from './data/services';
import { departments } from './data/faculties';
import { CheckIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const ServiceRequestForm: React.FC = () => {
  // Estado para controlar el paso actual
  const [currentStep, setCurrentStep] = useState(1);
 
  // Estado para almacenar el tipo de actividad seleccionada
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);
  
  // Estado para servicios principales y subservicios
  const [selectedMainServices, setSelectedMainServices] = useState<string[]>([]);
  const [selectedSubServices, setSelectedSubServices] = useState<Record<string, string[]>>({});
  
  // Estado para datos del solicitante
  const [requesterData, setRequesterData] = useState<RequesterData>({
    name: '',
    department: '',
    email: '',
    phone: '',
    requestDate: new Date(),
    additionalNotes: ''
  });
  
  // Estado para errores de validación
  const [formErrors, setFormErrors] = useState<Record<string, Record<string, string>>>({
    step3: {},
    step4: {}
  });
  
  // Estado para indicar si el formulario se está enviando
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Función para avanzar al siguiente paso
  const handleNextStep = () => {
    if (currentStep === 3) {
      // Validar el paso 3 antes de avanzar
      if (!validateStep3()) return;
    }
    
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
  
  // Función para manejar cambio en servicios principales
  const handleMainServiceChange = (serviceIds: string[]) => {
    setSelectedMainServices(serviceIds);
    
    // Eliminar subservicios para servicios principales que ya no están seleccionados
    const updatedSubServices: Record<string, string[]> = {};
    Object.keys(selectedSubServices).forEach(mainServiceId => {
      if (serviceIds.includes(mainServiceId)) {
        updatedSubServices[mainServiceId] = selectedSubServices[mainServiceId];
      }
    });
    setSelectedSubServices(updatedSubServices);
  };
  
  // Función para manejar cambio en subservicios
  const handleSubServiceChange = (mainServiceId: string, subServiceIds: string[]) => {
    setSelectedSubServices(prev => ({
      ...prev,
      [mainServiceId]: subServiceIds
    }));
  };
  
  // Función para manejar cambios en los datos del solicitante
  const handleRequesterDataChange = (data: Partial<RequesterData>) => {
    setRequesterData(prev => ({
      ...prev,
      ...data
    }));
  };
  
  // Validar el paso 3 (servicios)
  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Verificar que al menos un servicio principal esté seleccionado
    if (selectedMainServices.length === 0) {
      newErrors.mainServices = 'Debe seleccionar al menos un servicio principal';
    }
    
    // Verificar que cada servicio principal tenga al menos un subservicio seleccionado
    selectedMainServices.forEach(mainServiceId => {
      if (!selectedSubServices[mainServiceId] || selectedSubServices[mainServiceId].length === 0) {
        newErrors[`subServices_${mainServiceId}`] = 'Debe seleccionar al menos un subservicio';
      }
    });
    
    setFormErrors(prev => ({
      ...prev,
      step3: newErrors
    }));
    
    return Object.keys(newErrors).length === 0;
  };
  
  // Validar el paso 4 (datos del solicitante)
  const validateStep4 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validar nombre
    if (!requesterData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }
    
    // Validar departamento/facultad
    if (!requesterData.department) {
      newErrors.department = 'Debe seleccionar un departamento o facultad';
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!requesterData.email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!emailRegex.test(requesterData.email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }
    
    // Validar teléfono (opcional pero si se proporciona debe ser válido)
    if (requesterData.phone && !/^\d{7,10}$/.test(requesterData.phone)) {
      newErrors.phone = 'El número de teléfono debe tener entre 7 y 10 dígitos';
    }
    
    // Validar fecha de solicitud
    if (!requesterData.requestDate) {
      newErrors.requestDate = 'La fecha de solicitud es obligatoria';
    }
    
    setFormErrors(prev => ({
      ...prev,
      step4: newErrors
    }));
    
    return Object.keys(newErrors).length === 0;
  };
  
  // Función para manejar el envío del formulario
  const handleSubmit = () => {
    // Validar el último paso
    if (!validateStep4()) return;
    
    setIsSubmitting(true);
    
    // Simulamos una petición API
    setTimeout(() => {
      // Aquí iría la lógica para enviar los datos al servidor
      console.log('Formulario enviado:', {
        activityType: selectedActivity,
        mainServices: selectedMainServices,
        subServices: selectedSubServices,
        requesterData
      });
      
      // Finalizar el estado de envío
      setIsSubmitting(false);
      
      // Aquí podrías redirigir a una página de confirmación o mostrar un mensaje
      alert('Solicitud enviada correctamente');
    }, 1500);
  };
  
  // Determinar si el botón de siguiente paso debe estar deshabilitado
  const isNextButtonDisabled = () => {
    // En el paso 1, se necesita seleccionar un tipo de actividad
    if (currentStep === 1) {
      return !selectedActivity;
    }
    
    // En el paso 3, verificar servicios seleccionados
    if (currentStep === 3) {
      return selectedMainServices.length === 0;
    }
    
    // Para los otros pasos, no tenemos validaciones específicas por ahora
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
        return (
          <Step3Services
            mainServices={mainServices}
            selectedMainServices={selectedMainServices}
            selectedSubServices={selectedSubServices}
            onMainServiceChange={handleMainServiceChange}
            onSubServiceChange={handleSubServiceChange}
          />
        );
      case 4:
        return (
          <Step4ActivityRequester
            requesterData={requesterData}
            onRequesterDataChange={handleRequesterDataChange}
            departments={departments}
            errors={formErrors.step4}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      {/* Progress Indicator */}
      <Stepper currentStep={currentStep} totalSteps={4} />
      
      {/* Form Content */}
      <div className="my-8">
        {renderStepContent()}
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8 border-t pt-6">
        <Button
          variant="outline"
          onClick={handlePrevStep}
          disabled={currentStep === 1 || isSubmitting}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
        >
          Anterior
        </Button>
        
        {currentStep < 4 ? (
          <Button
            onClick={handleNextStep}
            disabled={isNextButtonDisabled()}
            rightIcon={<ArrowRightIcon className="h-5 w-5" />}
          >
            Siguiente
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            loading={isSubmitting}
            leftIcon={<CheckIcon className="h-5 w-5" />}
          >
            Enviar Solicitud
          </Button>
        )}
      </div>
    </div>
  );
};

export default ServiceRequestForm;