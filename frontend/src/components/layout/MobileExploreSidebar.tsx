// src/components/layout/MobileExploreSidebar.tsx
import React, { useState } from 'react';
import { 
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  UserGroupIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  AcademicCapIcon,
  PhotoIcon,
  StarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const facultades = [
  {
    id: 'fisicc',
    name: 'FISICC',
    fullName: 'Facultad de Ingeniería de Sistemas, Informática y Ciencias de la Computación',
    icon: <BuildingOfficeIcon className="h-5 w-5" />,
    color: 'text-blue-600'
  },
  {
    id: 'facimed',
    name: 'FACIMED',
    fullName: 'Facultad de Ciencias de la Salud',
    icon: <BuildingOfficeIcon className="h-5 w-5" />,
    color: 'text-red-600'
  },
  {
    id: 'idea',
    name: 'IDEA',
    fullName: 'Instituto de Educación Abierta',
    icon: <BuildingOfficeIcon className="h-5 w-5" />,
    color: 'text-green-600'
  },
  {
    id: 'facom',
    name: 'FACOM',
    fullName: 'Facultad de Comunicación',
    icon: <BuildingOfficeIcon className="h-5 w-5" />,
    color: 'text-purple-600'
  },
  {
    id: 'fcea',
    name: 'FCEA',
    fullName: 'Facultad de Ciencias Económicas y Administrativas',
    icon: <BuildingOfficeIcon className="h-5 w-5" />,
    color: 'text-orange-600'
  },
  {
    id: 'face',
    name: 'FACE',
    fullName: 'Facultad de Ciencias de la Educación',
    icon: <BuildingOfficeIcon className="h-5 w-5" />,
    color: 'text-indigo-600'
  },
  {
    id: 'facti',
    name: 'FACTI',
    fullName: 'Facultad de Ciencias, Tecnología e Industria',
    icon: <BuildingOfficeIcon className="h-5 w-5" />,
    color: 'text-teal-600'
  },
  {
    id: 'medialab',
    name: 'MediaLab',
    fullName: 'Laboratorio de Multimedia',
    icon: <VideoCameraIcon className="h-5 w-5" />,
    color: 'text-yellow-600'
  }
];

const categorias = [
  {
    id: 'conferencias',
    name: 'Conferencias',
    icon: <UserGroupIcon className="h-4 w-4" />,
    description: 'Eventos académicos'
  },
  {
    id: 'reportajes',
    name: 'Reportajes',
    icon: <VideoCameraIcon className="h-4 w-4" />,
    description: 'Documentales'
  },
  {
    id: 'graduaciones',
    name: 'Graduaciones',
    icon: <AcademicCapIcon className="h-4 w-4" />,
    description: 'Ceremonias'
  },
  {
    id: 'podcasts',
    name: 'Podcasts',
    icon: <MicrophoneIcon className="h-4 w-4" />,
    description: 'Audio y radio'
  },
  {
    id: 'galerias',
    name: 'Galerías',
    icon: <PhotoIcon className="h-4 w-4" />,
    description: 'Fotos y eventos'
  },
  {
    id: 'destacados',
    name: 'Destacados',
    icon: <StarIcon className="h-4 w-4" />,
    description: 'Contenido especial'
  }
];

interface MobileExploreSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySelect?: (facultadId: string, categoryId: string) => void;
  onFacultySelect?: (facultadId: string) => void;
}

export const MobileExploreSidebar: React.FC<MobileExploreSidebarProps> = ({
  isOpen,
  onClose,
  onCategorySelect,
  onFacultySelect
}) => {
  const [expandedFaculties, setExpandedFaculties] = useState<Set<string>>(new Set());

  const toggleFaculty = (facultyId: string) => {
    const newExpanded = new Set(expandedFaculties);
    if (newExpanded.has(facultyId)) {
      newExpanded.delete(facultyId);
    } else {
      newExpanded.add(facultyId);
    }
    setExpandedFaculties(newExpanded);
  };

  const handleFacultyClick = (facultadId: string) => {
    onFacultySelect?.(facultadId);
    onClose();
  };

  const handleCategoryClick = (facultadId: string, categoryId: string) => {
    onCategorySelect?.(facultadId, categoryId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 lg:hidden transform transition-transform duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Explorar MediaLab</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Quick Actions */}
          <div className="p-4 border-b border-gray-100">
            <div className="space-y-2">
              <button
                onClick={() => {
                  console.log('Todo el contenido');
                  onClose();
                }}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Todo el contenido</div>
                <div className="text-sm text-gray-600">Ver todas las categorías</div>
              </button>
              
              <button
                onClick={() => {
                  console.log('Más popular');
                  onClose();
                }}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Más popular</div>
                <div className="text-sm text-gray-600">Contenido destacado</div>
              </button>

              <button
                onClick={() => {
                  console.log('Reciente');
                  onClose();
                }}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Reciente</div>
                <div className="text-sm text-gray-600">Últimas publicaciones</div>
              </button>
            </div>
          </div>

          {/* Facultades con submenús */}
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
              Por Facultad
            </h3>
            
            <div className="space-y-1">
              {facultades.map((facultad) => (
                <div key={facultad.id}>
                  {/* Facultad Header */}
                  <button
                    onClick={() => toggleFaculty(facultad.id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 ${facultad.color}`}>
                        {facultad.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm">
                          {facultad.name}
                        </div>
                        <div className="text-xs text-gray-600 line-clamp-1">
                          {facultad.fullName}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Botón directo a facultad */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFacultyClick(facultad.id);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title={`Ver todo ${facultad.name}`}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                      
                      {/* Chevron */}
                      {expandedFaculties.has(facultad.id) ? (
                        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Categorías (Submenu) */}
                  {expandedFaculties.has(facultad.id) && (
                    <div className="ml-6 mt-1 space-y-1 animate-slide-down">
                      {categorias.map((categoria) => (
                        <button
                          key={categoria.id}
                          onClick={() => handleCategoryClick(facultad.id, categoria.id)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex-shrink-0 text-gray-500">
                            {categoria.icon}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {categoria.name}
                            </div>
                            <div className="text-xs text-gray-600">
                              {categoria.description}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Categorías generales */}
          <div className="p-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
              Por Categoría
            </h3>
            
            <div className="space-y-1">
              {categorias.map((categoria) => (
                <button
                  key={categoria.id}
                  onClick={() => {
                    console.log('Categoría general:', categoria.id);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-shrink-0 text-gray-600">
                    {categoria.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {categoria.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {categoria.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};