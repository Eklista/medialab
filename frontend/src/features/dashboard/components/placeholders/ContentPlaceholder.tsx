// src/features/dashboard/components/placeholders/ContentPlaceholder.tsx

import React from 'react';

interface ContentPlaceholderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

const ContentPlaceholder: React.FC<ContentPlaceholderProps> = ({
  title,
  subtitle = 'Esta sección está en desarrollo',
  icon
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow-sm border border-gray-200 text-center h-64">
      {icon || (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )}
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-500">{subtitle}</p>
    </div>
  );
};

export default ContentPlaceholder;