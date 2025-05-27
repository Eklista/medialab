// src/components/sections/ContentTabsSection.tsx
import React from 'react';
import { Tabs, Tab, useTabs } from '../ui/Tabs';
import { CardSlider } from '../ui/CardSlider';
import { Button } from '../ui/Button';
import { 
  AcademicCapIcon, 
  UserGroupIcon, 
  VideoCameraIcon, 
  PhotoIcon 
} from '@heroicons/react/24/outline';

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  duration?: string;
  views?: number;
  category: string;
  faculty?: string;
  publishedAt: string;
}

interface ContentTabsSectionProps {
  graduaciones: ContentItem[];
  conferencias: ContentItem[];
  reportajes: ContentItem[];
  fotografias: ContentItem[];
  onItemClick?: (item: ContentItem) => void;
  onViewAllClick?: (category: string) => void;
  className?: string;
}

export const ContentTabsSection: React.FC<ContentTabsSectionProps> = ({
  graduaciones,
  conferencias,
  reportajes,
  fotografias,
  onItemClick,
  onViewAllClick,
  className = ''
}) => {
  const { activeTab, handleTabChange } = useTabs('graduaciones');

  const tabs: Tab[] = [
    {
      id: 'graduaciones',
      label: 'Graduaciones',
      count: graduaciones.length,
      icon: <AcademicCapIcon className="h-5 w-5" />
    },
    {
      id: 'conferencias',
      label: 'Conferencias',
      count: conferencias.length,
      icon: <UserGroupIcon className="h-5 w-5" />
    },
    {
      id: 'reportajes',
      label: 'Reportajes',
      count: reportajes.length,
      icon: <VideoCameraIcon className="h-5 w-5" />
    },
    {
      id: 'fotografias',
      label: 'Fotografías',
      count: fotografias.length,
      icon: <PhotoIcon className="h-5 w-5" />
    }
  ];

  const getContentForTab = (tabId: string): ContentItem[] => {
    switch (tabId) {
      case 'graduaciones':
        return graduaciones;
      case 'conferencias':
        return conferencias;
      case 'reportajes':
        return reportajes;
      case 'fotografias':
        return fotografias;
      default:
        return [];
    }
  };

  const getTabLabel = (tabId: string): string => {
    const tab = tabs.find(t => t.id === tabId);
    return tab?.label || '';
  };

  const currentContent = getContentForTab(activeTab);

  return (
    <section className={`py-16 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Explora Nuestro Contenido
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubre videos, fotografías y eventos organizados por categoría para una mejor experiencia de navegación.
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            variant="underline"
            size="lg"
            className="flex justify-center"
          />
        </div>

        {/* Content Slider */}
        <div className="mb-8">
          <CardSlider
            title=""
            items={currentContent}
            onItemClick={onItemClick}
          />
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => onViewAllClick?.(activeTab)}
            className="px-8 py-3 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-semibold"
          >
            Ver todas las {getTabLabel(activeTab).toLowerCase()}
          </Button>
        </div>
      </div>
    </section>
  );
};