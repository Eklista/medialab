// src/features/service-request/activityDetails/CourseDetails.tsx
import React, { useState } from 'react';
import {
  CrudList,
  CrudItem,
  TimePicker,
  Select,
  MultiDayPicker
} from '../components';
import { departments } from '../data/faculties';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

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

const CourseDetails: React.FC = () => {
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

  // Campos adicionales para CrudList - con select para facultades
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
      type: 'select' as const, // Usar const assertion para el tipo correcto
      options: departments,
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
      required: false
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center mb-6">
        <AcademicCapIcon className="h-10 w-10 text-gray-700 mr-4" />
        <div>
          <h2 className="text-xl font-bold">Detalles de Cursos</h2>
          <p className="text-gray-600">
            Configure los cursos y sus fechas de grabación
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Sección de Cursos */}
        <CrudList<Course>
          title="Cursos"
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

      {/* Sección para agregar fechas de grabación */}
      {courses.length > 0 && (
        <div className="mt-8 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Fechas de Grabación</h3>
          
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
                          <span className="font-medium">Duración de clase:</span>{' '}
                          {courses.find(c => c.id === currentCourse)?.duration || 'No especificada'}
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