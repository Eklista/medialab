import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  // En un caso real, cargarías los datos de la solicitud según el ID
  const request = {
    id,
    title: 'Grabación de conferencia',
    type: 'Producción',
    status: 'Pendiente',
    date: '15 mayo, 2025',
    description: 'Grabación de conferencia internacional sobre tecnologías emergentes para su posterior edición y publicación.',
    location: 'Auditorio A, Edificio Central',
    requestDate: '1 mayo, 2025',
    comments: [
      { id: 1, author: 'Ana Técnico', date: '2 mayo, 2025', text: 'Revisando disponibilidad de equipos para esa fecha' },
      { id: 2, author: 'Carlos Productor', date: '3 mayo, 2025', text: 'Necesitamos más detalles sobre el equipo de sonido requerido' }
    ]
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/requests" className="mr-4 p-2 rounded-full hover:bg-gray-200">
            <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{request.title}</h1>
            <p className="text-sm text-gray-500">Solicitud #{request.id}</p>
          </div>
        </div>
        <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800`}>
          {request.status}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Detalles de la solicitud">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Tipo de servicio</dt>
              <dd className="mt-1 text-sm text-gray-900">{request.type}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Fecha del evento</dt>
              <dd className="mt-1 text-sm text-gray-900">{request.date}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Ubicación</dt>
              <dd className="mt-1 text-sm text-gray-900">{request.location}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Fecha de solicitud</dt>
              <dd className="mt-1 text-sm text-gray-900">{request.requestDate}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Descripción</dt>
              <dd className="mt-1 text-sm text-gray-900">{request.description}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Comentarios y actualizaciones">
          <div className="flow-root">
            <ul className="-mb-8">
              {request.comments.map((comment, commentIdx) => (
                <li key={comment.id}>
                  <div className="relative pb-8">
                    {commentIdx !== request.comments.length - 1 ? (
                      <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                    ) : null}
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
                          <span className="text-white font-medium">{comment.author.charAt(0)}</span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">{comment.author}</span>
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500">{comment.date}</p>
                        </div>
                        <div className="mt-2 text-sm text-gray-700">
                          <p>{comment.text}</p>
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
                    placeholder="Añadir un comentario..."
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
    </div>
  );
};

export default RequestDetailPage;