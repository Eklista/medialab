// src/features/service-request/ActivityDetailsStep.tsx
import React from 'react';
import { ActivityType } from './ActivityTypeStep';
import SingleActivityDetails from './activityDetails/SingleActivityDetails';
import RecurrentActivityDetails from './activityDetails/RecurrentActivityDetails';
import PodcastDetails from './activityDetails/PodcastDetails';
import CourseDetails from './activityDetails/CourseDetails';

interface ActivityDetailsStepProps {
  activityType: ActivityType;
}

const ActivityDetailsStep: React.FC<ActivityDetailsStepProps> = ({ activityType }) => {
  // Determinamos el título basado en el tipo de actividad
  const getActivityTypeTitle = () => {
    switch (activityType) {
      case 'single':
        return 'Actividad Única';
      case 'recurrent':
        return 'Actividad Recurrente';
      case 'podcast':
        return 'Podcast';
      case 'course':
        return 'Cursos';
      default:
        return 'Actividad';
    }
  };

  // Renderizar el componente específico según el tipo de actividad
  const renderActivityComponent = () => {
    switch (activityType) {
      case 'single':
        return <SingleActivityDetails />;
      case 'recurrent':
        return <RecurrentActivityDetails />;
      case 'podcast':
        return <PodcastDetails />;
      case 'course':
        return <CourseDetails />;
      default:
        return <div>Tipo de actividad no reconocido</div>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Título y descripción estandarizados */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-black mb-2">Paso 2: Detalles de la Actividad</h2>
        <div className="h-1 w-32 bg-black rounded-full mb-4"></div>
        <p className="text-base text-gray-600">
          Complete la información detallada sobre su {getActivityTypeTitle().toLowerCase()}
        </p>
      </div>

      {/* Componente específico para el tipo de actividad */}
      {renderActivityComponent()}
    </div>
  );
};

export default ActivityDetailsStep;