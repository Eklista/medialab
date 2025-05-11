import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import { ArrowLeftIcon, PaperClipIcon } from '@heroicons/react/24/outline';

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  // En un caso real, cargarías los datos del proyecto según el ID
  const project = {
    id,
    title: 'Diseño de material multimedia para curso virtual',
    type: 'Diseño',
    status: 'En progreso',
    progress: 60,
    startDate: '1 mayo, 2025',
    endDate: '30 mayo, 2025',
    description: 'Creación de material multimedia interactivo para el nuevo curso virtual de programación avanzada.',
    client: 'Facultad de Ingeniería',
    manager: 'David Castillo',
    team: ['Ana Diseñadora', 'Carlos Programador', 'Elena UX'],
    tasks: [
      { id: 1, name: 'Diseño de interfaz', status: 'Completado', assignee: 'Ana Diseñadora' },
      { id: 2, name: 'Desarrollo de interactividad', status: 'En progreso', assignee: 'Carlos Programador' },
      { id: 3, name: 'Pruebas de usabilidad', status: 'Pendiente', assignee: 'Elena UX' },
    ],
    updates: [
      { id: 1, author: 'David Castillo', date: '5 mayo, 2025', text: 'Hemos finalizado la primera fase del proyecto. Se han entregado los primeros prototipos.' },
      { id: 2, author: 'Ana Diseñadora', date: '10 mayo, 2025', text: 'Interfaz principal completada. Esperando feedback para continuar con las secciones internas.' }
    ],
    files: [
      { id: 1, name: 'Diseño-interfaz-v1.pdf', size: '2.5 MB', date: '5 mayo, 2025' },
      { id: 2, name: 'Prototipo-interactivo.zip', size: '15 MB', date: '10 mayo, 2025' },
    ]
  };

  // Función para obtener el color según el estado de la tarea
  const getTaskStatusColor = (status: string): string => {
    switch (status) {
      case 'Completado': return 'bg-green-100 text-green-800';
      case 'En progreso': return 'bg-blue-100 text-blue-800';
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/projects" className="mr-4 p-2 rounded-full hover:bg-gray-200">
            <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{project.title}</h1>
            <div className="flex items-center mt-1">
              <span className="text-sm text-gray-500">{project.type}</span>
              <span className="mx-2 text-gray-300">•</span>
              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                {project.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Descripción del proyecto">
            <p className="text-gray-700">{project.description}</p>
            
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500">Progreso general</h4>
              <div className="mt-2 flex items-center">
                <span className="text-sm font-medium text-gray-700 mr-2">{project.progress}%</span>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Tareas">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarea
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Responsable
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {project.tasks.map((task) => (
                    <tr key={task.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{task.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{task.assignee}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTaskStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Actualizaciones">
            <div className="flow-root">
              <ul className="-mb-8">
                {project.updates.map((update, index) => (
                  <li key={update.id}>
                    <div className="relative pb-8">
                      {index !== project.updates.length - 1 ? (
                        <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                      ) : null}
                      <div className="relative flex items-start space-x-3">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
                            <span className="text-white font-medium">{update.author.charAt(0)}</span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div>
                            <div className="text-sm">
                              <span className="font-medium text-gray-900">{update.author}</span>
                            </div>
                            <p className="mt-0.5 text-sm text-gray-500">{update.date}</p>
                          </div>
                          <div className="mt-2 text-sm text-gray-700">
                            <p>{update.text}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6">
              <div className="flex space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 font-medium">UC</span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div>
                    <textarea
                      rows={3}
                      className="shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md"
                      placeholder="Añadir un comentario o actualización..."
                    ></textarea>
                  </div>
                  <div className="mt-3 flex items-center justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Comentar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Detalles">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Cliente</dt>
                <dd className="mt-1 text-sm text-gray-900">{project.client}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Responsable</dt>
                <dd className="mt-1 text-sm text-gray-900">{project.manager}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de inicio</dt>
                <dd className="mt-1 text-sm text-gray-900">{project.startDate}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de finalización</dt>
                <dd className="mt-1 text-sm text-gray-900">{project.endDate}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Equipo">
            <ul className="divide-y divide-gray-200">
              {project.team.map((member, index) => (
                <li key={index} className="py-3 flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-indigo-200 flex items-center justify-center">
                      <span className="text-indigo-600 font-medium">{member.charAt(0)}</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{member}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Archivos">
            <ul className="divide-y divide-gray-200">
              {project.files.map((file) => (
                <li key={file.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <PaperClipIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{file.name}</span>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <span className="text-xs text-gray-500">{file.size}</span>
                    <button className="ml-2 text-indigo-600 hover:text-indigo-900 text-sm">
                      Descargar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;