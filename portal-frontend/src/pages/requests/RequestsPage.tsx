import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';

// Tipos para los datos
interface Request {
  id: string;
  title: string;
  type: string;
  status: string;
  date: string;
}

const RequestsPage: React.FC = () => {
  // Datos ficticios
  const requests: Request[] = [
    { id: '1', title: 'Grabación de conferencia', type: 'Producción', status: 'Pendiente', date: '15 mayo, 2025' },
    { id: '2', title: 'Sesión de fotografía institucional', type: 'Fotografía', status: 'Aprobada', date: '20 mayo, 2025' },
    { id: '3', title: 'Diseño de material promocional', type: 'Diseño', status: 'En proceso', date: '25 mayo, 2025' },
    { id: '4', title: 'Podcast académico', type: 'Audio', status: 'Completada', date: '10 mayo, 2025' },
  ];

  // Función para obtener el color según el estado
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'Aprobada': return 'bg-green-100 text-green-800';
      case 'En proceso': return 'bg-blue-100 text-blue-800';
      case 'Completada': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Mis Solicitudes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona y visualiza todas tus solicitudes de servicio a MediaLab
        </p>
      </div>

      <Card>
        <div className="flex justify-between mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar solicitudes..."
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Nueva Solicitud
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Título
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{request.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{request.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/requests/${request.id}`} className="text-indigo-600 hover:text-indigo-900">
                      Ver detalles
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default RequestsPage;