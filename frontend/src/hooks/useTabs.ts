// src/hooks/useTabs.ts
import { useState } from 'react';

// Hook para manejar el estado de tabs
export const useTabs = (initialTab?: string) => {
  const [activeTab, setActiveTab] = useState(initialTab || '');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  return {
    activeTab,
    setActiveTab,
    handleTabChange
  };
};