// src/components/ui/EmptyState.tsx
import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = ''
}) => {
  const defaultIcon = (
    <svg className="h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="mx-auto mb-4">
        {icon || defaultIcon}
      </div>
      
      <h3 className="text-lg font-medium text-(--color-text-main) dark:text-white mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-(--color-text-secondary) dark:text-gray-300 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  );
};