import React from 'react';
import Card from '../../components/common/Card';

const DashboardPage: React.FC = () => {
  // Datos ficticios para mostrar
  const stats = [
    { name: 'Solicitudes pendientes', value: '3' },
    { name: 'Proyectos activos', value: '2' },
    { name: 'Solicitudes completadas', value: '12' },
  ];

  const recentActivity = [
    { id: 1, type: 'project', name: 'Grabación curso virtual', date: '12 mayo, 2025' },
    { id: 2, type: 'request', name: 'Podcast académico', date: '5 mayo, 2025' },
    { id: 3, type: 'update', name: 'Actualización perfil', date: '2 mayo, 2025' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Bienvenido al Portal de Colaboradores</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona tus solicitudes y proyectos con MediaLab
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.name} className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stat.value}</dd>
          </Card>
        ))}
      </div>

      {/* Actividad reciente - Añadido ícono */}
      <Card title="Actividad Reciente">
        <div className="flow-root">
          <ul className="-my-5 divide-y divide-gray-200">
            {recentActivity.map((item) => (
              <li key={item.id} className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <span className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      {item.type === 'project' ? 'P' : item.type === 'request' ? 'R' : 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-sm text-gray-500 truncate">{item.date}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;