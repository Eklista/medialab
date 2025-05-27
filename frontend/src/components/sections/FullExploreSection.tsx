// src/components/sections/FullExploreSection.tsx - Versión compacta para muchas facultades
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { 
  MagnifyingGlassIcon, 
  ChevronRightIcon,
  AcademicCapIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

// Tipos
interface Faculty {
  id: string;
  name: string;
  fullName: string;
}

interface FacultiesByArea {
  [key: string]: Faculty[];
}

// Datos de facultades organizados por área (simulando 25+ facultades)
const facultadesByArea: FacultiesByArea = {
  'Ingeniería y Tecnología': [
    { id: 'fisicc', name: 'FISICC', fullName: 'Facultad de Ingeniería de Sistemas, Informática y Ciencias de la Computación' },
    { id: 'facti', name: 'FACTI', fullName: 'Facultad de Ciencias, Tecnología e Industria' },
    { id: 'arquitectura', name: 'FIARQ', fullName: 'Facultad de Arquitectura' },
    { id: 'ingenieria', name: 'FI', fullName: 'Facultad de Ingeniería' },
    { id: 'biologia', name: 'FCCBB', fullName: 'Facultad de Ciencias, Químicas y Farmacia' }
  ],
  'Ciencias de la Salud': [
    { id: 'facimed', name: 'FACIMED', fullName: 'Facultad de Ciencias de la Salud' },
    { id: 'medicina', name: 'FM', fullName: 'Facultad de Medicina' },
    { id: 'odontologia', name: 'FO', fullName: 'Facultad de Odontología' },
    { id: 'fisioterapia', name: 'FF', fullName: 'Facultad de Fisioterapia' },
    { id: 'nutricion', name: 'FN', fullName: 'Facultad de Ciencias de la Nutrición' }
  ],
  'Humanidades y Educación': [
    { id: 'face', name: 'FACE', fullName: 'Facultad de Ciencias de la Educación' },
    { id: 'idea', name: 'IDEA', fullName: 'Instituto de Educación Abierta' },
    { id: 'facom', name: 'FACOM', fullName: 'Facultad de Comunicación' },
    { id: 'humanidades', name: 'FH', fullName: 'Facultad de Humanidades' },
    { id: 'idiomas', name: 'FI', fullName: 'Facultad de Idiomas' }
  ],
  'Negocios y Economía': [
    { id: 'fcea', name: 'FCEA', fullName: 'Facultad de Ciencias Económicas y Administrativas' },
    { id: 'turismo', name: 'FT', fullName: 'Facultad de Turismo' },
    { id: 'postgrado', name: 'FP', fullName: 'Facultad de Postgrados' },
    { id: 'administracion', name: 'FA', fullName: 'Facultad de Administración' }
  ],
  'Arte y Diseño': [
    { id: 'arte', name: 'FARTE', fullName: 'Facultad de Arte' },
    { id: 'diseno', name: 'FD', fullName: 'Facultad de Diseño Gráfico' },
    { id: 'musica', name: 'FM', fullName: 'Facultad de Música' }
  ],
  'Especiales': [
    { id: 'medialab', name: 'MediaLab', fullName: 'Laboratorio de Multimedia' },
    { id: 'deportes', name: 'FD', fullName: 'Facultad de Deportes' },
    { id: 'extension', name: 'FE', fullName: 'Facultad de Extensión' }
  ]
};

const categorias = [
  { id: 'conferencias', name: 'Conferencias', description: 'Eventos académicos', count: 150, emoji: '🎤' },
  { id: 'graduaciones', name: 'Graduaciones', description: 'Ceremonias de graduación', count: 300, emoji: '🎓' },
  { id: 'reportajes', name: 'Reportajes', description: 'Documentales institucionales', count: 89, emoji: '📹' },
  { id: 'podcasts', name: 'Podcasts', description: 'Contenido de audio', count: 75, emoji: '🎧' },
  { id: 'galerias', name: 'Galerías', description: 'Fotografías de eventos', count: 450, emoji: '📸' },
  { id: 'destacados', name: 'Destacados', description: 'Contenido especial', count: 25, emoji: '⭐' }
];

interface FullExploreSectionProps {
  onFacultyClick?: (facultadId: string) => void;
  onCategoryClick?: (categoryId: string) => void;
  onFacultyCategoryClick?: (facultadId: string, categoryId: string) => void;
  className?: string;
}

export const FullExploreSection: React.FC<FullExploreSectionProps> = ({
  onFacultyClick,
  onCategoryClick,
  onFacultyCategoryClick,
  className = ''
}) => {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar facultades por búsqueda
  const filterFaculties = (faculties: Faculty[]) => {
    if (!searchTerm) return faculties;
    return faculties.filter(faculty => 
      faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleAreaClick = (area: string) => {
    setSelectedArea(selectedArea === area ? null : area);
    setSelectedFaculty(null);
  };

  const handleFacultyClick = (facultadId: string) => {
    setSelectedFaculty(selectedFaculty === facultadId ? null : facultadId);
    onFacultyClick?.(facultadId);
  };

  const handleCategoryClick = (categoryId: string) => {
    if (selectedFaculty) {
      onFacultyCategoryClick?.(selectedFaculty, categoryId);
    } else {
      onCategoryClick?.(categoryId);
    }
  };

  const getSelectedFacultyInfo = (): Faculty | null => {
    if (!selectedFaculty) return null;
    
    for (const area of Object.values(facultadesByArea)) {
      const faculty = area.find(f => f.id === selectedFaculty);
      if (faculty) return faculty;
    }
    return null;
  };

  const selectedFacultyInfo = getSelectedFacultyInfo();

  return (
    <section className={`py-20 bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Explora por Facultad y Categoría
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Encuentra contenido específico navegando por área académica, facultad y tipo de contenido.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Columna 1: Áreas Académicas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <BuildingOfficeIcon className="h-6 w-6 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Áreas Académicas</h3>
            </div>
            
            {Object.keys(facultadesByArea).map((area) => (
              <button
                key={area}
                onClick={() => handleAreaClick(area)}
                className={`w-full text-left p-4 rounded-lg border transition-all duration-200 group ${
                  selectedArea === area
                    ? 'border-gray-900 bg-white shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm mb-1">
                      {area}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {facultadesByArea[area].length} facultades
                    </p>
                  </div>
                  <ChevronRightIcon 
                    className={`h-4 w-4 text-gray-400 transition-transform ${
                      selectedArea === area ? 'rotate-90' : ''
                    }`} 
                  />
                </div>
              </button>
            ))}
          </div>

          {/* Columna 2: Facultades del Área Seleccionada */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <AcademicCapIcon className="h-6 w-6 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedArea ? `Facultades de ${selectedArea}` : 'Selecciona un Área'}
              </h3>
            </div>

            {selectedArea && (
              <>
                {/* Búsqueda de facultades */}
                <div className="relative mb-4">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar facultad..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2">
                  {filterFaculties(facultadesByArea[selectedArea]).map((faculty) => (
                    <button
                      key={faculty.id}
                      onClick={() => handleFacultyClick(faculty.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                        selectedFaculty === faculty.id
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <h4 className="font-medium text-gray-900 text-sm mb-1">
                        {faculty.name}
                      </h4>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {faculty.fullName}
                      </p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {!selectedArea && (
              <div className="text-center py-12 text-gray-500">
                <BuildingOfficeIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Selecciona un área académica para ver las facultades</p>
              </div>
            )}
          </div>

          {/* Columna 3: Categorías */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedFacultyInfo ? (
                <>Contenido de <span className="text-gray-700">{selectedFacultyInfo.name}</span></>
              ) : (
                'Categorías de Contenido'
              )}
            </h3>
            
            <div className="space-y-2">
              {categorias.map((categoria) => (
                <button
                  key={categoria.id}
                  onClick={() => handleCategoryClick(categoria.id)}
                  className="w-full p-4 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200 text-left group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">{categoria.emoji}</span>
                    <h4 className="font-medium text-gray-900 group-hover:text-gray-700 flex-1">
                      {categoria.name}
                    </h4>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {categoria.count}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 ml-8">
                    {categoria.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Columna 4: Acciones Rápidas */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Acceso Rápido</h3>
            
            {/* Estadísticas */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Contenido Total</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Videos</span>
                  <span className="font-semibold text-gray-900">1,500+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Facultades</span>
                  <span className="font-semibold text-gray-900">25</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Horas de contenido</span>
                  <span className="font-semibold text-gray-900">2,000+</span>
                </div>
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => onCategoryClick?.('destacados')}
                className="justify-start text-left"
              >
                ⭐ Contenido Destacado
              </Button>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => onCategoryClick?.('reciente')}
                className="justify-start text-left"
              >
                🕒 Más Reciente
              </Button>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => onCategoryClick?.('popular')}
                className="justify-start text-left"
              >
                🔥 Más Popular
              </Button>
            </div>

            {/* Búsqueda avanzada */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white">
              <h4 className="font-semibold mb-3">¿No encuentras algo?</h4>
              <p className="text-sm text-gray-300 mb-4">
                Usa la búsqueda avanzada para encontrar contenido específico.
              </p>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                className="bg-white text-gray-900 hover:bg-gray-100"
              >
                Búsqueda Avanzada
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};