import React from 'react';
import RadioButtonOption from './components/RadioButtonOption';

// Tipos de actividades disponibles
export type ActivityType = 'single' | 'recurrent' | 'podcast' | 'course';

interface ActivityTypeStepProps {
  selectedActivity: ActivityType | null;
  onActivitySelect: (activity: ActivityType) => void;
}

const ActivityTypeStep: React.FC<ActivityTypeStepProps> = ({
  selectedActivity,
  onActivitySelect
}) => {
  // Opciones de actividades con iconos
  const activityOptions = [
    {
      id: 'single',
      label: 'Actividad Única',
      value: 'single',
      description: 'Evento único programado para una fecha y hora específica.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'recurrent',
      label: 'Actividad Recurrente',
      value: 'recurrent',
      description: 'Actividad que ocurre de forma periódica según un patrón definido',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    },
    {
      id: 'podcast',
      label: 'Podcast',
      value: 'podcast',
      description: 'Producción de contenido en formato de podcast, con episodios, moderadores y grabaciones planificadas.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )
    },
    {
      id: 'course',
      label: 'Cursos',
      value: 'course',
      description: 'Grabaciones académicas organizadas por cursos y clases dentro de una carrera universitaria.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 14l9-5-9-5-9 5 9 5z" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
        </svg>
      )
    }
  ];

  return (
    <div className="space-y-5">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-black mb-2">Paso 1: Tipo de Actividad</h2>
        <div className="h-1 w-32 bg-black rounded-full mb-4"></div>
        <p className="text-base text-(--color-text-secondary)">
          Seleccione el tipo de actividad para la cual necesita nuestros servicios
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {activityOptions.map((option) => (
          <RadioButtonOption
            key={option.id}
            id={option.id}
            label={option.label}
            value={option.value}
            name="activityType"
            description={option.description}
            icon={option.icon}
            checked={selectedActivity === option.value}
            onChange={(value) => onActivitySelect(value as ActivityType)}
          />
        ))}
      </div>
    </div>
  );
};

export default ActivityTypeStep;