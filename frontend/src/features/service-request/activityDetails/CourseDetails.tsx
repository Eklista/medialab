// src/features/service-request/activityDetails/CourseDetails.tsx
import React, { useState, useEffect } from 'react';
import {
  CrudList,
  CrudItem,
  TimePicker,
  Select,
  MultiDayPicker,
  Checkbox,
  TextInput,
  Textarea,
  RadioButtonOption,
  SelectOption
} from '../components';
import { departments } from '../data/faculties';
import { publicService } from '../../../services';
import { PublicDepartment } from '../../../services/system/public.service';
import { AcademicCapIcon, BuildingOfficeIcon, MapPinIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import CourseRecurrenceSettings, { RecurrenceData } from './components/CourseRecurrenceSettings';

// Interface para el modelo de curso
interface Course extends CrudItem {
  name: string;
  professor: string;
  faculty: string;
  duration: string;
  recordingDates: Date[];
  recordingTime: Date | null;
  description: string;
}

// Location type options
const locationTypeOptions = [
  { 
    id: 'university', 
    value: 'university', 
    label: 'Universidad',
    icon: <BuildingOfficeIcon className="h-6 w-6" />
  },
  { 
    id: 'external', 
    value: 'external', 
    label: 'Ubicación externa',
    icon: <MapPinIcon className="h-6 w-6" />
  },
  { 
    id: 'virtual', 
    value: 'virtual', 
    label: 'Virtual',
    icon: <GlobeAltIcon className="h-6 w-6" />
  }
];

const CourseDetails: React.FC = () => {
  // Estados básicos para los cursos
  const [careerName, setCareerName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [mainFaculty, setMainFaculty] = useState('');

  // Estado para los departamentos cargados desde la API
  const [departmentsFromDB, setDepartmentsFromDB] = useState<SelectOption[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);
  
  // useEffect para cargar departamentos
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setIsLoadingDepartments(true);
        const departments = await publicService.getPublicDepartments();
        const formattedDepartments = departments.map((dept: PublicDepartment) => ({
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

  // Estados para la ubicación
  const [locationType, setLocationType] = useState('');
  const [tower, setTower] = useState('');
  const [classroom, setClassroom] = useState('');
  const [externalAddress, setExternalAddress] = useState('');

  // Estado para recurrencia
  const [recurrenceData, setRecurrenceData] = useState<RecurrenceData>({
    isRecurrent: false,
    startDate: null,
    endDate: null,
    startTime: null,
    endTime: null,
    recurrenceType: 'daily',
    selectedWeekDays: [],
    weekOfMonth: '',
    dayOfMonth: '',
    selectedDates: []
  });

  // Estado para los cursos
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentCourse, setCurrentCourse] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  // Gestión de cursos
  const handleAddCourse = (course: Omit<Course, 'id'>) => {
    const newCourse: Course = {
      ...course,
      id: `course-${Date.now()}`,
      recordingDates: course.recordingDates || [],
      recordingTime: course.recordingTime || null,
      // Garantizar que todos los campos requeridos estén presentes
      name: course.name || '',
      professor: course.professor || '',
      faculty: course.faculty || '',
      duration: course.duration || '',
      description: course.description || ''
    };
    setCourses([...courses, newCourse]);
  };

  const handleUpdateCourse = (id: string, course: Partial<Course>) => {
    setCourses(
      courses.map(c => (c.id === id ? { ...c, ...course } : c))
    );
  };

  const handleDeleteCourse = (id: string) => {
    setCourses(courses.filter(c => c.id !== id));
    if (currentCourse === id) {
      setCurrentCourse(null);
      setSelectedDates([]);
    }
  };

  // Manejo de fechas de grabación
  const handleDateSelection = (dates: Date[]) => {
    if (!currentCourse) return;
    
    // Actualizar el estado temporal
    setSelectedDates(dates);
    
    // Actualizar el curso
    handleUpdateCourse(currentCourse, { recordingDates: dates });
  };

  // Actualizar datos de recurrencia
  const handleRecurrenceChange = (data: Partial<RecurrenceData>) => {
    setRecurrenceData(prev => ({ ...prev, ...data }));
  };

  // Handle location type change
  const handleLocationTypeChange = (value: string) => {
    setLocationType(value);
  };

  // Campos adicionales para CrudList
  const courseFields = [
    {
      name: 'professor',
      label: 'Catedrático',
      placeholder: 'Nombre del catedrático',
      required: true
    },
    {
      name: 'faculty',
      label: 'Facultad/Departamento',
      type: 'select' as const, 
      options: departmentsFromDB.length > 0 ? departmentsFromDB : departments,
      required: true
    },
    {
      name: 'duration',
      label: 'Duración de la clase',
      placeholder: 'Ej: 1:30 horas',
      required: true
    },
    {
      name: 'description',
      label: 'Descripción',
      placeholder: 'Breve descripción del curso',
      required: false,
      type: 'textarea' as const
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center mb-6">
        <AcademicCapIcon className="h-10 w-10 text-gray-700 mr-4" />
        <div>
          <h2 className="text-xl font-bold">Detalles de Cursos</h2>
          <p className="text-gray-600">
            Configure la información general, fechas y detalles para su carrera
          </p>
        </div>
      </div>

      {/* Mensaje de error si no se pueden cargar los departamentos */}
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

      {/* Información básica del curso */}
      <div className="mb-6">
        {/* Nombre y Facultad (primera fila) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <TextInput
            id="career-name"
            name="career-name"
            label="Nombre de carrera"
            value={careerName}
            onChange={(e) => setCareerName(e.target.value)}
            placeholder="Ej. Ingeniería en Sistemas"
            required
          />
          
          {isLoadingDepartments ? (
            <div className="flex flex-col space-y-2">
              <label className="block text-sm font-medium text-black mb-1">
                Facultad principal<span className="text-red-500 ml-1">*</span>
              </label>
              <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
            </div>
          ) : (
            <Select
              id="career-faculty"
              name="career-faculty"
              label="Facultad principal"
              value={mainFaculty}
              onChange={(e) => setMainFaculty(e.target.value)}
              options={departmentsFromDB.length > 0 ? departmentsFromDB : departments}
              placeholder="Seleccione la facultad responsable"
              required
            />
          )}
        </div>
        
        {/* Descripción (ancho completo) */}
        <div className="mb-4">
          <Textarea
            id="career-description"
            name="career-description"
            label="Descripción general"
            value={courseDescription}
            onChange={(e) => setCourseDescription(e.target.value)}
            placeholder="Describe brevemente de qué trata esta carrera"
            rows={3}
            maxLength={500}
            showCharCount
          />
        </div>
      </div>

      {/* Sección de Agenda y Recurrencia */}
      <div className="border-t border-gray-200 pt-6 mb-6">
        <h3 className="text-lg font-medium mb-4">Fechas de Clases</h3>
        
        <div className="mb-4">
          <Checkbox
            id="is-recurrent"
            name="is-recurrent"
            label="Clases recurrentes"
            checked={recurrenceData.isRecurrent}
            onChange={(e) => handleRecurrenceChange({ isRecurrent: e.target.checked })}
            helperText="Active esta opción si las clases se impartirán en múltiples ocasiones con un patrón regular"
          />
        </div>
        
        <CourseRecurrenceSettings 
          recurrenceData={recurrenceData}
          onRecurrenceChange={handleRecurrenceChange}
        />
      </div>

      {/* Sección de Ubicación */}
      <div className="border-t border-gray-200 pt-6 mb-6">
        <h3 className="text-lg font-medium mb-4">Ubicación</h3>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-black mb-2">
            Tipo de ubicación<span className="text-red-500 ml-1">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {locationTypeOptions.map(option => (
              <RadioButtonOption
                key={option.id}
                id={`course-location-type-${option.id}`}
                name="course-location-type"
                label={option.label}
                value={option.value}
                checked={locationType === option.value}
                onChange={handleLocationTypeChange}
                icon={option.icon}
              />
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-black mb-2">
            Detalles de ubicación<span className="text-red-500 ml-1">*</span>
          </label>
          
          {locationType === 'university' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextInput
                id="course-tower"
                name="course-tower"
                label="Torre"
                value={tower}
                onChange={(e) => setTower(e.target.value)}
                placeholder="Ej. Torre A"
                required
              />
              <TextInput
                id="course-classroom"
                name="course-classroom"
                label="Salón"
                value={classroom}
                onChange={(e) => setClassroom(e.target.value)}
                placeholder="Ej. 101"
                required
              />
            </div>
          )}
          
          {locationType === 'external' && (
            <TextInput
              id="course-external-address"
              name="course-external-address"
              label="Dirección"
              value={externalAddress}
              onChange={(e) => setExternalAddress(e.target.value)}
              placeholder="Ingrese la dirección completa"
              required
            />
          )}
          
          {locationType === 'virtual' && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600">Los enlaces de la producción serán enviados por MediaLab.</p>
            </div>
          )}
          
          {!locationType && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600">Seleccione un tipo de ubicación primero.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sección de cursos */}
      <div className="border-t border-gray-200 pt-6 mb-6">
        <div className="grid grid-cols-1 gap-8">
          {/* Sección de Cursos */}
          <CrudList<Course>
            title="Cursos y Clases"
            items={courses}
            onAddItem={handleAddCourse}
            onUpdateItem={handleUpdateCourse}
            onDeleteItem={handleDeleteCourse}
            addButtonText="Agregar Curso"
            emptyMessage="No hay cursos registrados"
            additionalFields={courseFields}
            validateInput={(value) => value ? null : 'El nombre es obligatorio'}
          />
        </div>
      </div>

      {/* Sección para agregar fechas de grabación */}
      {courses.length > 0 && (
        <div className="mt-8 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Fechas de Grabación por Curso</h3>
          
          <div className="mb-4">
            <Select
              id="courseSelector"
              name="courseSelector"
              label="Seleccione un curso para gestionar fechas de grabación"
              value={currentCourse || ''}
              onChange={(e) => {
                const courseId = e.target.value;
                setCurrentCourse(courseId);
                
                // Cargar las fechas existentes si hay
                if (courseId) {
                  const course = courses.find(c => c.id === courseId);
                  if (course) {
                    setSelectedDates(course.recordingDates || []);
                  } else {
                    setSelectedDates([]);
                  }
                } else {
                  setSelectedDates([]);
                }
              }}
              options={[
                { value: '', label: 'Seleccione un curso', disabled: true },
                ...courses.map(course => ({ value: course.id, label: course.name }))
              ]}
            />
          </div>
          
          {currentCourse && (
            <div className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <MultiDayPicker
                    id="recordingDates"
                    name="recordingDates"
                    label="Fechas de grabación"
                    selectedDates={selectedDates}
                    onChange={handleDateSelection}
                    required
                  />
                </div>
                
                <div>
                  <TimePicker
                    id="recordingTime"
                    name="recordingTime"
                    label="Hora habitual de grabación"
                    selectedTime={courses.find(c => c.id === currentCourse)?.recordingTime || null}
                    onChange={(time) => {
                      if (currentCourse) {
                        handleUpdateCourse(currentCourse, { recordingTime: time });
                      }
                    }}
                    required
                  />
                  
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Información del curso seleccionado:</h4>
                    {currentCourse && (
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Catedrático:</span>{' '}
                          {courses.find(c => c.id === currentCourse)?.professor || 'No especificado'}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Facultad:</span>{' '}
                          {departments.find(d => d.value === courses.find(c => c.id === currentCourse)?.faculty)?.label || 'No especificada'}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Facultad:</span>{' '}
                          {departments.find(d => d.value === courses.find(c => c.id === currentCourse)?.faculty)?.label || 'No especificada'}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Fechas programadas:</span>{' '}
                          {selectedDates.length} {selectedDates.length === 1 ? 'fecha' : 'fechas'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseDetails;