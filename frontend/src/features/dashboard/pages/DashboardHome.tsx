// src/features/dashboard/pages/DashboardHome.tsx

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardCard from '../components/ui/DashboardCard';
import StatCard from '../components/cards/StatCard';
import Badge from '../components/ui/Badge';
import { useAuth } from '../../auth/hooks/useAuth';
import { userService } from '../../../services';
import { parseDate, formatBirthday, getDaysUntilBirthday, formatRelativeTime } from '../../../utils/dateUtils';

// Iconos
import {
  CheckCircleIcon,
  ClockIcon,
  QueueListIcon,
  CakeIcon,
  TrophyIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  BellIcon
} from '@heroicons/react/24/outline';

// Interfaces para datos de muestra
interface BirthdayUser {
  id: number;
  name: string;
  profileImage?: string;
  birthDate: Date;
  daysUntilBirthday: number;
  initials: string;
}

interface TaskItem {
  id: string;
  title: string;
  dueDate: string;
  status: 'Pendiente' | 'En progreso' | 'Completada';
  priority: 'Baja' | 'Media' | 'Alta';
}

interface ActivityItem {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  action: string;
  timestamp: string;
  target?: string;
}

const DashboardHome: React.FC = () => {
  const { state } = useAuth();
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<BirthdayUser[]>([]);
  const [isLoadingBirthdays, setIsLoadingBirthdays] = useState(true);
  const [birthdayError, setBirthdayError] = useState<string | null>(null);
  
  // Función para generar iniciales a partir del nombre
  const getInitials = (name: string): string => {
    if (!name) return 'U';
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  // Cargar los usuarios y filtrar los próximos cumpleaños
  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        setIsLoadingBirthdays(true);
        setBirthdayError(null);
        
        // Obtener todos los usuarios
        const users = await userService.getUsers();
        
        // Filtrar usuarios con fecha de nacimiento y calcular días para el próximo cumpleaños
        const validBirthdayUsers = users
          .filter(user => user.birth_date)
          .map(user => {
            // Parsear la fecha usando la utilidad central
            const birthDate = parseDate(user.birth_date!);
            if (!birthDate) return null;
            
            const daysUntilBirthday = getDaysUntilBirthday(birthDate);
            const name = `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim();
            
            return {
              id: user.id,
              name: name,
              profileImage: user.profileImage || user.profile_image,
              birthDate: birthDate,
              daysUntilBirthday,
              initials: getInitials(name)
            };
          })
          .filter(Boolean) // Filtrar elementos nulos
          // Ordenar por proximidad de cumpleaños
          .sort((a, b) => a!.daysUntilBirthday - b!.daysUntilBirthday)
          // Tomar los primeros 3
          .slice(0, 3) as BirthdayUser[];
        
        setUpcomingBirthdays(validBirthdayUsers);
      } catch (error) {
        console.error('Error al cargar cumpleaños:', error);
        setBirthdayError('No se pudieron cargar los cumpleaños');
      } finally {
        setIsLoadingBirthdays(false);
      }
    };
    
    fetchBirthdays();
  }, []);

  // Función para generar color de fondo basado en iniciales
  const getInitialBackgroundColor = (initials: string): string => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    
    // Usar iniciales para determinar el color de manera consistente
    const charCode = initials.charCodeAt(0) || 65;
    return colors[charCode % colors.length];
  };
  
  // Datos de muestra para asignaciones (serán reemplazados por datos reales)
  const assignmentStats = [
    {
      title: "Asignaciones Completadas",
      value: "26",
      icon: <CheckCircleIcon className="h-6 w-6" />,
      change: { value: 5, isPositive: true },
      bgColor: "bg-green-50"
    },
    {
      title: "Asignaciones en Progreso",
      value: "12",
      icon: <ClockIcon className="h-6 w-6" />,
      change: { value: 2, isPositive: true },
      bgColor: "bg-blue-50"
    },
    {
      title: "Asignaciones Pendientes",
      value: "8",
      icon: <QueueListIcon className="h-6 w-6" />,
      change: { value: 3, isPositive: false },
      bgColor: "bg-amber-50"
    }
  ];

  // Tareas pendientes de muestra
  const pendingTasks: TaskItem[] = [
    { 
      id: "task-1", 
      title: "Revisar guión para programa semanal", 
      dueDate: "2025-05-20", 
      status: "Pendiente", 
      priority: "Alta" 
    },
    { 
      id: "task-2", 
      title: "Preparar equipos para transmisión de conferencia", 
      dueDate: "2025-05-21", 
      status: "Pendiente", 
      priority: "Media" 
    },
    { 
      id: "task-3", 
      title: "Editar podcast episodio #45", 
      dueDate: "2025-05-23", 
      status: "Pendiente", 
      priority: "Media" 
    },
    { 
      id: "task-4", 
      title: "Actualizar inventario de equipo", 
      dueDate: "2025-05-25", 
      status: "Pendiente", 
      priority: "Baja" 
    }
  ];

  // Actividad reciente de muestra
  const recentActivity: ActivityItem[] = [
    {
      id: "activity-1",
      user: { 
        name: "Carlos Ramírez", 
        avatar: "/api/placeholder/40/40" 
      },
      action: "completó la transmisión en vivo",
      target: "Conferencia de Bienvenida",
      timestamp: "Hace 2 horas"
    },
    {
      id: "activity-2",
      user: { 
        name: "María Fernández", 
        avatar: "/api/placeholder/40/40" 
      },
      action: "actualizó el estado del proyecto",
      target: "Video institucional",
      timestamp: "Hace 4 horas"
    },
    {
      id: "activity-3",
      user: { 
        name: "Juan López", 
        avatar: "/api/placeholder/40/40" 
      },
      action: "asignó un nuevo recurso a",
      target: "Podcast semanal",
      timestamp: "Hace 5 horas"
    },
    {
      id: "activity-4",
      user: { 
        name: "Lucía Méndez", 
        avatar: "/api/placeholder/40/40" 
      },
      action: "creó una nueva solicitud de servicio",
      timestamp: "Hace 1 día"
    },
    {
      id: "activity-5",
      user: { 
        name: "Roberto García", 
        avatar: "/api/placeholder/40/40" 
      },
      action: "completó la edición de video",
      target: "Entrevista al Decano",
      timestamp: "Hace 1 día"
    }
  ];

  return (
    <DashboardLayout>
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          ¡Bienvenido, {state.user?.firstName || ''}!
        </h1>
        <p className="text-gray-600">Aquí está un resumen de las actividades y asignaciones del MediaLab</p>
      </div>
      
      {/* Primera Fila: Quick Actions - Asignaciones */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Resumen de Asignaciones</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {assignmentStats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              change={stat.change}
              bgColor={stat.bgColor}
            />
          ))}
        </div>
      </div>
      
      {/* Segunda Fila: Colaborador del mes y Próximos cumpleaños */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Colaborador del mes */}
        <DashboardCard
          title="Colaborador del Mes"
          subtitle="Mejor desempeño en el último mes"
          headerAction={
            <div className="flex items-center text-black">
              <TrophyIcon className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">Mayo 2025</span>
            </div>
          }
        >
          <div className="flex items-center p-4">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-lg bg-blue-600">
                  AM
                </div>
                <span className="absolute bottom-0 right-0 bg-yellow-400 rounded-full p-1">
                  <TrophyIcon className="h-4 w-4 text-white" />
                </span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Ana Martínez</h3>
              <p className="text-sm text-gray-500">Área de Transmisión</p>
              <div className="mt-1 flex space-x-1">
                <Badge variant="primary">10 Producciones</Badge>
                <Badge variant="success">5 Transmisiones en vivo</Badge>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Destacó por su excelente manejo técnico y atención al cliente durante las transmisiones del mes.
              </p>
            </div>
          </div>
        </DashboardCard>

        {/* Próximos cumpleaños */}
        <DashboardCard
          title="Próximos Cumpleaños"
          subtitle="Celebremos juntos estos momentos especiales"
          headerAction={
            <div className="flex items-center text-black">
              <CakeIcon className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">Próximos eventos</span>
            </div>
          }
        >
          {isLoadingBirthdays ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : birthdayError ? (
            <div className="text-center p-4 text-gray-500">{birthdayError}</div>
          ) : upcomingBirthdays.length === 0 ? (
            <div className="text-center p-4 text-gray-500">
              No hay cumpleaños próximos
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {upcomingBirthdays.map((user) => (
                <li key={user.id} className="py-4 flex items-center">
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="h-12 w-12 rounded-full object-cover mr-4"
                      onError={(e) => {
                        // Si falla la carga de la imagen, mostrar las iniciales
                        (e.target as HTMLElement).style.display = 'none';
                        const parent = (e.target as HTMLElement).parentElement;
                        if (parent) {
                          const initialsEl = document.createElement('div');
                          initialsEl.className = `h-12 w-12 rounded-full mr-4 flex items-center justify-center text-white font-medium text-sm ${getInitialBackgroundColor(user.initials)}`;
                          initialsEl.textContent = user.initials;
                          parent.appendChild(initialsEl);
                        }
                      }}
                    />
                  ) : (
                    <div className={`h-12 w-12 rounded-full mr-4 flex items-center justify-center text-white font-medium text-sm ${getInitialBackgroundColor(user.initials)}`}>
                      {user.initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <CalendarDaysIcon className="h-4 w-4 mr-1" />
                      {formatBirthday(user.birthDate)}
                    </p>
                  </div>
                  <div className="ml-2">
                    <Badge 
                      variant={
                        user.daysUntilBirthday === 0 ? "success" :
                        user.daysUntilBirthday <= 7 ? "warning" : 
                        user.daysUntilBirthday <= 30 ? "info" :
                        "secondary"
                      }
                    >
                      {user.daysUntilBirthday === 0 ? "¡Hoy!" : 
                       user.daysUntilBirthday === 1 ? "¡Mañana!" : 
                       `En ${user.daysUntilBirthday} días`}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      </div>
      
      {/* Tercera Fila: Tareas pendientes y Actividad reciente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tareas pendientes */}
        <DashboardCard
          title="Tareas Pendientes"
          subtitle="Asignaciones que requieren tu atención"
          headerAction={
            <div className="flex items-center text-black">
              <DocumentTextIcon className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">4 pendientes</span>
            </div>
          }
        >
          <div className="overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {pendingTasks.map((task) => (
                <li key={task.id} className="py-3 px-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {task.title}
                      </p>
                      <div className="flex items-center mt-1">
                        <CalendarDaysIcon className="h-4 w-4 text-gray-400 mr-1" />
                        <p className="text-xs text-gray-500">
                          Fecha límite: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <Badge 
                        variant={
                          task.priority === "Alta" ? "danger" :
                          task.priority === "Media" ? "warning" : "secondary"
                        }
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="py-3 px-4 border-t border-gray-200">
            <a href="#" className="text-sm font-medium text-black hover:text-gray-700 flex items-center">
              <span>Ver todas las tareas</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </DashboardCard>
        
        {/* Actividad reciente */}
        <DashboardCard
          title="Actividad Reciente"
          subtitle="Lo que está pasando en MediaLab"
          headerAction={
            <div className="flex items-center text-black">
              <BellIcon className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">Últimas 24h</span>
            </div>
          }
        >
          <div className="overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {recentActivity.map((activity) => (
                <li key={activity.id} className="py-3 px-4 hover:bg-gray-50">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${
                        activity.id === "activity-1" ? "bg-indigo-500" :
                        activity.id === "activity-2" ? "bg-emerald-500" :
                        activity.id === "activity-3" ? "bg-amber-500" :
                        activity.id === "activity-4" ? "bg-rose-500" :
                        "bg-blue-500"
                      }`}>
                        {getInitials(activity.user.name)}
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{activity.user.name}</span>
                        {" "}
                        <span className="text-gray-700">{activity.action}</span>
                        {activity.target && (
                          <span>
                            {" "}
                            <span className="font-medium text-gray-900">{activity.target}</span>
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {formatRelativeTime(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="py-3 px-4 border-t border-gray-200">
            <a href="#" className="text-sm font-medium text-black hover:text-gray-700 flex items-center">
              <span>Ver toda la actividad</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
};

export default DashboardHome;