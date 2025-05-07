// src/features/service-request/ServiceRequestForm.tsx
import React, { useState, useEffect } from 'react';
import ActivityTypeStep, { ActivityType } from './ActivityTypeStep';
import ActivityDetailsStep from './ActivityDetailsStep';
import Step3Services from './Step3Services';
import Step4ActivityRequester, { RequesterData } from './Step4ActivityRequester';
import Stepper from './components/Stepper';
import { Button } from './components';
import { mainServices } from './data/services';
import { departments } from './data/faculties';
import { publicService } from '../../services';
import { SelectOption } from './components';
import { CheckIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const ServiceRequestForm: React.FC = () => {
  // Estado para controlar el paso actual
  const [currentStep, setCurrentStep] = useState(1);
 
  // Estado para almacenar el tipo de actividad seleccionada
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);
  
  // Estado para unidades académicas y departamentos
  const [departmentsFromDB, setDepartmentsFromDB] = useState<SelectOption[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);

  // Estado para servicios principales y subservicios
  const [selectedMainServices, setSelectedMainServices] = useState<string[]>([]);
  const [selectedSubServices, setSelectedSubServices] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setIsLoadingDepartments(true);
        const departments = await publicService.getPublicDepartments();
        const formattedDepartments = departments.map(dept => ({
          value: dept.id.toString(),
          label: dept.abbreviation
        }));
        setDepartmentsFromDB(formattedDepartments);
        setDepartmentsError(null);
      } catch (error) {
        console.error('Error al cargar departamentos:', error);
        setDepartmentsError('No se pudieron cargar los departamentos.');
      } finally {
        setIsLoadingDepartments(false);
      }
    };
    
    fetchDepartments();
  }, []);

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
          <>
            {departmentsError && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">{departmentsError}</p>
                  </div>
                </div>
              </div>
            )}
            
            <Step4ActivityRequester
              requesterData={requesterData}
              onRequesterDataChange={handleRequesterDataChange}
              departments={departmentsFromDB.length > 0 ? departmentsFromDB : departments}
              errors={formErrors.step4}
              isLoadingDepartments={isLoadingDepartments}
            />
          </>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
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