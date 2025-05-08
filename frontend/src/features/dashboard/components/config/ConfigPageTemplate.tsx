// src/features/dashboard/components/config/ConfigPageTemplate.tsx
import React, { ReactNode } from 'react';
import ConfigPageHeader from './ConfigPageHeader';
import DashboardCard from '../ui/DashboardCard';

interface ConfigPageTemplateProps {
  title: string;
  actionButton?: ReactNode;
  tabs?: {
    id: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
  }[];
  children: ReactNode;
  error?: ReactNode;
}

const ConfigPageTemplate: React.FC<ConfigPageTemplateProps> = ({
  title,
  actionButton,
  tabs,
  children,
  error
}) => {
  return (
    <div className="h-full flex flex-col">
      <ConfigPageHeader 
        title={title}
        actionButton={actionButton}
        tabs={tabs}
      />
      
      <div className="px-4 pb-4 flex-grow">
        {error}
        
        <DashboardCard className="h-full">
          {children}
        </DashboardCard>
      </div>
    </div>
  );
};

export default ConfigPageTemplate;