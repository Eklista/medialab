// src/components/ui/ExploreDropdown.tsx - Mega menú con facultades y categorías
import React, { useState, useRef, useEffect } from 'react';
import { 
  Squares2X2Icon,
  UserGroupIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  AcademicCapIcon,
  ChevronDownIcon,
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

interface ExploreDropdownProps {
  onCategorySelect?: (facultadId: string, categoryId: string) => void;
  onFacultySelect?: (facultadId: string) => void;
  className?: string;
}

export const ExploreDropdown: React.FC<ExploreDropdownProps> = ({
  onCategorySelect,
  onFacultySelect,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredFaculty, setHoveredFaculty] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHoveredFaculty(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFacultyClick = (facultadId: string) => {
    onFacultySelect?.(facultadId);
    setIsOpen(false);
    setHoveredFaculty(null);
  };

  const handleCategoryClick = (facultadId: string, categoryId: string) => {
    onCategorySelect?.(facultadId, categoryId);
    setIsOpen(false);
    setHoveredFaculty(null);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
          ${isOpen 
            ? 'bg-gray-100 text-gray-900' 
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
          }
        `}
      >
        <Squares2X2Icon className="h-5 w-5" />
        <span>Explorar</span>
        <ChevronDownIcon 
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Mega Menu */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-2 w-screen max-w-5xl bg-white border border-gray-200 rounded-lg shadow-xl z-50"
          onMouseLeave={() => {
            setIsOpen(false);
            setHoveredFaculty(null);
          }}
        >
          <div className="flex">
            {/* Facultades Column */}
            <div className="w-2/5 border-r border-gray-200">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Facultades</h3>
                <p className="text-sm text-gray-600">Explora por facultad</p>
              </div>
              
              <div className="p-2 max-h-96 overflow-y-auto">
                {facultades.map((facultad) => (
                  <div
                    key={facultad.id}
                    className="relative"
                    onMouseEnter={() => setHoveredFaculty(facultad.id)}
                  >
                    <button
                      onClick={() => handleFacultyClick(facultad.id)}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left ${
                        hoveredFaculty === facultad.id
                          ? 'bg-gray-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`flex-shrink-0 mt-0.5 ${facultad.color}`}>
                        {facultad.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">
                          {facultad.name}
                        </div>
                        <div className="text-xs text-gray-600 line-clamp-2">
                          {facultad.fullName}
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Categorías Column */}
            <div className="w-3/5">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">
                  {hoveredFaculty 
                    ? `Contenido de ${facultades.find(f => f.id === hoveredFaculty)?.name}`
                    : 'Categorías de Contenido'
                  }
                </h3>
                <p className="text-sm text-gray-600">
                  {hoveredFaculty 
                    ? 'Selecciona el tipo de contenido'
                    : 'Pasa el cursor sobre una facultad'
                  }
                </p>
              </div>
              
              <div className="p-4">
                {hoveredFaculty ? (
                  <div className="grid grid-cols-2 gap-3">
                    {categorias.map((categoria) => (
                      <button
                        key={categoria.id}
                        onClick={() => handleCategoryClick(hoveredFaculty, categoria.id)}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex-shrink-0 mt-0.5 text-gray-600">
                          {categoria.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">
                            {categoria.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {categoria.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Squares2X2Icon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Selecciona una facultad para ver las categorías disponibles</p>
                  </div>
                )}
              </div>
              
              {/* Quick Links Footer */}
              <div className="border-t border-gray-100 p-4">
                <div className="flex gap-4 text-sm">
                  <button
                    onClick={() => {
                      console.log('Ver todo el contenido');
                      setIsOpen(false);
                    }}
                    className="text-gray-900 font-medium hover:text-gray-700 transition-colors"
                  >
                    Todo el contenido →
                  </button>
                  <button
                    onClick={() => {
                      console.log('Contenido más popular');
                      setIsOpen(false);
                    }}
                    className="text-gray-600 hover:text-gray-700 transition-colors"
                  >
                    Más popular
                  </button>
                  <button
                    onClick={() => {
                      console.log('Contenido reciente');
                      setIsOpen(false);
                    }}
                    className="text-gray-600 hover:text-gray-700 transition-colors"
                  >
                    Reciente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};