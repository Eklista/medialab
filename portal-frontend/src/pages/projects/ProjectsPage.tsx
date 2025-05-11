import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';

interface Project {
  id: string;
  title: string;
  type: string;
  status: string;
  progress: number;
  startDate: string;
  endDate: string;
}

const ProjectsPage: React.FC = () => {
  // Datos ficticios
  const projects: Project[] = [
    {
      id: '1',
      title: 'Diseño de material multimedia para curso virtual',
      type: 'Diseño',
      status: 'En progreso',
      progress: 60,
      startDate: '1 mayo, 2025',
      endDate: '30 mayo, 2025'
    },
    {
      id: '2',
      title: 'Grabación de podcast académico',
      type: 'Audio',
      status: 'En progreso',
      progress: 30,
      startDate: '10 mayo, 2025',
      endDate: '25 mayo, 2025'
    },
    {
      id: '3',
      title: 'Video promocional para nueva carrera',
      type: 'Video',
      status: 'Completado',
      progress: 100,
      startDate: '1 abril, 2025',
      endDate: '30 abril, 2025'
    },
    {
      id: '4',
      title: 'Actualización de plataforma de aprendizaje',
      type: 'Desarrollo',
      status: 'Pausado',
      progress: 45,
      startDate: '15 marzo, 2025',
      endDate: '15 junio, 2025'
    },
    {
      id: '5',
      title: 'Creación de infografías para redes sociales',
      type: 'Diseño',
      status: 'Por iniciar',
      progress: 0,
      startDate: '1 junio, 2025',
      endDate: '15 junio, 2025'
    }
  ];

  // Estados para filtros
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Obtener tipos y estados únicos para los filtros
  const projectTypes = [...new Set(projects.map(project => project.type))];
  const projectStatuses = [...new Set(projects.map(project => project.status))];

  // Función para obtener el color según el estado
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'En progreso': return 'bg-blue-100 text-blue-800';
      case 'Completado': return 'bg-green-100 text-green-800';
      case 'Pausado': return 'bg-yellow-100 text-yellow-800';
      case 'Por iniciar': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Función para obtener el color de la barra de progreso
  const getProgressColor = (progress: number): string => {
    if (progress === 100) return 'bg-green-600';
    if (progress >= 70) return 'bg-blue-600';
    if (progress >= 30) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  // Efecto para filtrar proyectos
  useEffect(() => {
    let result = projects;
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      result = result.filter(project => 
        project.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrar por tipo
    if (filterType) {
      result = result.filter(project => project.type === filterType);
    }
    
    // Filtrar por estado
    if (filterStatus) {
      result = result.filter(project => project.status === filterStatus);
    }
    
    setFilteredProjects(result);
  }, [searchTerm, filterType, filterStatus]);

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('');
    setFilterStatus('');
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Mis Proyectos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Visualiza y da seguimiento a tus proyectos con MediaLab
        </p>
      </div>

      {/* Filtros y búsqueda */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
          <div className="mb-4 md:mb-0 flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Buscar proyecto</label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título..."
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mb-4 md:mb-0 w-full md:w-48">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              id="type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Todos los tipos</option>
              {projectTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="mb-4 md:mb-0 w-full md:w-48">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              id="status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Todos los estados</option>
              {projectStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="md:self-end">
            <button
              onClick={clearFilters}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Contador de proyectos */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-gray-500">
          Mostrando <span className="font-medium">{filteredProjects.length}</span> de <span className="font-medium">{projects.length}</span> proyectos
        </p>
        <Link
          to="/projects/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo proyecto
        </Link>
      </div>

      {/* Lista de proyectos */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron proyectos</h3>
          <p className="mt-1 text-sm text-gray-500">
            Prueba con diferentes filtros o crea un nuevo proyecto.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    <Link to={`/projects/${project.id}`} className="hover:underline">
                      {project.title}
                    </Link>
                  </h3>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{project.type}</span>
                    <span className="text-sm text-gray-300">•</span>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    <span>{project.startDate}</span> - <span>{project.endDate}</span>
                  </div>
                </div>
                <div className="mt-4 lg:mt-0 flex-shrink-0">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 mr-2">{project.progress}%</span>
                    <div className="w-48 bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`${getProgressColor(project.progress)} h-2.5 rounded-full`} 
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end space-x-2">
                    <button className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <Link
                      to={`/projects/${project.id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                    >
                      Ver detalles
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;