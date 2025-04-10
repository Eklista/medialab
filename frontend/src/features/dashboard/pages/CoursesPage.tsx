// src/features/dashboard/pages/CoursesPage.tsx

import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ContentPlaceholder from '../components/placeholders/ContentPlaceholder';

const CoursesPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cursos</h1>
        <p className="text-gray-600">Gestiona los cursos y materiales educativos</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <ContentPlaceholder 
          title="Cursos"
          subtitle="Aquí podrás gestionar todos los cursos y contenidos educativos"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
            </svg>
          }
        />
      </div>
    </DashboardLayout>
  );
};

export default CoursesPage;