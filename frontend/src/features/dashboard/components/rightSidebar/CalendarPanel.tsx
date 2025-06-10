// src/features/dashboard/components/rightSidebar/CalendarPanel.tsx

import React from 'react';
import Calendar from '../ui/Calendar';
import { PanelProps } from './shared/types';

interface CalendarPanelProps extends PanelProps {
  // Props adicionales si necesitas
}

const CalendarPanel: React.FC<CalendarPanelProps> = ({ 
  className = ''
}) => {
  return (
    <div className={`h-full ${className}`}>
      <Calendar view="mobile" />
    </div>
  );
};

export default CalendarPanel;